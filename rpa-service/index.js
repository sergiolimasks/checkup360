/**
 * RPA Service — Checkup360
 *
 * Serviço de automação que:
 * 1. Faz login no painel KSI (plataforma de consultas de crédito) via Puppeteer
 * 2. Submete CPF e gera relatório PDF de Rating Bancário
 * 3. Envia o PDF ao lead via WhatsApp (Meta Cloud API)
 * 4. Dispara análise IA (Gemini) e atualiza pipeline do CRM
 *
 * Fila de jobs em PostgreSQL com retry e backoff exponencial.
 * Roda como serviço PM2 na porta 3050.
 */
"use strict";
require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// --- Configurações principais ---
const PORT = process.env.RPA_PORT || 3050;
const KSI_URL = "https://painel.ksiconsultas.com.br"; // Painel de consultas de crédito
const KSI_EMAIL = process.env.KSI_EMAIL || "contato@agenciaevergrowth.com.br";
const KSI_PASSWORD = process.env.KSI_PASSWORD || "@Ever2026";
const META_TOKEN = process.env.META_WHATSAPP_TOKEN; // Token da Meta Cloud API (WhatsApp Business)
const META_PHONE_ID = process.env.META_PHONE_NUMBER_ID; // ID do número no WhatsApp Business
const DOWNLOAD_DIR = "/tmp/ksi-downloads"; // Diretório temporário para PDFs gerados
const AUTOMATION_API_KEY = process.env.AUTOMATION_API_KEY || ''; // Chave de autenticação entre serviços internos
const POLL_INTERVAL = 30000; // Intervalo de polling da fila: 30 segundos
const MAX_CONCURRENT = 1; // Apenas 1 job por vez (KSI não suporta concorrência)

// Conexão PostgreSQL — schema consulta_credito
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// --- Estado do worker ---
let isProcessing = false; // Trava para evitar processamento simultâneo
let shuttingDown = false; // Flag de shutdown graceful
let pollTimer = null; // Referência do setInterval do polling

// Sessão persistente do Puppeteer (evita login a cada consulta)
let activeBrowser = null;
let activePage = null;

// Validação de CPF com cálculo dos dígitos verificadores
function isValidCPF(cpf) {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false; // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
    // Primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
    let d1 = 11 - (sum % 11);
    if (d1 >= 10) d1 = 0;
    if (parseInt(clean[9]) !== d1) return false;
    // Segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
    let d2 = 11 - (sum % 11);
    if (d2 >= 10) d2 = 0;
    return parseInt(clean[10]) === d2;
}

// Valida telefone BR: deve ter DDI 55 + DDD + número (12 ou 13 dígitos)
function isValidBRPhone(phone) {
    const clean = phone.replace(/\D/g, '');
    return (clean.length === 12 || clean.length === 13) && clean.startsWith('55');
}

// Garante que o diretório de downloads temporários existe
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// ============================================
// RPA: Sessão persistente e login no KSI
// ============================================

/**
 * Retorna uma página Puppeteer logada no KSI.
 * Reutiliza sessão existente quando possível, evitando login desnecessário.
 * Se a sessão expirou ou o browser morreu, cria nova instância e faz login.
 */
async function getLoggedInPage() {
    // Verifica se já existe sessão ativa e válida
    if (activeBrowser && activePage) {
        try {
            const url = activePage.url();
            // Se a URL indica que estamos logados, reutiliza
            if (url.includes('painel.ksiconsultas.com.br') && !url.includes('login') && !url.includes('error')) {
                console.log('[RPA] Reutilizando sessao existente');
                return activePage;
            }
            // Tenta navegar pro dashboard pra confirmar se a sessão ainda vale
            await activePage.goto(KSI_URL + '/dashboard', { waitUntil: 'networkidle2', timeout: 15000 });
            const newUrl = activePage.url();
            if (!newUrl.includes('login')) {
                console.log('[RPA] Sessao ainda ativa');
                return activePage;
            }
        } catch (e) {
            // Sessão morreu — fecha tudo e recria
            console.log('[RPA] Sessao anterior invalida, recriando...');
            try { await activeBrowser.close(); } catch(e2) {}
            activeBrowser = null;
            activePage = null;
        }
    }

    // Cria novo browser Chromium headless (flags de segurança para container Docker)
    console.log('[RPA] Criando nova sessao...');
    activeBrowser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium",
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
               "--disable-gpu", "--disable-extensions", "--disable-features=site-per-process"]
    });
    activePage = await activeBrowser.newPage();
    await activePage.setViewport({ width: 1280, height: 900 });

    // Configura CDP para permitir downloads no diretório temporário
    const client = await activePage.createCDPSession();
    await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DOWNLOAD_DIR });

    // Faz login preenchendo email e senha no formulário do KSI
    console.log("[RPA] Fazendo login...");
    await activePage.goto(KSI_URL + "/", { waitUntil: "networkidle2", timeout: 30000 });
    await activePage.type("#login", KSI_EMAIL, { delay: 20 }); // Simula digitação humana
    await activePage.type("#senha", KSI_PASSWORD, { delay: 20 });
    await activePage.click(".order"); // Botão de login
    await activePage.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000)); // Espera carregamento pós-login

    // Valida se o login funcionou (KSI redireciona pra /login em caso de falha)
    if (activePage.url().includes("error") || activePage.url().includes("login")) {
        throw new Error("Falha no login KSI");
    }
    console.log("[RPA] Logado com sucesso");
    return activePage;
}

// ============================================
// RPA: Verificar histórico antes de nova consulta
// IMPORTANTE: Cada consulta KSI custa crédito — sempre buscar no histórico primeiro
// ============================================

/**
 * Verifica se já existe consulta anterior para o CPF no histórico do KSI.
 * Evita consumir crédito desnecessário fazendo nova consulta duplicada.
 * Tenta múltiplas URLs de histórico pois o painel KSI varia entre versões.
 */
async function checkHistoryForCPF(page, cpf) {
    const cleanCpf = cpf.replace(/\D/g, "");
    const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    console.log("[RPA] Verificando historico para CPF: " + cleanCpf.substring(0, 3) + "...");

    // Tenta diferentes URLs de histórico do KSI (varia conforme versão do painel)
    const historyUrls = [
        KSI_URL + '/consultas/credito/creditoListar',
        KSI_URL + '/consultas/credito/historico',
        KSI_URL + '/painel/consultas',
        KSI_URL + '/painel/historico',
        KSI_URL + '/dashboard/consultas',
        KSI_URL + '/consultas/historico',
        KSI_URL + '/historico',
        KSI_URL + '/consultas/listar',
    ];

    for (const url of historyUrls) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
            const pageText = await page.evaluate(() => document.body.innerText);

            // Verifica se a página contém tabela de histórico de consultas
            if (pageText.includes('Rating') || pageText.includes('Consulta') || pageText.includes('CPF')) {
                console.log('[RPA] Pagina de historico encontrada: ' + url);

                // Tenta usar campo de busca pra filtrar pelo CPF (se existir)
                const searchInput = await page.$('input[type="search"], input[name="search"], input.search, input[placeholder*="CPF"], input[placeholder*="cpf"], .dataTables_filter input, input.form-control[placeholder*="Buscar"], input.form-control[placeholder*="buscar"], input.form-control[placeholder*="Pesquisar"]');
                if (searchInput) {
                    await searchInput.click({ clickCount: 3 }); // Seleciona texto existente
                    await searchInput.type(cleanCpf, { delay: 20 });
                    await new Promise(r => setTimeout(r, 2000)); // Espera filtro aplicar
                }

                // Procura o CPF nas linhas da tabela de resultados
                const found = await page.evaluate((cpfClean, cpfFormatted) => {
                    const rows = document.querySelectorAll('table tbody tr, .dataTables_wrapper tbody tr');
                    for (const row of rows) {
                        const text = row.innerText;
                        if (text.includes(cpfClean) || text.includes(cpfFormatted)) {
                            // Encontrou! Clica no link de detalhes da consulta
                            const link = row.querySelector('a[href*="consulta"], a[href*="ver"], a[href*="view"], a[href*="detalhe"], a[href*="resultado"], a[href*="rating"], a.view, button.view, td a, a.btn, button.btn');
                            if (link) {
                                link.click();
                                return true;
                            }
                        }
                    }
                    return false;
                }, cleanCpf, formattedCpf);

                if (found) {
                    console.log('[RPA] Consulta encontrada no historico para CPF ' + cleanCpf.substring(0, 3) + '...');
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
                    await new Promise(r => setTimeout(r, 3000));
                    return true; // Encontrou no histórico — não precisa gastar crédito
                }
            }
        } catch (e) {
            console.log('[RPA] URL ' + url + ' nao funcionou: ' + e.message);
        }
    }

    console.log('[RPA] CPF nao encontrado no historico, sera necessaria nova consulta');
    return false; // Não encontrou — precisará fazer nova consulta (gasta crédito)
}

// ============================================
// RPA: Consultar Rating Bancário no KSI
// Fluxo principal: histórico → formulário → PDF → análise
// ============================================

/**
 * Executa consulta completa de Rating Bancário no KSI para um CPF.
 * Primeiro verifica histórico (economia de crédito), se não encontrar faz consulta nova.
 * Retorna: { pdfPath, hasPendencias, reportSummary, analysisJson }
 */
async function runKSIConsultation(cpf) {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) throw new Error("CPF invalido: " + cpf);

    console.log("[RPA] Iniciando consulta CPF: " + cleanCpf.substring(0, 3) + "...");

    const page = await getLoggedInPage();

    try {
        // 1. BUSCAR NO HISTÓRICO PRIMEIRO (evita gastar crédito com consulta duplicada)
        const foundInHistory = await checkHistoryForCPF(page, cpf);

        if (!foundInHistory) {
            // 2. NAVEGAR PRO FORMULÁRIO DE RATING BANCÁRIO (consulta nova)
            console.log("[RPA] Acessando Rating Bancario...");
            await page.goto(KSI_URL + "/consultas/credito/consultaRating", { waitUntil: "networkidle2", timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));

            // 3. PREENCHER FORMULÁRIO DE CONSULTA
            await page.click("#natureza1"); // Seleciona tipo: Pessoa Física
            await new Promise(r => setTimeout(r, 1000));
            await page.waitForSelector("#cpf", { visible: true, timeout: 5000 });
            await page.click("#cpf", { clickCount: 3 }); // Limpa campo CPF
            await page.type("#cpf", cleanCpf, { delay: 30 }); // Digita CPF com delay humano
            await new Promise(r => setTimeout(r, 500));

            // Marca checkbox de liberação (obrigatório para submeter)
            const isChecked = await page.evaluate(() => document.querySelector("#liberarConsultar1")?.checked);
            if (!isChecked) {
                await page.click("#liberarConsultar1");
                await new Promise(r => setTimeout(r, 500));
            }

            // Força habilitação do botão (às vezes fica disabled por validação JS do KSI)
            await new Promise(r => setTimeout(r, 1000));
            await page.evaluate(() => {
                const btn = document.querySelector("#btn_sub_cpf");
                if (btn) { btn.disabled = false; btn.classList.remove("disabled"); }
            });

            console.log("[RPA] Submetendo consulta...");
            await page.screenshot({ path: "/tmp/ksi_pre_submit.png" }); // Screenshot para debug

            // 4. SUBMETER E AGUARDAR RESULTADO (pode levar até 2 min)
            await Promise.all([
                page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }).catch(() => {}),
                page.click("#btn_sub_cpf")
            ]);

            console.log("[RPA] Aguardando resultado...");
            await new Promise(r => setTimeout(r, 15000)); // Tempo extra para renderização
        } else {
            console.log("[RPA] Usando consulta do historico (economia de credito!)");
        }

        console.log("[RPA] URL resultado:", page.url());
        await page.screenshot({ path: "/tmp/ksi_result.png" }); // Screenshot do resultado para debug

        // 5. VERIFICAR SE O KSI RETORNOU ERRO (serviço indisponível, protocolo falhou, etc.)
        const pageError = await page.evaluate(() => {
            const body = document.body.innerText || "";
            if (body.includes("indisponível no momento") || body.includes("Protocolo error") ||
                body.includes("Nenhum protocolo foi gerado") || body.includes("tente novamente")) {
                return body.substring(body.indexOf("Prezado"), body.indexOf("Prezado") + 200) || "Erro detectado na pagina";
            }
            return null;
        });

        if (pageError) {
            throw new Error("KSI retornou erro: " + pageError.substring(0, 100));
        }

        // 6. GERAR PDF — remove elementos de navegação do KSI pra ficar limpo
        console.log("[RPA] Gerando PDF do relatorio...");
        await page.evaluate(() => {
            // Remove sidebar, header, footer e outros elementos que não fazem parte do relatório
            const remove = document.querySelectorAll(
                ".main-sidebar, .main-header, .main-footer, .hidden-print, .breadcrumb, .content-header"
            );
            remove.forEach(el => el.remove());
            // Ajusta layout do conteúdo para ocupar página inteira
            const wrapper = document.querySelector(".content-wrapper");
            if (wrapper) {
                wrapper.style.marginLeft = "0";
                wrapper.style.padding = "20px";
            }
        });

        // Gera PDF em formato A4 com margens padrão
        let pdfPath = path.join(DOWNLOAD_DIR, "rating_" + cleanCpf + "_" + Date.now() + ".pdf");
        await page.pdf({
            path: pdfPath,
            format: "A4",
            printBackground: true,
            margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
        });

        // Validação: PDF muito pequeno indica página vazia ou erro de renderização
        const pdfSize = fs.statSync(pdfPath).size;
        console.log("[RPA] PDF gerado:", pdfPath, "(" + pdfSize + " bytes)");

        if (pdfSize < 10000) {
            throw new Error("PDF gerado muito pequeno (" + pdfSize + " bytes) — possivel pagina vazia");
        }

        // 7. EXTRAIR TEXTO E ENVIAR PARA ANÁLISE IA (Gemini via API principal)
        let reportText = "";
        let hasPendencias = false; // Indica se o relatório tem pendências financeiras
        let reportSummary = "";
        let analysisJson = null; // JSON completo da análise Gemini (rating, serviço recomendado, etc.)
        try {
            reportText = await page.evaluate(() => document.body.innerText);
            // Resumo das primeiras 50 linhas relevantes como fallback
            reportSummary = reportText.split("\n").filter(l => l.trim().length > 5).slice(0, 50).join("\n");

            // Chama endpoint de análise IA — Gemini extrai rating, pendências e recomendação de serviço
            try {
                const analysisRes = await fetch("http://localhost:3001/api/automation/analyze-report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                    body: JSON.stringify({ report_text: reportText.substring(0, 4000) }) // Limita a 4k chars
                });
                if (analysisRes.ok) {
                    const analysis = await analysisRes.json();
                    hasPendencias = analysis.has_pendencias; // true = lead tem pendências (oportunidade de upsell)
                    analysisJson = analysis;
                    if (analysis.analysis_summary) reportSummary = analysis.analysis_summary;
                    console.log("[RPA] Gemini analysis: has_pendencias=" + hasPendencias + " service=" + analysis.recommended_service + " rating=" + analysis.rating);
                } else {
                    const errBody = await analysisRes.text();
                    console.error("[RPA] Gemini analysis HTTP error " + analysisRes.status + ":", errBody);
                    hasPendencias = false; // Fallback conservador: assume sem pendências
                }
            } catch (aiErr) {
                console.error("[RPA] Gemini analysis failed, defaulting to no pendencias:", aiErr.message);
                hasPendencias = false; // Fallback conservador
            }

            console.log("[RPA] Report analysis: hasPendencias=" + hasPendencias + " summary=" + (reportSummary || "").substring(0, 100) + "...");
        } catch (extractErr) {
            console.error("[RPA] Erro ao extrair texto do relatorio:", extractErr.message);
        }

        // NÃO fecha o browser — mantém sessão viva para o próximo job

        if (pdfPath && fs.existsSync(pdfPath)) {
            console.log("[RPA] Consulta finalizada. PDF: " + pdfPath + " (" + fs.statSync(pdfPath).size + " bytes)");
            return { pdfPath, hasPendencias, reportSummary, analysisJson };
        }
        throw new Error("PDF nao gerado");
    } catch (err) {
        // Em erros irrecuperáveis do browser, destrói sessão para o próximo job começar limpo
        if (err.message.includes('Target closed') || err.message.includes('Session closed') ||
            err.message.includes('Protocol error') || err.message.includes('Navigation failed')) {
            console.log('[RPA] Erro critico de browser, destruindo sessao...');
            try { await activeBrowser.close(); } catch(e2) {}
            activeBrowser = null;
            activePage = null;
        }
        throw err;
    }
}

// ============================================
// WhatsApp: Upload e envio de documento via Meta Cloud API
// ============================================

/**
 * Faz upload do PDF para a Meta Cloud API (pré-requisito para envio).
 * Retorna o media_id que será usado no envio da mensagem.
 */
async function uploadMedia(filePath) {
    const FormData = (await import("formdata-node")).FormData;
    const { fileFromPath } = await import("formdata-node/file-from-path");

    const form = new FormData();
    form.set("messaging_product", "whatsapp");
    form.set("type", "document");
    form.set("file", await fileFromPath(filePath, { type: "application/pdf" }));

    // Upload para endpoint de media da Meta (Graph API v21)
    const res = await fetch("https://graph.facebook.com/v21.0/" + META_PHONE_ID + "/media", {
        method: "POST",
        headers: { "Authorization": "Bearer " + META_TOKEN },
        body: form
    });
    const data = await res.json();
    if (data.error) throw new Error("Upload falhou: " + data.error.message);
    console.log("[WA] Media uploaded:", data.id);
    return data.id; // ID da mídia hospedada na Meta
}

/**
 * Envia o PDF como documento no WhatsApp para o lead.
 * Usa o media_id obtido pelo upload prévio.
 */
async function sendDocument(phone, mediaId, filename, caption) {
    const res = await fetch("https://graph.facebook.com/v21.0/" + META_PHONE_ID + "/messages", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + META_TOKEN,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "document",
            document: { id: mediaId, filename: filename, caption: caption }
        })
    });
    const data = await res.json();
    if (data.error) throw new Error("Envio falhou: " + data.error.message);
    console.log("[WA] Documento enviado:", data.messages?.[0]?.id);
    return data.messages?.[0]?.id;
}

// ============================================
// Processar um job completo (consulta → PDF → envio → análise → CRM)
// ============================================

/**
 * Pipeline completo de processamento de um job da fila:
 * 1. Consulta KSI e gera PDF
 * 2. Upload do PDF na Meta e envio via WhatsApp
 * 3. Salva resultado no banco e dispara análise pós-entrega
 * 4. Registra eventos no CRM e move lead para stage "entregue"
 * 5. Em caso de falha, aplica retry com backoff ou marca como failed
 */
async function processJob(job) {
    const { id, cpf, phone, lead_id, attempts } = job;
    console.log("[Worker] Processando job " + id + " tentativa " + (attempts + 1) + " CPF=" + cpf.substring(0, 3) + "...");

    // Marca o job como "processing" no banco
    await pool.query(
        "UPDATE rpa_jobs SET status = 'processing', started_at = NOW(), attempts = attempts + 1, updated_at = NOW() WHERE id = $1",
        [id]
    );

    try {
        // --- Etapa 0: Verificar se já existe resultado no NOSSO banco (evita KSI completamente) ---
        const existingReport = await pool.query(
            "SELECT id, analysis_json, report_summary, has_pendencias FROM consulta_credito.rpa_jobs WHERE cpf = $1 AND status = 'completed' AND analysis_json IS NOT NULL AND id != $2 ORDER BY completed_at DESC LIMIT 1",
            [cpf.replace(/\D/g, ""), id]
        );
        if (existingReport.rows.length > 0) {
            console.log("[Worker] CPF already has completed report in DB, reusing job " + existingReport.rows[0].id);
            const existing = existingReport.rows[0];
            // Mark current job as completed with existing data
            await pool.query(
                "UPDATE rpa_jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW(), report_summary = $2, has_pendencias = $3, analysis_json = $4 WHERE id = $1",
                [id, existing.report_summary, existing.has_pendencias, existing.analysis_json]
            );
            // Trigger post-delivery and CRM updates
            try {
                await fetch("http://localhost:3001/api/automation/post-delivery", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                    body: JSON.stringify({
                        lead_id: lead_id,
                        has_pendencias: existing.has_pendencias,
                        report_summary: (existing.report_summary || "").substring(0, 2000),
                        analysis_json: existing.analysis_json ? (typeof existing.analysis_json === "string" ? JSON.parse(existing.analysis_json) : existing.analysis_json) : null
                    })
                });
            } catch (pdErr) { console.error("[Worker] Post-delivery error (reused):", pdErr.message); }
            // Move lead to entregue
            if (lead_id) {
                try {
                    await fetch("http://localhost:3001/api/automation/leads/" + lead_id + "/move", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                        body: JSON.stringify({ pipeline_stage: "entregue", status: "completed" })
                    }).catch(() => {});
                } catch (e) {}
            }
            // Trigger PDF sending via webhook
            try {
                await fetch("http://localhost:3001/api/webhooks/send-report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                    body: JSON.stringify({ lead_id, phone, job_id: id, reused: true })
                });
            } catch (sendErr) { console.error("[Worker] Send report error (reused):", sendErr.message); }
            console.log("[Worker] Job " + id + " completed via DB reuse (no KSI needed)");
            return;
        }

        // --- Etapa 1: Consulta KSI e geração do PDF ---
        const consultaResult = await runKSIConsultation(cpf);
        const pdfPath = consultaResult.pdfPath;
        const hasPendencias = consultaResult.hasPendencias;
        const reportSummary = consultaResult.reportSummary || "";
        const analysisJson = consultaResult.analysisJson || null;

        // --- Etapa 2: Upload e envio do PDF via WhatsApp ---
        const mediaId = await uploadMedia(pdfPath);

        const cleanCpf = cpf.replace(/\D/g, "");
        const filename = "Rating_Bancario_" + cleanCpf + ".pdf";
        // Caption com CPF parcialmente mascarado (LGPD)
        const caption = "Seu Rating Bancario Completo esta pronto! Analise detalhada do CPF " +
            cleanCpf.substring(0, 3) + ".***.***-" + cleanCpf.substring(9);
        const waMessageId = await sendDocument(phone, mediaId, filename, caption);

        // --- Etapa 3: Atualiza job no banco com resultado da análise ---
        await pool.query(
            "UPDATE rpa_jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW(), report_summary = $2, has_pendencias = $3, analysis_json = $4 WHERE id = $1",
            [id, (reportSummary || "").substring(0, 5000), hasPendencias, analysisJson ? JSON.stringify(analysisJson) : null]
        );

        // --- Etapa 4: Dispara fluxo pós-entrega (upsell se tiver pendências) ---
        try {
            await fetch("http://localhost:3001/api/automation/post-delivery", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                body: JSON.stringify({
                    lead_id: lead_id,
                    has_pendencias: hasPendencias,
                    report_summary: (reportSummary || "").substring(0, 2000),
                    analysis_json: analysisJson || null
                })
            });
            console.log("[RPA] Post-delivery trigger sent for lead " + lead_id);
        } catch (pdErr) {
            console.error("[RPA] Error triggering post-delivery:", pdErr.message);
        }

        // --- Etapa 5: Registra eventos e move lead no pipeline do CRM ---
        try {
            // Loga evento de conclusão do RPA
            await fetch("http://localhost:3001/api/automation/log-event", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                body: JSON.stringify({
                    event_type: "rpa_completed",
                    lead_id: lead_id,
                    payload: { cpf: cleanCpf.substring(0, 3) + "***", pdf_sent: true, wa_message_id: waMessageId }
                })
            });
            if (lead_id) {
                // Loga evento de PDF enviado
                await fetch("http://localhost:3001/api/automation/log-event", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                    body: JSON.stringify({
                        event_type: "pdf_sent",
                        lead_id: lead_id,
                        payload: { filename: filename, wa_message_id: waMessageId }
                    })
                }).catch(() => {});

                // Move lead para pipeline_stage "entregue" no CRM
                await fetch("http://localhost:3001/api/automation/leads/" + lead_id + "/move", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                    body: JSON.stringify({ pipeline_stage: "entregue", status: "completed" })
                }).catch(() => {});
            }
        } catch (notifyErr) {
            console.error("[Worker] Erro ao notificar API:", notifyErr.message);
        }

        // Remove PDF do disco após entrega + análise bem-sucedida (economia de espaço)
        try { fs.unlinkSync(pdfPath); console.log("[RPA] PDF deleted: " + pdfPath); } catch(e) { console.error("[RPA] Failed to delete PDF:", e.message); }
        console.log("[Worker] Job " + id + " completo com sucesso!");

    } catch (err) {
        console.error("[Worker] Job " + id + " FALHOU:", err.message);

        const newAttempts = (attempts || 0) + 1;
        const maxAttempts = job.max_attempts || 3; // Padrão: 3 tentativas

        if (newAttempts >= maxAttempts) {
            // Esgotou tentativas — marca como failed definitivamente
            await pool.query(
                "UPDATE rpa_jobs SET status = 'failed', error = $1, updated_at = NOW() WHERE id = $2",
                [err.message.substring(0, 500), id]
            );
            console.error("[Worker] Job " + id + " FALHOU definitivamente apos " + newAttempts + " tentativas");

            try {
                // Loga erro no CRM
                await fetch("http://localhost:3001/api/automation/log-event", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-automation-key": AUTOMATION_API_KEY },
                    body: JSON.stringify({
                        event_type: "rpa_error",
                        lead_id: lead_id,
                        payload: { error: err.message, attempts: newAttempts }
                    })
                });
                // Envia mensagem de desculpa para o lead via WhatsApp
                if (phone && META_TOKEN) {
                    await fetch("https://graph.facebook.com/v21.0/" + META_PHONE_ID + "/messages", {
                        method: "POST",
                        headers: { "Authorization": "Bearer " + META_TOKEN, "Content-Type": "application/json" },
                        body: JSON.stringify({
                            messaging_product: "whatsapp", to: phone, type: "text",
                            text: { body: "Oi, tivemos um problema tecnico na geracao do seu relatorio. Nossa equipe ja foi notificada e vamos resolver em breve. Desculpa pelo transtorno!" }
                        })
                    });
                }
            } catch (e) { /* ignora — notificação é best-effort */ }
        } else {
            // Ainda tem tentativas — reagenda com backoff exponencial (2min, 5min, 10min)
            const backoffMinutes = [2, 5, 10][newAttempts - 1] || 10;
            await pool.query(
                "UPDATE rpa_jobs SET status = 'pending', error = $1, next_retry_at = NOW() + INTERVAL '" + backoffMinutes + " minutes', updated_at = NOW() WHERE id = $2",
                [err.message.substring(0, 500), id]
            );
            console.log("[Worker] Job " + id + " reagendado para retry em " + backoffMinutes + "min");
        }
    }
}

// ============================================
// Worker: Polling da fila de jobs no PostgreSQL
// ============================================

/**
 * Busca e processa o próximo job pendente na fila.
 * Usa SELECT FOR UPDATE SKIP LOCKED para evitar conflito entre workers (futuro multi-worker).
 * Cada job tem timeout de 5 minutos — se travar, mata o Chromium e libera o worker.
 */
async function pollJobs() {
    if (isProcessing || shuttingDown) return; // Evita processamento simultâneo

    try {
        // Pega o próximo job pendente de forma atômica (lock otimista)
        const result = await pool.query(
            "UPDATE rpa_jobs SET status = 'picked' WHERE id = (SELECT id FROM rpa_jobs WHERE status = 'pending' AND next_retry_at <= NOW() ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *"
        );

        if (result.rows.length === 0) return; // Fila vazia

        isProcessing = true;
        const job = result.rows[0];
        console.log("[Worker] Job encontrado: " + job.id);

        // Timeout de segurança: 5 minutos por job (mata Chromium se travar)
        const JOB_TIMEOUT = 300000;
        const timeoutId = setTimeout(() => {
            console.error("[Worker] Job " + job.id + " TIMEOUT 5min — matando processos chromium...");
            activeBrowser = null;
            activePage = null;
            try {
                require("child_process").execSync("pkill -f 'chromium.*--headless' || true");
            } catch (e) { /* ignora */ }
        }, JOB_TIMEOUT);

        try {
            // Race entre processamento e timeout — o que terminar primeiro vence
            await Promise.race([
                processJob(job),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Job timeout 5min')), JOB_TIMEOUT))
            ]);
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (err) {
        console.error("[Worker] Erro no poll:", err.message);
    } finally {
        isProcessing = false;
    }
}

// ============================================
// Recovery: recupera jobs travados (ex: após restart do serviço)
// ============================================

/**
 * Recupera jobs que ficaram em status "processing" ou "picked" por mais de 10 minutos.
 * Isso acontece quando o serviço reinicia no meio de um job.
 * Se o job já esgotou tentativas, marca como failed; senão, recoloca na fila.
 */
async function recoverStuckJobs() {
    try {
        const result = await pool.query(
            "UPDATE rpa_jobs SET status = 'pending', next_retry_at = NOW(), updated_at = NOW() WHERE status IN ('processing', 'picked') AND started_at < NOW() - INTERVAL '10 minutes' RETURNING id, attempts, max_attempts"
        );
        if (result.rowCount > 0) {
            for (const row of result.rows) {
                if ((row.attempts || 0) >= (row.max_attempts || 3)) {
                    // Esgotou tentativas enquanto estava travado — falha definitiva
                    await pool.query("UPDATE rpa_jobs SET status = 'failed', error = 'Stuck timeout after max attempts', updated_at = NOW() WHERE id = $1", [row.id]);
                    console.log("[Worker] Job " + row.id + " marcado como failed (stuck + max attempts)");
                } else {
                    console.log("[Worker] Job " + row.id + " recuperado de stuck para retry");
                }
            }
        }
    } catch (err) {
        console.error("[Worker] Erro no recovery:", err.message);
    }
}

// ============================================
// API Endpoints — interface HTTP para o serviço RPA
// ============================================

// Middleware de autenticação: valida x-automation-key (compartilhada entre serviços internos)
function rpaAuth(req, res, next) {
    const autoKey = req.headers['x-automation-key'];
    if (!AUTOMATION_API_KEY || autoKey !== AUTOMATION_API_KEY) {
        return res.status(401).json({ error: 'x-automation-key invalida' });
    }
    next();
}

// POST /api/rpa/consulta — Insere novo job na fila de consultas
// Chamado pela API principal (localhost:3001) após pagamento confirmado
app.post("/api/rpa/consulta", rpaAuth, async (req, res) => {
    const { cpf, phone, lead_id } = req.body;
    if (!cpf || !phone) {
        return res.status(400).json({ error: "cpf e phone obrigatorios" });
    }

    // Validações de entrada
    const cleanCpf = cpf.replace(/\D/g, '');
    if (!isValidCPF(cleanCpf)) {
        return res.status(400).json({ error: "CPF invalido" });
    }
    if (!isValidBRPhone(phone)) {
        return res.status(400).json({ error: "Telefone invalido. Formato: 55XXXXXXXXXXX" });
    }

    // Reutilização: se já existe consulta COMPLETA pra esse CPF, reutiliza
    try {
        const completedJob = await pool.query(
            "SELECT id, lead_id, report_summary, has_pendencias, analysis_json FROM rpa_jobs WHERE cpf = $1 AND status = 'completed' AND analysis_json IS NOT NULL ORDER BY created_at DESC LIMIT 1",
            [cleanCpf]
        );
        if (completedJob.rows.length > 0) {
            const existing = completedJob.rows[0];
            console.log('[API] CPF ja consultado anteriormente (job ' + existing.id + '), reutilizando resultado');
            // Cria job já completed com dados do anterior
            const reuseResult = await pool.query(
                "INSERT INTO rpa_jobs (lead_id, cpf, phone, status, report_summary, has_pendencias, analysis_json, completed_at) VALUES ($1, $2, $3, 'completed', $4, $5, $6, NOW()) RETURNING id",
                [lead_id || null, cleanCpf, phone, existing.report_summary, existing.has_pendencias, existing.analysis_json]
            );
            // Atualizar lead pra entregue
            if (lead_id) {
                await pool.query("UPDATE consulta_credito.leads SET pipeline_stage = 'entregue', status = 'completed', consultation_result = $2, consultation_done_at = NOW() WHERE id = $1", [lead_id, existing.analysis_json]);
            }
            // Disparar envio do PDF via webhook
            try {
                await fetch('http://localhost:3001/api/webhooks/send-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-automation-key': process.env.AUTOMATION_API_KEY || '' },
                    body: JSON.stringify({ lead_id, phone, job_id: reuseResult.rows[0].id, reused: true })
                });
            } catch (sendErr) { console.error('[API] Erro ao enviar report reutilizado:', sendErr.message); }
            return res.json({ status: 'reused', job_id: reuseResult.rows[0].id, original_job_id: existing.id, message: 'Consulta reutilizada do historico' });
        }
    } catch (err) {
        console.error('[API] Erro ao verificar historico:', err.message);
    }

    // Deduplicação: impede dois jobs simultâneos para o mesmo CPF
    try {
        const existingJob = await pool.query(
            "SELECT id, status FROM rpa_jobs WHERE cpf = $1 AND status IN ('pending', 'processing', 'picked') LIMIT 1",
            [cleanCpf]
        );
        if (existingJob.rows.length > 0) {
            return res.status(409).json({ error: "Ja existe job " + existingJob.rows[0].status + " para este CPF", job_id: existingJob.rows[0].id });
        }
    } catch (err) {
        console.error("[API] Erro ao verificar dedup:", err.message);
    }

    console.log("[API] Job recebido via HTTP: CPF=" + cleanCpf.substring(0, 3) + "... phone=" + phone);

    try {
        // Insere job na tabela rpa_jobs com status 'pending' e next_retry_at = agora
        const result = await pool.query(
            "INSERT INTO rpa_jobs (lead_id, cpf, phone, status, next_retry_at) VALUES ($1, $2, $3, 'pending', NOW()) RETURNING id",
            [lead_id || null, cleanCpf, phone]
        );
        res.json({ status: "queued", job_id: result.rows[0].id, message: "Job adicionado a fila" });
    } catch (err) {
        console.error("[API] Erro ao criar job:", err.message);
        res.status(500).json({ error: "Erro ao criar job: " + err.message });
    }
});

// GET /api/rpa/jobs — Lista os 20 jobs mais recentes (CPF mascarado por LGPD)
app.get("/api/rpa/jobs", async (_req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, lead_id, cpf, phone, status, attempts, max_attempts, error, created_at, started_at, completed_at FROM rpa_jobs ORDER BY created_at DESC LIMIT 20"
        );
        const jobs = result.rows.map(j => ({ ...j, cpf: j.cpf.substring(0, 3) + "********" })); // Mascara CPF
        res.json({ jobs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/rpa/jobs/:id/retry — Recoloca um job failed na fila para nova tentativa
app.post("/api/rpa/jobs/:id/retry", rpaAuth, async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE rpa_jobs SET status = 'pending', next_retry_at = NOW(), error = NULL, updated_at = NOW() WHERE id = $1 AND status = 'failed' RETURNING id",
            [req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: "Job nao encontrado ou nao esta failed" });
        res.json({ status: "retrying", job_id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/rpa/health — Health check com contadores da fila (usado por Uptime Kuma)
app.get("/api/rpa/health", async (_req, res) => {
    try {
        const pending = await pool.query("SELECT COUNT(*) as count FROM rpa_jobs WHERE status = 'pending'");
        const processing = await pool.query("SELECT COUNT(*) as count FROM rpa_jobs WHERE status IN ('processing', 'picked')");
        const failed = await pool.query("SELECT COUNT(*) as count FROM rpa_jobs WHERE status = 'failed'");
        res.json({
            status: "ok",
            is_processing: isProcessing,
            queue: {
                pending: parseInt(pending.rows[0].count),
                processing: parseInt(processing.rows[0].count),
                failed: parseInt(failed.rows[0].count)
            },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.json({ status: "ok", db: "error", timestamp: new Date().toISOString() });
    }
});

// ============================================
// Startup — inicialização do serviço
// ============================================
app.listen(PORT, '127.0.0.1', async () => { // Bind apenas em localhost (acesso via API principal)
    console.log("[RPA] Servico rodando na porta " + PORT);
    await recoverStuckJobs(); // Recupera jobs que ficaram travados em restarts anteriores
    console.log("[Worker] Poll iniciado (intervalo: " + (POLL_INTERVAL / 1000) + "s)");
    pollTimer = setInterval(pollJobs, POLL_INTERVAL); // Polling da fila a cada 30s
    setInterval(recoverStuckJobs, 300000); // Verifica jobs travados a cada 5 min
    setTimeout(pollJobs, 2000); // Primeiro poll 2s após startup (processamento imediato)
});

// Graceful shutdown — aguarda job atual terminar antes de encerrar (max 60s)
process.on('SIGTERM', async () => {
    console.log('[RPA] SIGTERM recebido, aguardando job atual...');
    shuttingDown = true;
    if (pollTimer) clearInterval(pollTimer);
    // Espera até 60s para o job atual terminar
    const start = Date.now();
    while (isProcessing && Date.now() - start < 60000) {
        await new Promise(r => setTimeout(r, 1000));
    }
    // Fecha browser persistente do Puppeteer
    if (activeBrowser) {
        try { await activeBrowser.close(); } catch(e) {}
        activeBrowser = null;
        activePage = null;
        console.log('[RPA] Browser persistente fechado');
    }
    await pool.end(); // Fecha pool de conexões PostgreSQL
    console.log('[RPA] Shutdown completo');
    process.exit(0);
});
process.on('SIGINT', () => process.emit('SIGTERM')); // Ctrl+C também faz shutdown graceful
