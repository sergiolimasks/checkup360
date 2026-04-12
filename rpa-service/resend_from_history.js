const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "/root/rpa-service/.env" });

const KSI_URL = "https://painel.ksiconsultas.com.br";
const KSI_EMAIL = process.env.KSI_EMAIL || "contato@agenciaevergrowth.com.br";
const KSI_PASSWORD = process.env.KSI_PASSWORD || "@Ever2026";
const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_NUMBER_ID;
const DOWNLOAD_DIR = "/tmp/ksi-downloads";
const TARGET_CPF = "11282776622";
const TARGET_PHONE = "5535998222883";

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

async function main() {
    console.log("[Resend] Acessando historico KSI para CPF " + TARGET_CPF.substring(0,3) + "...");

    const browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium",
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });

        // 1. LOGIN
        console.log("[Resend] Login...");
        await page.goto(KSI_URL + "/", { waitUntil: "networkidle2", timeout: 30000 });
        await page.type("#login", KSI_EMAIL, { delay: 20 });
        await page.type("#senha", KSI_PASSWORD, { delay: 20 });
        await page.click(".order");
        await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 3000));
        console.log("[Resend] Logado. URL:", page.url());

        // 2. ACESSAR HISTORICO DE CONSULTAS
        console.log("[Resend] Acessando historico de consultas...");
        await page.goto(KSI_URL + "/consultas/consultasRealizadasSearch", { waitUntil: "networkidle2", timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: "/tmp/ksi_history_page.png" });

        // 3. BUSCAR POR CPF
        console.log("[Resend] Buscando CPF no historico...");
        const searchFields = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll("input[type=text], input[type=search], input.form-control"));
            return inputs.map(i => ({ id: i.id, name: i.name, placeholder: i.placeholder, className: i.className }));
        });
        console.log("[Resend] Campos encontrados:", JSON.stringify(searchFields));

        // Tentar preencher campo de CPF
        const cpfSelector = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll("input"));
            for (const inp of inputs) {
                if (inp.id.includes("cpf") || inp.name.includes("cpf") || (inp.placeholder && inp.placeholder.toLowerCase().includes("cpf")) || inp.name.includes("documento")) {
                    return "#" + inp.id;
                }
            }
            const first = document.querySelector("input[type=text], input.form-control");
            return first ? (first.id ? "#" + first.id : null) : null;
        });
        console.log("[Resend] Campo CPF selector:", cpfSelector);

        if (cpfSelector) {
            await page.type(cpfSelector, TARGET_CPF, { delay: 30 });
        } else {
            // try first input
            const firstInput = await page.$("input[type=text]");
            if (firstInput) {
                await firstInput.type(TARGET_CPF, { delay: 30 });
            }
        }

        // Clicar em buscar/pesquisar
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll("button, input[type=submit], a.btn"));
            for (const b of btns) {
                const txt = (b.textContent || b.value || "").toLowerCase();
                if (txt.includes("buscar") || txt.includes("pesquisar") || txt.includes("filtrar") || txt.includes("search") || txt.includes("consultar")) {
                    b.click();
                    return true;
                }
            }
            const form = document.querySelector("form");
            if (form) { form.submit(); return true; }
            return false;
        });

        await new Promise(r => setTimeout(r, 5000));
        await page.screenshot({ path: "/tmp/ksi_history_search.png" });

        // 4. ENCONTRAR A CONSULTA
        console.log("[Resend] Procurando resultado...");
        const pageText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
        console.log("[Resend] Texto pagina:", pageText.substring(0, 500));

        // Encontrar e clicar na consulta
        const clicked = await page.evaluate((cpf) => {
            // Try table rows
            const rows = Array.from(document.querySelectorAll("tr"));
            for (const row of rows) {
                const text = row.textContent || "";
                if (text.includes(cpf) || text.includes("112.827.766-22") || text.includes("11282776622")) {
                    const link = row.querySelector("a") || row.querySelector("button") || row.querySelector(".btn");
                    if (link) { link.click(); return "clicked link in row"; }
                    row.click();
                    return "clicked row";
                }
            }
            // Try any link with the CPF
            const links = Array.from(document.querySelectorAll("a"));
            for (const a of links) {
                if ((a.textContent || "").includes(cpf) || (a.href || "").includes(cpf)) {
                    a.click();
                    return "clicked link";
                }
            }
            return null;
        }, TARGET_CPF);
        console.log("[Resend] Click result:", clicked);

        if (clicked) {
            await new Promise(r => setTimeout(r, 8000));
            await page.screenshot({ path: "/tmp/ksi_history_detail.png" });
            console.log("[Resend] URL apos click:", page.url());

            // 5. GERAR PDF DA PAGINA
            console.log("[Resend] Gerando PDF...");
            await page.evaluate(() => {
                const remove = document.querySelectorAll(".main-sidebar, .main-header, .main-footer, .hidden-print, .breadcrumb, .content-header");
                remove.forEach(el => el.remove());
                const wrapper = document.querySelector(".content-wrapper");
                if (wrapper) { wrapper.style.marginLeft = "0"; wrapper.style.padding = "20px"; }
            });

            const pdfPath = path.join(DOWNLOAD_DIR, "rating_" + TARGET_CPF + "_resend.pdf");
            await page.pdf({
                path: pdfPath,
                format: "A4",
                printBackground: true,
                margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
            });

            const pdfSize = fs.statSync(pdfPath).size;
            console.log("[Resend] PDF gerado:", pdfPath, "(" + pdfSize + " bytes)");

            if (pdfSize < 5000) {
                console.error("[Resend] PDF muito pequeno, possivel erro");
                await browser.close();
                process.exit(1);
            }

            // 6. UPLOAD PRO WHATSAPP
            console.log("[Resend] Uploading para WhatsApp...");
            const { fileFromPath } = await import("formdata-node/file-from-path");
            const { FormData } = await import("formdata-node");
            const form = new FormData();
            form.set("messaging_product", "whatsapp");
            form.set("type", "application/pdf");
            form.set("file", await fileFromPath(pdfPath, { type: "application/pdf" }));

            const uploadRes = await fetch("https://graph.facebook.com/v21.0/" + META_PHONE_ID + "/media", {
                method: "POST",
                headers: { "Authorization": "Bearer " + META_TOKEN },
                body: form
            });
            const uploadData = await uploadRes.json();
            console.log("[Resend] Upload response:", JSON.stringify(uploadData));

            if (!uploadData.id) {
                console.error("[Resend] Falha no upload");
                await browser.close();
                process.exit(1);
            }

            // 7. ENVIAR DOCUMENTO
            console.log("[Resend] Enviando documento para " + TARGET_PHONE + "...");
            const sendRes = await fetch("https://graph.facebook.com/v21.0/" + META_PHONE_ID + "/messages", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + META_TOKEN,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: TARGET_PHONE,
                    type: "document",
                    document: {
                        id: uploadData.id,
                        filename: "Rating_Bancario_" + TARGET_CPF + ".pdf",
                        caption: "Oi Jean! Aqui esta seu Rating Bancario Completo!"
                    }
                })
            });
            const sendData = await sendRes.json();
            console.log("[Resend] Send response:", JSON.stringify(sendData));

            if (sendData.messages && sendData.messages[0]) {
                console.log("[Resend] SUCESSO! wa_message_id:", sendData.messages[0].id);

                // Log system event
                await fetch("http://localhost:3001/api/automation/log-event", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event_type: "pdf_sent",
                        lead_id: "d36d08a4-561c-4163-b080-fc9c1ec19897",
                        payload: { wa_message_id: sendData.messages[0].id, source: "history_resend" }
                    })
                });
            } else {
                console.error("[Resend] Falha ao enviar:", JSON.stringify(sendData));
            }

            // Cleanup
            fs.unlinkSync(pdfPath);
        } else {
            console.log("[Resend] Consulta NAO encontrada no historico.");
            console.log("[Resend] Verifique os screenshots em /tmp/ksi_history_*.png");
        }

        await browser.close();
    } catch (err) {
        console.error("[Resend] ERRO:", err.message);
        await browser.close().catch(() => {});
        process.exit(1);
    }
}

main();
