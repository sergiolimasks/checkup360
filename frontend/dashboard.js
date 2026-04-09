// dashboard.js - Enhanced Analytics Dashboard with Chart.js
const Dashboard = {
  period: 30,
  charts: {},

  async render(container) {
    container.innerHTML = `
      <div class="dash-controls">
        <div class="period-selector">
          <button class="period-btn ${this.period===7?'active':''}" onclick="Dashboard.setPeriod(7)">7 dias</button>
          <button class="period-btn ${this.period===15?'active':''}" onclick="Dashboard.setPeriod(15)">15 dias</button>
          <button class="period-btn ${this.period===30?'active':''}" onclick="Dashboard.setPeriod(30)">30 dias</button>
          <button class="period-btn ${this.period===90?'active':''}" onclick="Dashboard.setPeriod(90)">90 dias</button>
        </div>
      </div>
      <div id="dash-kpis" class="dash-kpis"><div class="loading"><div class="spinner"></div></div></div>
      <div class="dash-grid-2">
        <div class="dash-card dash-card-lg">
          <div class="dash-card-header">
            <h3>Leads & Receita</h3>
            <div class="chart-metric-toggle">
              <button class="chart-toggle active" data-metric="leads" onclick="Dashboard.switchChartMetric('leads',this)">Leads</button>
              <button class="chart-toggle" data-metric="revenue" onclick="Dashboard.switchChartMetric('revenue',this)">Receita</button>
              <button class="chart-toggle" data-metric="conversions" onclick="Dashboard.switchChartMetric('conversions',this)">Vendas</button>
            </div>
          </div>
          <div class="dash-card-body" style="height:280px"><canvas id="chart-main"></canvas></div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header"><h3>Funil de Conversão</h3></div>
          <div class="dash-card-body" id="dash-funnel"><div class="loading"><div class="spinner"></div></div></div>
        </div>
      </div>
      <div class="dash-grid-2">
        <div class="dash-card">
          <div class="dash-card-header"><h3>Fontes de Tráfego</h3></div>
          <div class="dash-card-body dash-card-scroll" id="dash-sources"><div class="loading"><div class="spinner"></div></div></div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header"><h3>Tempo Médio por Etapa</h3><span style="color:#64748b;font-size:11px">Quanto tempo leads ficam em cada etapa</span></div>
          <div class="dash-card-body" style="height:280px"><canvas id="chart-velocity"></canvas></div>
        </div>
      </div>
      <div class="dash-grid-2">
        <div class="dash-card">
          <div class="dash-card-header"><h3>WhatsApp Performance</h3></div>
          <div class="dash-card-body" id="dash-wa-metrics"><div class="loading"><div class="spinner"></div></div></div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header"><h3>Funil WhatsApp</h3></div>
          <div class="dash-card-body" id="dash-wa-funnel"><div class="loading"><div class="spinner"></div></div></div>
        </div>
      </div>
      <div class="dash-grid-2">
        <div class="dash-card dash-card-placeholder">
          <div class="dash-card-header">
            <h3>Meta Ads</h3>
            <span class="dash-badge-soon">Em breve</span>
          </div>
          <div class="dash-card-body dash-placeholder-body">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#64748b" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <p>Conecte sua conta Meta Ads para ver investimento, CPC, CTR e ROAS em tempo real.</p>
            <button class="btn-placeholder" disabled>Conectar Meta Ads</button>
          </div>
        </div>
        <div class="dash-card dash-card-placeholder">
          <div class="dash-card-header">
            <h3>Google Ads</h3>
            <span class="dash-badge-soon">Em breve</span>
          </div>
          <div class="dash-card-body dash-placeholder-body">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#64748b" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <p>Conecte sua conta Google Ads para ver investimento, CPC, conversões e CPA.</p>
            <button class="btn-placeholder" disabled>Conectar Google Ads</button>
          </div>
        </div>
      </div>`;
    this.loadData();
  },

  async loadData() {
    // Fallback: try new analytics endpoints first, fall back to old dashboard endpoints
    try {
      const [overview, chart, funnel, sources, velocity, waMetrics, waFunnel] = await Promise.allSettled([
        Api.getAnalyticsOverview(this.period),
        Api.getAnalyticsChart(this.period, 'leads'),
        Api.getAnalyticsFunnel(this.period),
        Api.getAnalyticsSources(this.period),
        Api.getAnalyticsPipelineVelocity(this.period),
        Api.getWhatsAppMetrics ? Api.getWhatsAppMetrics(this.period) : Promise.reject('na'),
        Api.getWAFunnel ? Api.getWAFunnel(this.period) : Promise.reject('na')
      ]);
      this.renderKPIs(overview.status === 'fulfilled' ? overview.value : null, waMetrics.status === 'fulfilled' ? waMetrics.value : null);
      this.renderMainChart(chart.status === 'fulfilled' ? chart.value : null);
      this.renderFunnel(funnel.status === 'fulfilled' ? funnel.value : null);
      this.renderSources(sources.status === 'fulfilled' ? sources.value : null);
      this.renderVelocityChart(velocity.status === 'fulfilled' ? velocity.value : null);
      this.renderWAMetrics(waMetrics.status === 'fulfilled' ? waMetrics.value : null);
      this.renderWAFunnel(waFunnel.status === 'fulfilled' ? waFunnel.value : null);

      // Retry failed WA widgets after 2s (timing issue on first load)
      var self = this;
      if (waMetrics.status !== 'fulfilled' || waFunnel.status !== 'fulfilled' || velocity.status !== 'fulfilled') {
        setTimeout(async function() {
          try {
            if (waMetrics.status !== 'fulfilled') { var wm = await Api.getWhatsAppMetrics(self.period); self.renderWAMetrics(wm); }
            if (waFunnel.status !== 'fulfilled') { var wf2 = await Api.getWAFunnel(self.period); self.renderWAFunnel(wf2); }
            if (velocity.status !== 'fulfilled') { var vel2 = await Api.getAnalyticsPipelineVelocity(self.period); self.renderVelocityChart(vel2); }
          } catch(retryErr) { console.warn('[Dashboard] WA retry failed:', retryErr.message); }
        }, 2000);
      }
    } catch (e) {
      // Fallback to old endpoints
      try {
        const [stats, chart, sources] = await Promise.all([
          Api.getStats(this.period), Api.getChart(this.period), Api.getSources()
        ]);
        this.renderKPIsFallback(stats);
        this.renderMainChartFallback(chart);
        this.renderSourcesFallback(sources);
      } catch (e2) {
        document.getElementById('dash-kpis').innerHTML = '<div class="loading" style="color:#f87171">Erro ao carregar dashboard: ' + esc(e2.message) + '</div>';
      }
    }
  },

  // ─── KPIs ───────────────────────────────
  renderKPIs(data, waData) {
    var el = document.getElementById('dash-kpis');
    if (!data) { this.renderKPIsFallback(null); return; }
    var firstResp = waData && waData.avg_first_response_minutes != null
      ? (waData.avg_first_response_minutes < 60 ? Math.round(waData.avg_first_response_minutes) + ' min' : (waData.avg_first_response_minutes / 60).toFixed(1) + 'h')
      : '—';
    var msgsConv = waData && waData.avg_messages_to_conversion != null
      ? Math.round(waData.avg_messages_to_conversion)
      : '—';
    var kpis = [
      { label:'Total Leads', value: data.leads_period || 0, sub: this.changeBadge(data.leads_change_pct), icon:'users' },
      { label:'Receita', value: 'R$ ' + this.fmt(data.revenue_period || 0), sub: this.changeBadge(data.revenue_change_pct), icon:'dollar' },
      { label:'Taxa Conversão', value: (data.conversion_rate || 0).toFixed(1) + '%', sub: this.changeBadge(data.conversion_change_pct), icon:'percent' },
      { label:'Vendas', value: data.total_paid || 0, sub: (data.total_delivered || 0) + ' entregues', icon:'check' },
      { label:'Tempo 1ª Resp.', value: firstResp, sub: 'WhatsApp', icon:'clock' },
      { label:'Msgs p/ Venda', value: msgsConv, sub: 'média por conversão', icon:'message' },
    ];
    el.innerHTML = kpis.map(function(k) {
      return '<div class="kpi-card"><div class="kpi-icon kpi-icon-' + k.icon + '">' + Dashboard.kpiIconSvg(k.icon) + '</div><div class="kpi-content"><span class="kpi-label">' + k.label + '</span><span class="kpi-value">' + k.value + '</span><span class="kpi-sub">' + k.sub + '</span></div></div>';
    }).join('');
  },

  renderKPIsFallback(stats) {
    var el = document.getElementById('dash-kpis');
    if (!stats) { el.innerHTML = '<p style="color:#64748b">Sem dados</p>'; return; }
    var rate = stats.conversion_rate ? stats.conversion_rate.rate : '0.0';
    var kpis = [
      { label:'Total Leads', value: stats.leads.total, sub: '+' + stats.leads.new_period + ' no período', icon:'users' },
      { label:'Receita', value: 'R$ ' + this.fmt(stats.revenue.total || 0), sub: stats.revenue.count + ' pagamentos', icon:'dollar' },
      { label:'Taxa Conversão', value: rate + '%', sub: 'contactados → pagos', icon:'percent' },
      { label:'Contactados', value: stats.conversion_rate ? stats.conversion_rate.contacted : 0, sub: 'no período', icon:'check' },
    ];
    el.innerHTML = kpis.map(function(k) {
      return '<div class="kpi-card"><div class="kpi-icon kpi-icon-' + k.icon + '">' + Dashboard.kpiIconSvg(k.icon) + '</div><div class="kpi-content"><span class="kpi-label">' + k.label + '</span><span class="kpi-value">' + k.value + '</span><span class="kpi-sub">' + k.sub + '</span></div></div>';
    }).join('');
  },

  // ─── MAIN CHART ─────────────────────────
  renderMainChart(data) {
    var canvas = document.getElementById('chart-main');
    if (!canvas) return;
    if (this.charts.main) this.charts.main.destroy();
    var points = (data && data.data) ? data.data : [];
    if (!points.length) { canvas.parentElement.innerHTML = '<p class="loading">Sem dados para o período</p>'; return; }
    var labels = points.map(function(d) { return new Date(d.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }); });
    var values = points.map(function(d) { return parseInt(d.value) || 0; });
    this.charts.main = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Leads',
          data: values,
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34,211,238,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#22d3ee',
          borderWidth: 2
        }]
      },
      options: this.lineChartOptions('Leads')
    });
  },

  renderMainChartFallback(chart) {
    var canvas = document.getElementById('chart-main');
    if (!canvas) return;
    if (this.charts.main) this.charts.main.destroy();
    var points = (chart && chart.data) ? chart.data : [];
    if (!points.length) { canvas.parentElement.innerHTML = '<p class="loading">Sem dados</p>'; return; }
    var labels = points.map(function(d) { return new Date(d.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }); });
    var values = points.map(function(d) { return parseInt(d.value) || 0; });
    this.charts.main = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label:'Leads', data:values, backgroundColor:'rgba(34,211,238,0.6)', borderRadius:4, borderSkipped:false }]
      },
      options: this.barChartOptions()
    });
  },

  async switchChartMetric(metric, btn) {
    document.querySelectorAll('.chart-toggle').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    try {
      var data = await Api.getAnalyticsChart(this.period, metric);
      var canvas = document.getElementById('chart-main');
      if (this.charts.main) this.charts.main.destroy();
      var points = (data && data.data) ? data.data : [];
      if (!points.length) { canvas.parentElement.innerHTML = '<canvas id="chart-main"></canvas>'; return; }
      var labels = points.map(function(d) { return new Date(d.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }); });
      var values = points.map(function(d) { return parseFloat(d.value) || 0; });
      var colors = { leads:'#22d3ee', revenue:'#22c55e', conversions:'#a855f7' };
      var labelMap = { leads:'Leads', revenue:'Receita (R$)', conversions:'Vendas' };
      this.charts.main = new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: labelMap[metric] || metric,
            data: values,
            borderColor: colors[metric] || '#22d3ee',
            backgroundColor: (colors[metric] || '#22d3ee').replace(')', ',0.08)').replace('rgb', 'rgba'),
            fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6,
            pointBackgroundColor: colors[metric] || '#22d3ee', borderWidth: 2
          }]
        },
        options: this.lineChartOptions(labelMap[metric])
      });
    } catch (e) { /* fallback silently */ }
  },

  // ─── FUNNEL ─────────────────────────────
  renderFunnel(data) {
    var el = document.getElementById('dash-funnel');
    if (!data || !data.funnel || !data.funnel.length) {
      el.innerHTML = '<p class="loading">Sem dados de funil</p>';
      return;
    }
    var stages = data.funnel;
    var maxCount = Math.max.apply(null, stages.map(function(s) { return s.count || 0; }));
    if (maxCount === 0) maxCount = 1;
    var stageColors = {
      'novo':'#22d3ee','tentativa_contato':'#818cf8','qualificado':'#a855f7',
      'negociando':'#f59e0b','pago':'#22c55e','entregue':'#10b981',
      'upsell':'#3b82f6','follow_up':'#f97316','perdido':'#ef4444'
    };
    var stageLabels = {
      'novo':'Novo','tentativa_contato':'Tentativa Contato','qualificado':'Qualificado',
      'negociando':'Negociando','pago':'Pago','entregue':'Entregue',
      'upsell':'Upsell','follow_up':'Follow-up','perdido':'Perdido'
    };
    el.innerHTML = '<div class="funnel-chart">' + stages.map(function(s) {
      var pct = Math.max((s.count / maxCount) * 100, 8);
      var color = stageColors[s.stage] || '#64748b';
      var label = stageLabels[s.stage] || s.stage;
      var avgTime = s.avg_time_hours ? (s.avg_time_hours < 1 ? Math.round(s.avg_time_hours * 60) + 'min' : s.avg_time_hours.toFixed(1) + 'h') : '';
      return '<div class="funnel-row">' +
        '<div class="funnel-label">' + esc(label) + '</div>' +
        '<div class="funnel-bar-wrap">' +
          '<div class="funnel-bar" style="width:' + pct + '%;background:' + color + '">' +
            '<span class="funnel-count">' + s.count + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="funnel-meta">' +
          (s.pct_of_total != null ? '<span>' + s.pct_of_total.toFixed(0) + '%</span>' : '') +
          (avgTime ? '<span class="funnel-time">' + avgTime + '</span>' : '') +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  },

  // ─── SOURCES ────────────────────────────
  renderSources(data) {
    var el = document.getElementById('dash-sources');
    if (!data || !data.sources || !data.sources.length) {
      el.innerHTML = '<p class="loading">Sem dados de fontes</p>';
      return;
    }
    var sources = data.sources;
    el.innerHTML = '<table class="dash-table"><thead><tr>' +
      '<th>Fonte</th><th>Leads</th><th>Qualif.</th><th>Vendas</th><th>Receita</th><th>Conv.</th>' +
      '</tr></thead><tbody>' +
      sources.map(function(s) {
        return '<tr>' +
          '<td><span class="source-name">' + esc(s.source || 'direto') + '</span>' +
          (s.medium ? '<span class="source-medium">/ ' + esc(s.medium) + '</span>' : '') + '</td>' +
          '<td>' + s.leads + '</td>' +
          '<td>' + (s.qualified || 0) + '</td>' +
          '<td>' + (s.paid || 0) + '</td>' +
          '<td>R$ ' + Dashboard.fmt(s.revenue || 0) + '</td>' +
          '<td><span class="conv-badge">' + (s.conversion_rate || 0).toFixed(1) + '%</span></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
  },

  renderSourcesFallback(data) {
    var el = document.getElementById('dash-sources');
    if (!data || !data.sources || !data.sources.length) {
      el.innerHTML = '<p class="loading">Sem dados</p>';
      return;
    }
    el.innerHTML = '<table class="dash-table"><thead><tr><th>Fonte</th><th>Leads</th></tr></thead><tbody>' +
      data.sources.map(function(s) {
        return '<tr><td>' + esc(s.source) + '</td><td>' + s.count + '</td></tr>';
      }).join('') + '</tbody></table>';
  },

  // ─── VELOCITY CHART ─────────────────────
  renderVelocityChart(data) {
    var canvas = document.getElementById('chart-velocity');
    if (!canvas) return;
    if (this.charts.velocity) this.charts.velocity.destroy();
    if (!data || !data.stages || !data.stages.length) {
      canvas.parentElement.innerHTML = '<p class="loading">Sem dados de velocidade</p>';
      return;
    }
    var stageLabels = {
      'novo':'Novo','tentativa_contato':'Tent. Contato','qualificado':'Qualificado',
      'negociando':'Negociando','pago':'Pago','entregue':'Entregue',
      'upsell':'Upsell','follow_up':'Follow-up','perdido':'Perdido'
    };
    var stageColors = {
      'novo':'#22d3ee','tentativa_contato':'#818cf8','qualificado':'#a855f7',
      'negociando':'#f59e0b','pago':'#22c55e','entregue':'#10b981',
      'upsell':'#3b82f6','follow_up':'#f97316','perdido':'#ef4444'
    };
    var labels = data.stages.map(function(s) { return stageLabels[s.stage] || s.stage; });
    var values = data.stages.map(function(s) { return parseFloat(s.avg_hours) || 0; });
    var colors = data.stages.map(function(s) { return stageColors[s.stage] || '#64748b'; });
    this.charts.velocity = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tempo médio (horas)',
          data: values,
          backgroundColor: colors.map(function(c) { return c + '99'; }),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: this.barChartOptions('Horas')
    });
  },

  // ─── PERIOD CONTROL ─────────────────────
  setPeriod(p) {
    this.period = p;
    this.render(document.getElementById('content-area'));
  },

  // ─── CHART OPTIONS ──────────────────────
  lineChartOptions(label) {
    return {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: { display:false },
        tooltip: {
          backgroundColor:'rgba(15,23,42,0.95)', titleColor:'#e2e8f0', bodyColor:'#94a3b8',
          borderColor:'rgba(34,211,238,0.2)', borderWidth:1, cornerRadius:8, padding:12,
          titleFont:{ weight:'600' }
        }
      },
      scales: {
        x: { grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#64748b', font:{ size:11 }, maxRotation:0, autoSkip:true, maxTicksLimit:10 } },
        y: { grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#64748b', font:{ size:11 } }, beginAtZero:true }
      }
    };
  },
  barChartOptions(yLabel) {
    return {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: {
        legend: { display:false },
        tooltip: {
          backgroundColor:'rgba(15,23,42,0.95)', titleColor:'#e2e8f0', bodyColor:'#94a3b8',
          borderColor:'rgba(34,211,238,0.2)', borderWidth:1, cornerRadius:8, padding:12
        }
      },
      scales: {
        x: { grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#64748b', font:{ size:11 } }, beginAtZero:true },
        y: { grid:{ display:false }, ticks:{ color:'#94a3b8', font:{ size:12 } } }
      }
    };
  },

  // ─── HELPERS ────────────────────────────
  fmt(n) { return parseFloat(n).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 }); },
  changeBadge(pct) {
    if (pct == null || isNaN(pct)) return '<span class="kpi-change neutral">—</span>';
    var cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral';
    var arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
    return '<span class="kpi-change ' + cls + '">' + arrow + ' ' + Math.abs(pct).toFixed(1) + '% vs anterior</span>';
  },
  kpiIconSvg(type) {
    var icons = {
      users: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      dollar: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      percent: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
      check: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      clock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      message: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    };
    return icons[type] || '';
  },

  // ─── WA METRICS ─────────────────────────
  renderWAMetrics(data) {
    var el = document.getElementById('dash-wa-metrics');
    if (!el) return;
    if (!data) { el.innerHTML = '<p class="loading">Dados WA indisponíveis</p>'; return; }
    var firstResp = data.avg_first_response_minutes != null
      ? (data.avg_first_response_minutes < 60 ? Math.round(data.avg_first_response_minutes) + ' min' : (data.avg_first_response_minutes / 60).toFixed(1) + 'h')
      : '—';
    var sent = data.msg_sent_count || 0;
    var delivered = data.msg_delivered_count || 0;
    var read = data.msg_read_count || 0;
    var deliveredPct = sent > 0 ? Math.min(100, (delivered / sent * 100)).toFixed(0) : '0';
    var readPct = sent > 0 ? Math.min(100, (read / sent * 100)).toFixed(0) : '0';
    el.innerHTML = '<div class="wa-metrics-grid">' +
      '<div class="wa-metric"><span class="wa-metric-val">' + firstResp + '</span><span class="wa-metric-label">Tempo 1ª Resposta</span></div>' +
      '<div class="wa-metric"><span class="wa-metric-val">' + (data.avg_messages_to_conversion != null ? Math.round(data.avg_messages_to_conversion) : '—') + '</span><span class="wa-metric-label">Msgs p/ Conversão</span></div>' +
      '<div class="wa-metric"><span class="wa-metric-val">' + (data.active_windows || 0) + '</span><span class="wa-metric-label">Janelas Ativas</span></div>' +
      '<div class="wa-metric"><span class="wa-metric-val">' + (data.template_sent_count || 0) + '</span><span class="wa-metric-label">Templates Enviados</span></div>' +
      '<div class="wa-metric"><span class="wa-metric-val">' + (data.template_response_rate || 0).toFixed(0) + '%</span><span class="wa-metric-label">Taxa Resposta Template</span></div>' +
      '<div class="wa-metric"><span class="wa-metric-val">' + deliveredPct + '% / ' + readPct + '%</span><span class="wa-metric-label">Entregue / Lido (' + sent + ' enviadas)</span></div>' +
    '</div>';
  },

  renderWAFunnel(data) {
    var el = document.getElementById('dash-wa-funnel');
    if (!el) return;
    if (!data || !data.funnel || !data.funnel.length) { el.innerHTML = '<p class="loading">Dados WA indisponíveis</p>'; return; }
    var stages = data.funnel;
    var maxCount = Math.max.apply(null, stages.map(function(s) { return s.count || 0; }));
    if (maxCount === 0) maxCount = 1;
    var waColors = ['#22d3ee','#818cf8','#a855f7','#f59e0b','#22c55e','#10b981'];
    el.innerHTML = '<div class="funnel-chart">' + stages.map(function(s, i) {
      var pct = Math.max((s.count / maxCount) * 100, 8);
      var color = waColors[i] || '#64748b';
      var dropoff = '';
      if (i > 0 && stages[i - 1].count > 0) {
        var dropPct = ((stages[i - 1].count - s.count) / stages[i - 1].count * 100).toFixed(0);
        if (parseInt(dropPct) > 0) dropoff = ' <span style="color:#ef4444;font-size:10px">-' + dropPct + '%</span>';
      }
      return '<div class="funnel-row">' +
        '<div class="funnel-label">' + esc(s.label || s.stage) + '</div>' +
        '<div class="funnel-bar-wrap"><div class="funnel-bar" style="width:' + pct + '%;background:' + color + '"><span class="funnel-count">' + s.count + '</span></div></div>' +
        '<div class="funnel-meta">' + dropoff + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }
};

