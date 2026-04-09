import { Router, Response } from "express";
import { query } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

const PRICE_PER_SALE = 99;
const PIPELINE_STAGES = ['novo','tentativa_contato','qualificado','negociando','pago','entregue','upsell','follow_up','perdido'];

function getPeriodDates(period: string | any) {
  const days = parseInt(period as string) || 30;
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 86400000);
  const prevPeriodStart = new Date(periodStart.getTime() - days * 86400000);
  return { days, now, periodStart, prevPeriodStart };
}

// GET /overview
router.get('/overview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart, prevPeriodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();
    const pps = prevPeriodStart.toISOString();

    const [leadsTotal, leadsPeriod, leadsPrev, paidPeriod, paidPrev, totalPaid, totalDelivered, revTotal] = await Promise.all([
      query('SELECT COUNT(*)::int as c FROM leads'),
      query('SELECT COUNT(*)::int as c FROM leads WHERE created_at >= $1', [ps]),
      query('SELECT COUNT(*)::int as c FROM leads WHERE created_at >= $1 AND created_at < $2', [pps, ps]),
      query("SELECT COUNT(*)::int as c FROM leads WHERE pipeline_stage IN ('pago','entregue','upsell') AND updated_at >= $1", [ps]),
      query("SELECT COUNT(*)::int as c FROM leads WHERE pipeline_stage IN ('pago','entregue','upsell') AND updated_at >= $1 AND updated_at < $2", [pps, ps]),
      query("SELECT COUNT(*)::int as c FROM leads WHERE pipeline_stage IN ('pago','entregue','upsell')"),
      query("SELECT COUNT(*)::int as c FROM leads WHERE pipeline_stage IN ('entregue','upsell')"),
      query("SELECT COALESCE(SUM(amount),0)::numeric as total FROM payments WHERE status = 'approved'"),
    ]);

    const lp = leadsPeriod.rows[0].c;
    const lpp = leadsPrev.rows[0].c;
    const pp = paidPeriod.rows[0].c;
    const ppv = paidPrev.rows[0].c;
    const revPeriod = pp * PRICE_PER_SALE;
    const revPrev = ppv * PRICE_PER_SALE;

    const pctChange = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : parseFloat((((cur - prev) / prev) * 100).toFixed(1));
    const convRate = (paid: number, leads: number) => leads === 0 ? 0 : parseFloat(((paid / leads) * 100).toFixed(1));

    const crCur = convRate(pp, lp);
    const crPrev = convRate(ppv, lpp);

    res.json({
      leads_total: leadsTotal.rows[0].c,
      leads_period: lp,
      leads_prev_period: lpp,
      leads_change_pct: pctChange(lp, lpp),
      revenue_total: parseFloat(revTotal.rows[0].total),
      revenue_period: revPeriod,
      revenue_prev_period: revPrev,
      revenue_change_pct: pctChange(revPeriod, revPrev),
      conversion_rate: crCur,
      conversion_rate_prev: crPrev,
      conversion_change_pct: pctChange(crCur, crPrev),
      avg_ticket: PRICE_PER_SALE,
      total_paid: totalPaid.rows[0].c,
      total_delivered: totalDelivered.rows[0].c,
    });
  } catch (err) { console.error('Analytics overview error:', err); res.status(500).json({ error: 'Erro ao buscar overview' }); }
});

// GET /funnel
router.get('/funnel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();

    const result = await query("SELECT pipeline_stage, COUNT(*)::int as count FROM leads WHERE created_at >= $1 GROUP BY pipeline_stage", [ps]);
    const countMap: Record<string, number> = {};
    let total = 0;
    result.rows.forEach((r: any) => { countMap[r.pipeline_stage] = r.count; total += r.count; });

    const timeResult = await query("SELECT pipeline_stage, AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::numeric as avg_hours FROM leads WHERE created_at >= $1 GROUP BY pipeline_stage", [ps]);
    const timeMap: Record<string, number> = {};
    timeResult.rows.forEach((r: any) => { timeMap[r.pipeline_stage] = parseFloat(parseFloat(r.avg_hours).toFixed(1)); });

    const funnel = PIPELINE_STAGES.map(stage => ({
      stage,
      count: countMap[stage] || 0,
      pct_of_total: total === 0 ? 0 : parseFloat((((countMap[stage] || 0) / total) * 100).toFixed(1)),
      avg_time_hours: timeMap[stage] || 0,
    }));

    res.json({ total, stages: funnel });
  } catch (err) { console.error('Analytics funnel error:', err); res.status(500).json({ error: 'Erro ao buscar funil' }); }
});

// GET /chart
router.get('/chart', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30', metric = 'leads' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();
    let sql;

    switch (metric) {
      case 'revenue':
        sql = "SELECT DATE(paid_at) as date, COALESCE(SUM(amount),0)::numeric as value FROM payments WHERE status = 'approved' AND paid_at >= $1 GROUP BY DATE(paid_at) ORDER BY date";
        break;
      case 'conversions':
        sql = "SELECT DATE(updated_at) as date, COUNT(*)::int as value FROM leads WHERE pipeline_stage IN ('pago','entregue','upsell') AND updated_at >= $1 GROUP BY DATE(updated_at) ORDER BY date";
        break;
      default:
        sql = 'SELECT DATE(created_at) as date, COUNT(*)::int as value FROM leads WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date';
    }

    const result = await query(sql, [ps]);
    res.json(result.rows.map((r: any) => ({ date: r.date, value: parseFloat(r.value) })));
  } catch (err) { console.error('Analytics chart error:', err); res.status(500).json({ error: 'Erro ao buscar dados do grafico' }); }
});

// GET /sources
router.get('/sources', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();

    const result = await query(`
      SELECT
        COALESCE(utm_source, 'direto') as source,
        COALESCE(utm_medium, '(none)') as medium,
        COALESCE(utm_campaign, '(none)') as campaign,
        COUNT(*)::int as leads,
        COUNT(*) FILTER (WHERE pipeline_stage IN ('qualificado','negociando','pago','entregue','upsell'))::int as qualified,
        COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::int as paid,
        (COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell')) * ${PRICE_PER_SALE})::numeric as revenue,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::numeric / COUNT(*)) * 100, 1)
          ELSE 0
        END as conversion_rate
      FROM leads
      WHERE created_at >= $1
      GROUP BY utm_source, utm_medium, utm_campaign
      ORDER BY leads DESC
    `, [ps]);

    const sources = result.rows.map((r: any) => ({ ...r, revenue: parseFloat(r.revenue), conversion_rate: parseFloat(r.conversion_rate) }));
    res.json({ sources });
  } catch (err) { console.error('Analytics sources error:', err); res.status(500).json({ error: 'Erro ao buscar fontes' }); }
});

// GET /performance
router.get('/performance', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();

    const result = await query(`
      SELECT
        COALESCE(utm_content, '(none)') as variant_label,
        COALESCE(utm_source, 'direto') as source,
        COALESCE(utm_campaign, '(none)') as campaign,
        COUNT(*)::int as leads,
        COUNT(*) FILTER (WHERE pipeline_stage IN ('qualificado','negociando','pago','entregue','upsell'))::int as qualified,
        COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::int as paid,
        (COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell')) * ${PRICE_PER_SALE})::numeric as revenue,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::numeric / COUNT(*)) * 100, 1)
          ELSE 0
        END as conversion_rate,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((COUNT(*) FILTER (WHERE pipeline_stage IN ('qualificado','negociando','pago','entregue','upsell'))::numeric / COUNT(*)) * 100, 1)
          ELSE 0
        END as qualified_rate
      FROM leads
      WHERE created_at >= $1
      GROUP BY utm_content, utm_source, utm_campaign
      ORDER BY leads DESC
    `, [ps]);

    const variants = result.rows.map((r: any) => ({ ...r, revenue: parseFloat(r.revenue), conversion_rate: parseFloat(r.conversion_rate), qualified_rate: parseFloat(r.qualified_rate) }));
    const totals = variants.reduce((acc: any, r: any) => {
      acc.leads += r.leads; acc.qualified += r.qualified; acc.paid += r.paid; acc.revenue += r.revenue;
      return acc;
    }, { variant_label: 'TOTAL', source: '-', campaign: '-', leads: 0, qualified: 0, paid: 0, revenue: 0 });
    totals.conversion_rate = totals.leads > 0 ? parseFloat(((totals.paid / totals.leads) * 100).toFixed(1)) : 0;
    totals.qualified_rate = totals.leads > 0 ? parseFloat(((totals.qualified / totals.leads) * 100).toFixed(1)) : 0;

    res.json({ variants, totals });
  } catch (err) { console.error('Analytics performance error:', err); res.status(500).json({ error: 'Erro ao buscar performance' }); }
});

// GET /pipeline-velocity
router.get('/pipeline-velocity', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();

    const result = await query(`
      SELECT pipeline_stage, AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric as avg_hours, COUNT(*)::int as sample_size
      FROM leads WHERE created_at >= $1 AND pipeline_stage IS NOT NULL GROUP BY pipeline_stage
    `, [ps]);

    const velocityMap: Record<string, any> = {};
    result.rows.forEach((r: any) => {
      velocityMap[r.pipeline_stage] = { avg_hours: parseFloat(parseFloat(r.avg_hours).toFixed(1)), sample_size: r.sample_size };
    });

    const velocity = PIPELINE_STAGES.map(stage => ({
      stage,
      avg_hours: velocityMap[stage]?.avg_hours || 0,
      sample_size: velocityMap[stage]?.sample_size || 0,
    }));

    res.json({ stages: velocity });
  } catch (err) { console.error('Analytics pipeline-velocity error:', err); res.status(500).json({ error: 'Erro ao buscar velocidade do pipeline' }); }
});

// POST /ab-tests
router.post('/ab-tests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, metric_primary, variants, status } = req.body;
    if (!name || !variants || !Array.isArray(variants) || variants.length < 2) {
      return res.status(400).json({ error: 'Nome e pelo menos 2 variantes sao obrigatorios' });
    }
    const result = await query(
      `INSERT INTO ab_tests (name, description, status, metric_primary, variants) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description || null, status || 'active', metric_primary || 'conversion_rate', JSON.stringify(variants)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error('Analytics create ab-test error:', err); res.status(500).json({ error: 'Erro ao criar teste A/B' }); }
});

// GET /ab-tests
router.get('/ab-tests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tests = await query('SELECT * FROM ab_tests ORDER BY created_at DESC');
    const enriched = await Promise.all(tests.rows.map(async (test: any) => {
      const variants = test.variants || [];
      const utmValues = variants.map((v: any) => v.utm_content).filter(Boolean);
      let variantStats: any[] = [];
      if (utmValues.length > 0) {
        const placeholders = utmValues.map((_: any, i: number) => '$' + (i + 1)).join(',');
        const statsResult = await query(`
          SELECT COALESCE(utm_content, '(none)') as utm_content, COUNT(*)::int as leads,
            COUNT(*) FILTER (WHERE pipeline_stage IN ('qualificado','negociando','pago','entregue','upsell'))::int as qualified,
            COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::int as paid,
            (COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell')) * ${PRICE_PER_SALE})::numeric as revenue,
            CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::numeric / COUNT(*)) * 100, 1) ELSE 0 END as conversion_rate
          FROM leads WHERE utm_content IN (${placeholders}) GROUP BY utm_content
        `, utmValues);
        const statsMap: Record<string, any> = {};
        statsResult.rows.forEach((r: any) => { statsMap[r.utm_content] = r; });
        variantStats = variants.map((v: any) => ({ ...v, stats: statsMap[v.utm_content] || { leads: 0, qualified: 0, paid: 0, revenue: 0, conversion_rate: 0 } }));
      } else {
        variantStats = variants.map((v: any) => ({ ...v, stats: { leads: 0, qualified: 0, paid: 0, revenue: 0, conversion_rate: 0 } }));
      }
      return { ...test, variants: variantStats };
    }));
    res.json(enriched);
  } catch (err) { console.error('Analytics list ab-tests error:', err); res.status(500).json({ error: 'Erro ao listar testes A/B' }); }
});

// GET /ab-tests/:id
router.get('/ab-tests/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const testResult = await query('SELECT * FROM ab_tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) return res.status(404).json({ error: 'Teste A/B nao encontrado' });
    const test = testResult.rows[0];
    const variants = test.variants || [];
    const utmValues = variants.map((v: any) => v.utm_content).filter(Boolean);
    let variantStats: any[] = [];
    if (utmValues.length > 0) {
      const placeholders = utmValues.map((_: any, i: number) => '$' + (i + 1)).join(',');
      const statsResult = await query(`
        SELECT COALESCE(utm_content, '(none)') as utm_content, COUNT(*)::int as leads,
          COUNT(*) FILTER (WHERE pipeline_stage IN ('qualificado','negociando','pago','entregue','upsell'))::int as qualified,
          COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::int as paid,
          (COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell')) * ${PRICE_PER_SALE})::numeric as revenue,
          CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::numeric / COUNT(*)) * 100, 1) ELSE 0 END as conversion_rate
        FROM leads WHERE utm_content IN (${placeholders}) GROUP BY utm_content
      `, utmValues);
      const statsMap: Record<string, any> = {};
      statsResult.rows.forEach((r: any) => { statsMap[r.utm_content] = r; });
      variantStats = variants.map((v: any) => ({ ...v, stats: statsMap[v.utm_content] || { leads: 0, qualified: 0, paid: 0, revenue: 0, conversion_rate: 0 } }));
    } else {
      variantStats = variants.map((v: any) => ({ ...v, stats: { leads: 0, qualified: 0, paid: 0, revenue: 0, conversion_rate: 0 } }));
    }
    res.json({ ...test, variants: variantStats });
  } catch (err) { console.error('Analytics ab-test detail error:', err); res.status(500).json({ error: 'Erro ao buscar teste A/B' }); }
});

// PATCH /ab-tests/:id
router.patch('/ab-tests/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, winner, ended_at, name, description, metric_primary, variants } = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (status !== undefined) { fields.push('status = $' + idx++); values.push(status); }
    if (winner !== undefined) { fields.push('winner = $' + idx++); values.push(winner); }
    if (ended_at !== undefined) { fields.push('ended_at = $' + idx++); values.push(ended_at); }
    if (name !== undefined) { fields.push('name = $' + idx++); values.push(name); }
    if (description !== undefined) { fields.push('description = $' + idx++); values.push(description); }
    if (metric_primary !== undefined) { fields.push('metric_primary = $' + idx++); values.push(metric_primary); }
    if (variants !== undefined) { fields.push('variants = $' + idx++); values.push(JSON.stringify(variants)); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    fields.push('updated_at = NOW()');
    values.push(id);
    const result = await query(`UPDATE ab_tests SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Teste A/B nao encontrado' });
    res.json(result.rows[0]);
  } catch (err) { console.error('Analytics update ab-test error:', err); res.status(500).json({ error: 'Erro ao atualizar teste A/B' }); }
});

// GET /whatsapp-metrics
router.get('/whatsapp-metrics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();

    const [avgFirstResponse, avgMsgsToConversion, templateStats, msgStatusCounts, activeWindows] = await Promise.all([
      query(`SELECT COALESCE(AVG(first_resp_minutes), 0)::numeric AS avg_first_response_minutes FROM (
        SELECT EXTRACT(EPOCH FROM (MIN(c.created_at) - l.created_at)) / 60 AS first_resp_minutes
        FROM leads l INNER JOIN conversations c ON c.lead_id = l.id AND c.direction = 'outbound'
        WHERE l.created_at >= $1 GROUP BY l.id, l.created_at
      ) sub`, [ps]),
      query(`SELECT COALESCE(AVG(msg_count), 0)::numeric AS avg_messages_to_conversion FROM (
        SELECT l.id, COUNT(c.id)::int AS msg_count FROM leads l INNER JOIN conversations c ON c.lead_id = l.id
        WHERE l.pipeline_stage IN ('pago', 'entregue') AND l.created_at >= $1 GROUP BY l.id
      ) sub`, [ps]),
      query(`SELECT COUNT(*) FILTER (WHERE wa_template_sent = true)::int AS template_sent_count,
        COUNT(*) FILTER (WHERE wa_template_sent = true AND has_inbound = true)::int AS template_responded_count
        FROM (SELECT l.id, l.wa_template_sent, EXISTS (SELECT 1 FROM conversations c WHERE c.lead_id = l.id AND c.direction = 'inbound') AS has_inbound FROM leads l WHERE l.created_at >= $1) sub`, [ps]),
      query(`SELECT COUNT(*)::int AS msg_sent_count, COUNT(*) FILTER (WHERE wa_status IN ('delivered', 'read'))::int AS msg_delivered_count,
        COUNT(*) FILTER (WHERE wa_status = 'read')::int AS msg_read_count FROM conversations WHERE direction = 'outbound' AND created_at >= $1`, [ps]),
      query(`SELECT COUNT(DISTINCT lead_id)::int AS active_windows FROM conversations WHERE direction = 'inbound' AND created_at >= NOW() - INTERVAL '24 hours'`)
    ]);

    const templateSent = templateStats.rows[0].template_sent_count;
    const templateResponded = templateStats.rows[0].template_responded_count;
    const templateResponseRate = templateSent === 0 ? 0 : parseFloat(((templateResponded / templateSent) * 100).toFixed(1));

    res.json({
      avg_first_response_minutes: parseFloat(parseFloat(avgFirstResponse.rows[0].avg_first_response_minutes).toFixed(1)),
      avg_messages_to_conversion: parseFloat(parseFloat(avgMsgsToConversion.rows[0].avg_messages_to_conversion).toFixed(1)),
      template_sent_count: templateSent,
      template_response_rate: templateResponseRate,
      msg_sent_count: msgStatusCounts.rows[0].msg_sent_count,
      msg_delivered_count: msgStatusCounts.rows[0].msg_delivered_count,
      msg_read_count: msgStatusCounts.rows[0].msg_read_count,
      active_windows: activeWindows.rows[0].active_windows,
    });
  } catch (err) { console.error('Analytics whatsapp-metrics error:', err); res.status(500).json({ error: 'Erro ao buscar metricas WhatsApp' }); }
});

// GET /wa-funnel
router.get('/wa-funnel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();

    const result = await query(`
      SELECT
        COUNT(*)::int AS lead_created,
        COUNT(*) FILTER (WHERE has_outbound = true)::int AS first_contact,
        COUNT(*) FILTER (WHERE has_inbound = true)::int AS responded,
        COUNT(*) FILTER (WHERE total_messages >= 3)::int AS engaged,
        COUNT(*) FILTER (WHERE pipeline_stage IN ('negociando','pago','entregue','upsell'))::int AS negotiating,
        COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::int AS paid
      FROM (
        SELECT l.id, l.pipeline_stage,
          EXISTS (SELECT 1 FROM conversations c WHERE c.lead_id = l.id AND c.direction = 'outbound') AS has_outbound,
          EXISTS (SELECT 1 FROM conversations c WHERE c.lead_id = l.id AND c.direction = 'inbound') AS has_inbound,
          (SELECT COUNT(*)::int FROM conversations c WHERE c.lead_id = l.id) AS total_messages
        FROM leads l WHERE l.created_at >= $1
      ) sub
    `, [ps]);

    const r = result.rows[0];
    res.json({
      funnel: [
        { stage: 'lead_created', label: 'Lead Criado', count: r.lead_created },
        { stage: 'first_contact', label: 'Primeiro Contato', count: r.first_contact },
        { stage: 'responded', label: 'Respondeu', count: r.responded },
        { stage: 'engaged', label: '3+ Mensagens', count: r.engaged },
        { stage: 'negotiating', label: 'Negociacao', count: r.negotiating },
        { stage: 'paid', label: 'Pagou', count: r.paid },
      ]
    });
  } catch (err) { console.error('Analytics wa-funnel error:', err); res.status(500).json({ error: 'Erro ao buscar funil WhatsApp' }); }
});

// GET /crm-bottlenecks
router.get('/crm-bottlenecks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();

    const STAGE_LABELS: Record<string, string> = {
      novo: 'Novo', tentativa_contato: 'Tentativa de Contato', qualificado: 'Qualificado',
      negociando: 'Negociando', pago: 'Pago', entregue: 'Entregue',
      upsell: 'Upsell', follow_up: 'Follow-up', perdido: 'Perdido'
    };

    const stageStats = await query(`
      SELECT pipeline_stage, COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '48 hours')::int AS stuck_count,
        AVG(EXTRACT(EPOCH FROM (COALESCE(updated_at, NOW()) - created_at)) / 3600)::numeric AS avg_hours
      FROM leads WHERE created_at >= $1 AND pipeline_stage IS NOT NULL GROUP BY pipeline_stage
    `, [ps]);

    const statsMap: Record<string, any> = {};
    stageStats.rows.forEach((r: any) => {
      statsMap[r.pipeline_stage] = { total: r.total, stuck_count: r.stuck_count, avg_hours: parseFloat(parseFloat(r.avg_hours).toFixed(1)) };
    });

    const cumulativeResult = await query(`SELECT pipeline_stage, COUNT(*)::int AS cnt FROM leads WHERE created_at >= $1 AND pipeline_stage IS NOT NULL GROUP BY pipeline_stage`, [ps]);
    const rawCounts: Record<string, number> = {};
    cumulativeResult.rows.forEach((r: any) => { rawCounts[r.pipeline_stage] = r.cnt; });

    const reachedCounts: Record<string, number> = {};
    let cumulative = 0;
    for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
      cumulative += (rawCounts[PIPELINE_STAGES[i]] || 0);
      reachedCounts[PIPELINE_STAGES[i]] = cumulative;
    }

    const stages = PIPELINE_STAGES.map((stage, idx) => {
      const stats = statsMap[stage] || { total: 0, stuck_count: 0, avg_hours: 0 };
      const stuckPct = stats.total === 0 ? 0 : parseFloat(((stats.stuck_count / stats.total) * 100).toFixed(1));
      let dropRate = 0;
      if (idx < PIPELINE_STAGES.length - 1) {
        const reachedThis = reachedCounts[stage] || 0;
        const reachedNext = reachedCounts[PIPELINE_STAGES[idx + 1]] || 0;
        dropRate = reachedThis === 0 ? 0 : parseFloat((((reachedThis - reachedNext) / reachedThis) * 100).toFixed(1));
      }
      let health = 'green';
      if (stuckPct >= 50) health = 'red';
      else if (stuckPct >= 20) health = 'yellow';

      return { stage, label: STAGE_LABELS[stage] || stage, total: stats.total, stuck_count: stats.stuck_count, stuck_pct: stuckPct, avg_hours: stats.avg_hours, drop_rate: dropRate, health };
    });

    res.json({ stages });
  } catch (err) { console.error('Analytics crm-bottlenecks error:', err); res.status(500).json({ error: 'Erro ao buscar gargalos do CRM' }); }
});

// GET /pages - Landing page performance stats
router.get('/pages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const { periodStart } = getPeriodDates(period);
    const ps = periodStart.toISOString();

    const result = await query(`
      SELECT
        source,
        COUNT(*)::int as leads,
        COUNT(*) FILTER (WHERE pipeline_stage IN ('qualificado','negociando','pago','entregue','upsell'))::int as qualified,
        COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::int as paid,
        (COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell')) * ${PRICE_PER_SALE})::numeric as revenue,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((COUNT(*) FILTER (WHERE pipeline_stage IN ('pago','entregue','upsell'))::numeric / COUNT(*)) * 100, 1)
          ELSE 0
        END as conversion_rate,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((COUNT(*) FILTER (WHERE pipeline_stage IN ('qualificado','negociando','pago','entregue','upsell'))::numeric / COUNT(*)) * 100, 1)
          ELSE 0
        END as qualified_rate,
        MIN(created_at) as first_lead_at,
        MAX(created_at) as last_lead_at
      FROM leads
      WHERE created_at >= $1 AND source IS NOT NULL
      GROUP BY source
      ORDER BY leads DESC
    `, [ps]);

    const pages = result.rows.map((r: any) => ({
      ...r,
      revenue: parseFloat(r.revenue),
      conversion_rate: parseFloat(r.conversion_rate),
      qualified_rate: parseFloat(r.qualified_rate),
    }));

    res.json({ pages });
  } catch (err) { console.error('Analytics pages error:', err); res.status(500).json({ error: 'Erro ao buscar dados de páginas' }); }
});

export default router;
