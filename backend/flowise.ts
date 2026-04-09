import dotenv from "dotenv";
dotenv.config();

const FLOWISE_API_URL = process.env.FLOWISE_API_URL || "http://localhost:3100";
const FLOWISE_CHATFLOW_ID = process.env.FLOWISE_CHATFLOW_ID || "";
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY || "";

const VALID_TAGS = [
  "READY_TO_PAY",
  "QUALIFIED",
  "COLLECTING_DATA",
  "DATA_RECEIVED",
  "READY_FOR_UPSELL",
  "UPSELL_INTERESTED",
  "NOT_INTERESTED",
  "OPT_OUT",
] as const;

export function extractTag(response: string): { cleanText: string; tag: string | null } {
  for (const tag of VALID_TAGS) {
    const pattern = `[${tag}]`;
    if (response.includes(pattern)) {
      const cleanText = response.replace(pattern, "").trim();
      return { cleanText, tag };
    }
  }
  return { cleanText: response, tag: null };
}

/**
 * Monta o contexto completo pra enviar pro Flowise.
 * Inclui: stage, nome, análise do relatório, relatório completo, histórico.
 *
 * @param lead - objeto do lead do banco
 * @param message - mensagem do lead
 * @param conversations - últimas conversas
 * @param analysisData - pode ser: analysis_json direto, ou objeto com {analysis_json, report_summary, has_pendencias}
 */
function buildContext(
  lead: any,
  message: string,
  conversations: any[],
  analysisData: any | null
): string {
  const rawName = lead.nome || lead.name || "";
  const hasRealName = rawName && !rawName.startsWith("WhatsApp ") && rawName.length > 2;
  const firstName = hasRealName ? rawName.split(" ")[0] : "";

  const lines: string[] = [];
  lines.push(`[STAGE: ${lead.pipeline_stage}]`);

  if (hasRealName) {
    lines.push(`[LEAD: ${firstName}]`);
  } else {
    lines.push(`[LEAD: DESCONHECIDO — pergunte o nome antes de qualquer coisa]`);
  }

  // Montar dados do relatório de forma robusta
  // analysisData pode vir em vários formatos:
  // 1. O analysis_json direto (objeto com rating, analise, classificacao, etc.)
  // 2. Nulo (sem relatório)
  if (analysisData && typeof analysisData === 'object') {
    // Extrair campos importantes pra montar um resumo estruturado
    const rating = analysisData.rating || analysisData.classificacao?.rating || '';
    const score = analysisData.classificacao?.score || analysisData.score || '';
    const conclusao = analysisData.conclusao || analysisData.classificacao?.conclusao || '';
    const hasPendencias = analysisData.has_pendencias;
    const analise = analysisData.analise || {};
    const restricoes = analysisData.restricoes || {};
    const dados = analysisData.dados_pessoais || {};
    const capacidade = analysisData.capacidade_financeira || {};
    const scr = analysisData.scr_banco_central || {};

    const reportLines: string[] = [];
    reportLines.push(`Rating: ${rating}`);
    if (score) reportLines.push(`Score: ${score}`);
    reportLines.push(`Conclusão IA: ${conclusao}`);
    reportLines.push(`Tem pendências: ${hasPendencias ? 'SIM' : 'NÃO'}`);

    if (dados.nome) reportLines.push(`Nome: ${dados.nome}`);
    if (dados.cpf) reportLines.push(`CPF: ${dados.cpf}`);
    if (dados.renda_presumida) reportLines.push(`Renda presumida: ${dados.renda_presumida}`);
    if (dados.data_nascimento) reportLines.push(`Nascimento: ${dados.data_nascimento}`);

    if (capacidade.capacidade_pagamento_mensal) reportLines.push(`Capacidade pagamento mensal: ${capacidade.capacidade_pagamento_mensal}`);
    if (capacidade.limite_credito_sugerido) reportLines.push(`Limite crédito sugerido: ${capacidade.limite_credito_sugerido}`);
    if (capacidade.comprometimento_renda) reportLines.push(`Comprometimento renda: ${capacidade.comprometimento_renda}`);
    if (capacidade.saude_financeira) reportLines.push(`Saúde financeira: ${capacidade.saude_financeira}`);

    if (scr.operacoes_ativas) reportLines.push(`Operações ativas BCen: ${scr.operacoes_ativas}`);

    if (analise.conclusao_texto) reportLines.push(`Análise: ${analise.conclusao_texto}`);
    if (analise.pontos_positivos?.length) reportLines.push(`Pontos positivos: ${analise.pontos_positivos.join(', ')}`);
    if (analise.pontos_atencao?.length) reportLines.push(`Pontos de atenção: ${analise.pontos_atencao.join(', ')}`);

    // Restrições
    if (restricoes.tem_rgi) reportLines.push(`RGI (dívidas SPC/Serasa): SIM - ${restricoes.rgi_total} registro(s)`);
    if (restricoes.tem_protestos) reportLines.push(`Protestos: SIM - ${restricoes.protestos_total} protesto(s)`);
    if (restricoes.tem_cheques_sem_fundo) reportLines.push(`Cheques sem fundo: SIM - ${restricoes.cheques_total}`);
    if (restricoes.tem_acoes_judiciais) reportLines.push(`Ações judiciais: SIM`);
    if (restricoes.rgi_detalhes?.length) {
      for (const rgi of restricoes.rgi_detalhes.slice(0, 5)) {
        reportLines.push(`  - Dívida: ${rgi.credor || rgi.informante || '?'} - R$ ${rgi.valor || '?'} (${rgi.data || '?'})`);
      }
    }
    if (restricoes.protestos_detalhes?.length) {
      for (const p of restricoes.protestos_detalhes.slice(0, 5)) {
        reportLines.push(`  - Protesto: ${p.cartorio || '?'} - R$ ${p.valor || '?'} (${p.data || '?'})`);
      }
    }

    if (analysisData.recommended_service) reportLines.push(`Serviço recomendado: ${analysisData.recommended_service}`);
    if (analysisData.pendencias_resumo) reportLines.push(`Resumo pendências: ${analysisData.pendencias_resumo}`);

    lines.push(`[REPORT_DATA:\n${reportLines.join('\n')}\n]`);

    // Incluir texto completo do relatório pra interpretação detalhada
    if (analysisData._report_summary) {
      lines.push(`[FULL_REPORT:\n${analysisData._report_summary}\n]`);
    }
  }

  // Histórico de conversa
  if (conversations && conversations.length > 0) {
    const recent = conversations.slice(-8);
    const summary = recent
      .map((c: any) => {
        const role = c.direction === "inbound" ? "Lead" : "Bot";
        const text = (c.content || "").substring(0, 150);
        // Filtrar mensagens de sistema
        if (text.startsWith('[Template') || text.startsWith('[Flow') || text.startsWith('[PDF')) return null;
        return `${role}: ${text}`;
      })
      .filter(Boolean)
      .join("\n");
    if (summary) lines.push(`[HISTORY:\n${summary}\n]`);
  }

  lines.push("");
  lines.push(message);

  return lines.join("\n");
}

export async function getFlowiseResponse(
  lead: any,
  message: string,
  conversations: any[],
  analysisData: any | null
): Promise<{ text: string; tag: string | null }> {
  const contextString = buildContext(lead, message, conversations, analysisData);
  console.log('[Flowise] Context length:', contextString.length, 'chars, has REPORT_DATA:', contextString.includes('[REPORT_DATA'));

  try {
    const url = `${FLOWISE_API_URL}/api/v1/prediction/${FLOWISE_CHATFLOW_ID}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FLOWISE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: contextString,
        overrideConfig: { sessionId: String(lead.id) },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Flowise API error ${res.status}: ${errorBody}`);
      return { text: "", tag: null };
    }

    const data = await res.json();
    const rawText: string = data.text || data.answer || "";
    const { tag } = extractTag(rawText);

    // Retorna texto COMPLETO com a tag — o webhook original faz a detecção e remoção
    return { text: rawText, tag };
  } catch (err) {
    console.error("Erro ao chamar Flowise:", err);
    return { text: "", tag: null };
  }
}

export async function handleTag(
  tag: string | null,
  lead: any,
  query: (text: string, params?: any[]) => Promise<any>
): Promise<void> {
  if (!tag) return;

  try {
    switch (tag) {
      case "READY_TO_PAY":
        await query(
          "UPDATE consulta_credito.leads SET pipeline_stage = $2, updated_at = NOW() WHERE id = $1",
          [lead.id, "negociando"]
        );
        console.log(`[handleTag] Lead ${lead.id}: stage -> negociando`);
        break;

      case "COLLECTING_DATA":
        if (lead.status === "paid") {
          await query(
            "UPDATE consulta_credito.leads SET pipeline_stage = $2, updated_at = NOW() WHERE id = $1",
            [lead.id, "processando"]
          );
        }
        break;

      case "DATA_RECEIVED":
        await query(
          "UPDATE consulta_credito.leads SET pipeline_stage = $2, status = $3, updated_at = NOW() WHERE id = $1",
          [lead.id, "processando", "consulting"]
        );
        break;

      case "READY_FOR_UPSELL":
        await query(
          "UPDATE consulta_credito.leads SET pipeline_stage = $2, updated_at = NOW() WHERE id = $1",
          [lead.id, "upsell"]
        );
        break;

      case "UPSELL_INTERESTED":
        console.log(`[handleTag] Lead ${lead.id}: upsell interest registered`);
        break;

      default:
        console.log(`[handleTag] Tag desconhecida: ${tag}`);
    }
  } catch (err) {
    console.error(`[handleTag] Erro ao processar tag ${tag} para lead ${lead.id}:`, err);
  }
}
