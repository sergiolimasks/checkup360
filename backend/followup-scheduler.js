#!/usr/bin/env node
/**
 * Follow-up Scheduler — Checkup360
 *
 * Duas automações:
 * 1. NUDGE (janela aberta) — texto livre, 5m/10m/30m/1h/3h/8h
 * 2. FOLLOW-UP (janela fechada) — templates, 1h/3h/12h/12h/12h (max 5)
 */

require('dotenv').config();
const { Pool } = require('pg');

// --- Conexões e credenciais ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // PostgreSQL — schema consulta_credito
const META_TOKEN = process.env.META_WHATSAPP_TOKEN; // Token da Meta Cloud API (WhatsApp Business)
const META_PHONE_ID = process.env.META_PHONE_NUMBER_ID; // ID do número no WhatsApp Business
const WA_URL = `https://graph.facebook.com/v21.0/${META_PHONE_ID}/messages`; // Endpoint de envio de mensagens

// ============================================
// CONFIGURAÇÃO DE INTERVALOS E MENSAGENS
// ============================================

// Intervalos de nudge em minutos — enviados enquanto a janela de 24h está ABERTA
// (lead respondeu recentemente, podemos enviar texto livre sem custo de template)
const NUDGE_INTERVALS = [5, 10, 30, 60, 180, 480]; // 5m, 10m, 30m, 1h, 3h, 8h

// Mensagens de nudge — texto livre, tom amigável e progressivo
const NUDGE_MESSAGES = [
    'Oi! Tudo certo por aí? Se tiver alguma dúvida, é só falar 😊',
    'Ei, sei que a rotina é corrida! To aqui pra te ajudar quando puder 🙌',
    'Opa! Ainda to por aqui se precisar. Posso te explicar melhor como funciona a consulta?',
    'Oi! Só passando pra lembrar que to disponível pra te ajudar com a consulta de crédito. Qualquer dúvida, manda aqui!',
    'Oi! Faz um tempinho que a gente tava conversando. Se ainda tiver interesse na consulta, me avisa que te ajudo rapidinho 😊',
    'Última mensagem por aqui! Se quiser saber mais sobre a consulta de crédito, é só responder. Se não, sem problema — fico por aqui 🙏',
];

// Intervalos de follow-up em minutos — enviados quando a janela de 24h está FECHADA
// (precisa usar templates pré-aprovados pela Meta, cada envio tem custo)
const FOLLOWUP_INTERVALS = [60, 180, 720, 720, 720]; // 1h, 3h, 12h, 12h, 12h

// Templates de follow-up — sequência de reengajamento (TODOS UTILITY)
const FOLLOWUP_TEMPLATES = [
    'lembrete_atendimento',   // 1o: "ficou pendente, alguma dúvida? responda"
    'informativo_consulta',   // 2o: "inclui score, restrições, R$99, responda"
    'lembrete_finalizacao', // 3o: "quase concluída, falta pagamento, responda"
    'ultimo_lembrete',      // 4o: "último lembrete, responda ou encerra"
    'reativacao_solicitacao', // 5o: reativação final (último contato)
];

// Stages do pipeline que recebem nudge (janela aberta — conversa ativa)
const NUDGE_STAGES = ['qualificado', 'negociando', 'pago'];

// Stages do pipeline que recebem follow-up (janela fechada — reengajamento)
const FOLLOWUP_STAGES = ['novo', 'tentativa_contato', 'qualificado', 'negociando', 'follow_up'];

// Numeros internos da empresa — isolados do fluxo automatico
const INTERNAL_PHONES = (process.env.INTERNAL_PHONES || '').split(',').map(p => p.trim()).filter(Boolean);
function isInternalPhone(phone) {
    const clean = (phone || '').replace(/\D/g, '');
    return INTERNAL_PHONES.some(p => clean === p || clean.endsWith(p));
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Calcula quantos minutos se passaram desde uma data
function minutesAgo(date) {
    return (Date.now() - new Date(date).getTime()) / 60000;
}

// Extrai primeiro nome do lead (fallback: "cliente" se não tiver nome real)
function getLeadFirstName(lead) {
    if (!lead.name || lead.name.startsWith('WhatsApp ')) return 'cliente';
    return lead.name.split(' ')[0];
}

/**
 * Envia mensagem de texto livre via WhatsApp (só funciona com janela de 24h aberta).
 * Retorna o wa_message_id ou null em caso de erro.
 */
async function sendText(phone, text) {
    try {
        const res = await fetch(WA_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phone,
                type: 'text',
                text: { body: text }
            })
        });
        const data = await res.json();
        if (data.error) {
            console.error(`[Nudge] Erro envio texto para ${phone}:`, data.error.message);
            return null;
        }
        return data.messages?.[0]?.id || null;
    } catch (err) {
        console.error(`[Nudge] Fetch error:`, err.message);
        return null;
    }
}

/**
 * Envia template pré-aprovado pela Meta via WhatsApp (funciona com janela fechada).
 * Templates custam mais que texto livre — usar apenas quando janela expirou.
 * O parâmetro firstName é injetado no corpo do template (variável {{1}}).
 */
async function sendTemplate(phone, templateName, firstName) {
    try {
        const res = await fetch(WA_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: 'pt_BR' },
                    components: [{
                        type: 'body',
                        parameters: [{ type: 'text', text: firstName }]
                    }]
                }
            })
        });
        const data = await res.json();
        if (data.error) {
            console.error(`[FollowUp] Erro template ${templateName} para ${phone}:`, data.error.message);
            return null;
        }
        return data.messages?.[0]?.id || null;
    } catch (err) {
        console.error(`[FollowUp] Fetch error:`, err.message);
        return null;
    }
}

// Registra mensagem enviada na tabela de conversas (histórico do CRM)
async function logConversation(leadId, direction, type, content, waMessageId) {
    try {
        await pool.query(
            `INSERT INTO consulta_credito.conversations (lead_id, direction, message_type, content, wa_message_id, wa_status, is_ai_generated, ai_model)
             VALUES ($1, $2, $3, $4, $5, 'sent', false, 'scheduler')`,
            [leadId, direction, type, content, waMessageId]
        );
    } catch (err) {
        console.error('[DB] Erro ao salvar conversa:', err.message);
    }
}

// ============================================
// 1. NUDGE — Janela aberta, texto livre (sem custo de template)
// ============================================

/**
 * Processa nudges para leads com janela de 24h ainda aberta.
 * Envia texto livre (mais barato que template) em intervalos crescentes.
 * Máximo de 6 nudges por lead antes de parar.
 */
async function processNudges() {
    try {
        // Busca leads elegíveis para nudge:
        // - Stage de conversa ativa (qualificado, negociando, pago)
        // - Bot foi o último a falar (lead não respondeu)
        // - Janela de 24h ainda aberta (window_expires_at > now)
        // - Ainda não atingiu o máximo de 6 nudges
        // - Lead optou por receber mensagens (wa_opted_in)
        const result = await pool.query(`
            SELECT * FROM consulta_credito.leads
            WHERE pipeline_stage = ANY($1)
            AND status NOT IN ('paid', 'completed', 'lost')
            AND last_message_direction = 'outbound'
            AND wa_last_message_at IS NOT NULL
            AND window_expires_at > NOW()
            AND nudge_count < $2
            AND wa_opted_in = true
            AND phone IS NOT NULL AND phone != ''
            ORDER BY wa_last_message_at ASC
            LIMIT 20
        `, [NUDGE_STAGES, NUDGE_INTERVALS.length]);

        for (const lead of result.rows) {
            if (isInternalPhone(lead.phone)) continue; // Ignorar numeros internos
            const inactiveMin = minutesAgo(lead.wa_last_message_at);
            const nextInterval = NUDGE_INTERVALS[lead.nudge_count] || NUDGE_INTERVALS[NUDGE_INTERVALS.length - 1];

            if (inactiveMin < nextInterval) continue; // Ainda não passou o intervalo necessário

            // Seleciona mensagem correspondente ao número do nudge atual
            const message = NUDGE_MESSAGES[lead.nudge_count] || NUDGE_MESSAGES[NUDGE_MESSAGES.length - 1];
            const waId = await sendText(lead.phone, message);

            if (waId) {
                // Atualiza contador de nudges e timestamp da última mensagem
                await pool.query(
                    `UPDATE consulta_credito.leads
                     SET nudge_count = nudge_count + 1, wa_last_message_at = NOW(), last_message_direction = 'outbound'
                     WHERE id = $1`,
                    [lead.id]
                );
                await logConversation(lead.id, 'outbound', 'text', `[Nudge #${lead.nudge_count + 1}] ${message}`, waId);
                console.log(`[Nudge] #${lead.nudge_count + 1} enviado para ${lead.name || lead.phone} (inativo ${Math.round(inactiveMin)}min)`);
            }

            // Rate limit — máximo 1 mensagem por segundo (evita bloqueio da Meta)
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (err) {
        console.error('[Nudge] Erro geral:', err.message);
    }
}

// ============================================
// 2. FOLLOW-UP — Janela fechada, templates pré-aprovados (custo por envio)
// ============================================

/**
 * Processa follow-ups para leads com janela de 24h fechada.
 * Usa templates pré-aprovados pela Meta (obrigatório fora da janela).
 * Sequência: dúvida → valor → urgência → última chance → reativação.
 * Máximo de 5 follow-ups por lead.
 */
async function processFollowUps() {
    try {
        // Busca leads elegíveis para follow-up:
        // - Stages de reengajamento (novo, tentativa_contato, qualificado, negociando, follow_up)
        // - Janela FECHADA (expirou ou nunca abriu — lead nunca respondeu)
        // - Ainda não atingiu o máximo de 5 follow-ups
        // - Lead optou por receber mensagens
        const result = await pool.query(`
            SELECT * FROM consulta_credito.leads
            WHERE pipeline_stage = ANY($1)
            AND status NOT IN ('paid', 'completed', 'lost')
            AND (window_expires_at IS NULL OR window_expires_at < NOW())
            AND follow_up_count < $2
            AND wa_opted_in = true
            AND phone IS NOT NULL AND phone != ''
            ORDER BY COALESCE(last_template_sent_at, wa_last_message_at, created_at) ASC
            LIMIT 20
        `, [FOLLOWUP_STAGES, FOLLOWUP_INTERVALS.length]);

        for (const lead of result.rows) {
            if (isInternalPhone(lead.phone)) continue; // Ignorar numeros internos
            // Calcula tempo desde o evento de referência
            let referenceTime;
            if (lead.follow_up_count === 0) {
                // Primeiro follow-up: conta desde quando a janela fechou (ou criação do lead)
                referenceTime = lead.window_expires_at || lead.wa_last_message_at || lead.created_at;
            } else {
                // Follow-ups seguintes: conta desde o último template enviado
                referenceTime = lead.last_template_sent_at || lead.wa_last_message_at || lead.created_at;
            }

            const minSinceRef = minutesAgo(referenceTime);
            const requiredInterval = FOLLOWUP_INTERVALS[lead.follow_up_count] || FOLLOWUP_INTERVALS[FOLLOWUP_INTERVALS.length - 1];

            if (minSinceRef < requiredInterval) continue; // Ainda não passou o intervalo necessário

            // Seleciona o template correspondente à etapa atual do follow-up
            const templateName = FOLLOWUP_TEMPLATES[lead.follow_up_count] || FOLLOWUP_TEMPLATES[FOLLOWUP_TEMPLATES.length - 1];
            const firstName = getLeadFirstName(lead);
            const waId = await sendTemplate(lead.phone, templateName, firstName);

            if (waId) {
                // Atualiza lead: incrementa contador, registra template, e move no pipeline se necessário
                await pool.query(
                    `UPDATE consulta_credito.leads
                     SET follow_up_count = follow_up_count + 1,
                         last_template_sent_at = NOW(),
                         last_template_name = $2,
                         pipeline_stage = CASE
                             WHEN pipeline_stage = 'novo' THEN 'tentativa_contato'
                             WHEN follow_up_count >= 4 THEN 'follow_up'
                             ELSE pipeline_stage
                         END,
                         last_message_direction = 'outbound'
                     WHERE id = $1`,
                    [lead.id, templateName]
                );
                await logConversation(lead.id, 'outbound', 'template', `[Follow-up #${lead.follow_up_count + 1}] Template: ${templateName}`, waId);
                console.log(`[FollowUp] #${lead.follow_up_count + 1} (${templateName}) enviado para ${lead.name || lead.phone} (${Math.round(minSinceRef)}min desde ref)`);
            }

            // Rate limit — 1.5s entre envios (templates são mais sensíveis a throttling)
            await new Promise(r => setTimeout(r, 1500));
        }
    } catch (err) {
        console.error('[FollowUp] Erro geral:', err.message);
    }
}

// ============================================
// LOOP PRINCIPAL — executa a cada 60 segundos
// ============================================

let running = false; // Trava para evitar execuções sobrepostas

/**
 * Ciclo principal: processa nudges e follow-ups sequencialmente.
 * Protegido por flag 'running' para não sobrepor execuções.
 */
async function tick() {
    if (running) return; // Tick anterior ainda em execução
    running = true;
    try {
        await processNudges();   // Primeiro: nudges (janela aberta, mais baratos)
        await processFollowUps(); // Depois: follow-ups (janela fechada, templates)
    } catch (err) {
        console.error('[Scheduler] Erro no tick:', err.message);
    } finally {
        running = false;
    }
}

// Log de configuração na inicialização (útil para validar deploy)
console.log('[Scheduler] Follow-up scheduler iniciado');
console.log(`[Scheduler] Nudge intervals: ${NUDGE_INTERVALS.join(', ')}min`);
console.log(`[Scheduler] Follow-up intervals: ${FOLLOWUP_INTERVALS.join(', ')}min`);
console.log(`[Scheduler] Nudge stages: ${NUDGE_STAGES.join(', ')}`);
console.log(`[Scheduler] Follow-up stages: ${FOLLOWUP_STAGES.join(', ')}`);

// Executa imediatamente no startup e depois a cada 60 segundos
tick();
setInterval(tick, 60000);

// Graceful shutdown — fecha conexão com PostgreSQL
process.on('SIGTERM', () => {
    console.log('[Scheduler] Shutting down...');
    pool.end();
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('[Scheduler] Shutting down...');
    pool.end();
    process.exit(0);
});
