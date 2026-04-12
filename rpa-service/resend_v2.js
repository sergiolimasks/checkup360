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
    console.log("[Resend] Acessando historico KSI...");

    const browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium",
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process"]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });

        // LOGIN
        await page.goto(KSI_URL + "/", { waitUntil: "networkidle2", timeout: 30000 });
        await page.type("#login", KSI_EMAIL, { delay: 20 });
        await page.type("#senha", KSI_PASSWORD, { delay: 20 });
        await page.click(".order");
        await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 3000));
        console.log("[Resend] Logado.");

        // HISTORICO - URL correta
        console.log("[Resend] Acessando Consultas Realizadas...");
        await page.goto(KSI_URL + "/consultasRealizadasSearch", { waitUntil: "networkidle2", timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: "/tmp/ksi_hist_page.png" });

        // Check page content
        const pageText = await page.evaluate(() => document.body.innerText.substring(0, 500));
        console.log("[Resend] Page text:", pageText.substring(0, 300));

        // Find form fields
        const fields = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll("input, select"));
            return inputs.map(i => ({
                tag: i.tagName,
                type: i.type,
                id: i.id,
                name: i.name,
                placeholder: i.placeholder || ""
            }));
        });
        console.log("[Resend] Form fields:", JSON.stringify(fields));

        // Try to fill CPF/documento field
        let filled = false;
        for (const f of fields) {
            const idLower = (f.id || "").toLowerCase();
            const nameLower = (f.name || "").toLowerCase();
            if (idLower.includes("cpf") || nameLower.includes("cpf") || idLower.includes("documento") || nameLower.includes("documento")) {
                const sel = f.id ? "#" + f.id : "[name='" + f.name + "']";
                await page.type(sel, TARGET_CPF, { delay: 30 });
                console.log("[Resend] Preencheu campo:", sel);
                filled = true;
                break;
            }
        }

        if (!filled) {
            // Try first text input
            const firstText = fields.find(f => f.type === "text");
            if (firstText) {
                const sel = firstText.id ? "#" + firstText.id : "[name='" + firstText.name + "']";
                await page.type(sel, TARGET_CPF, { delay: 30 });
                console.log("[Resend] Preencheu primeiro campo texto:", sel);
                filled = true;
            }
        }

        // Click search/submit button
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll("button, input[type=submit], a.btn, .btn"));
            for (const b of btns) {
                const txt = (b.textContent || b.value || "").toLowerCase();
                if (txt.includes("buscar") || txt.includes("pesquisar") || txt.includes("filtrar") || txt.includes("consultar")) {
                    b.click();
                    return true;
                }
            }
            const form = document.querySelector("form");
            if (form) { form.submit(); return true; }
            return false;
        });

        await new Promise(r => setTimeout(r, 5000));
        await page.screenshot({ path: "/tmp/ksi_hist_search.png" });

        // Check results
        const resultText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
        console.log("[Resend] Result text:", resultText.substring(0, 500));

        // Find the row with our CPF and click to view details
        const clicked = await page.evaluate((cpf) => {
            const formattedCpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            const rows = Array.from(document.querySelectorAll("tr, .list-item"));
            for (const row of rows) {
                const text = row.textContent || "";
                if (text.includes(cpf) || text.includes(formattedCpf)) {
                    // Find view/detail link
                    const link = row.querySelector("a");
                    if (link) {
                        const href = link.href;
                        link.click();
                        return "clicked link: " + href;
                    }
                    // Try any button
                    const btn = row.querySelector("button, .btn");
                    if (btn) { btn.click(); return "clicked button"; }
                    row.click();
                    return "clicked row";
                }
            }
            return null;
        }, TARGET_CPF);
        console.log("[Resend] Click result:", clicked);

        if (!clicked) {
            // Maybe results are shown differently - try to find the rating link
            const allLinks = await page.evaluate(() => {
                return Array.from(document.querySelectorAll("a")).map(a => ({
                    text: (a.textContent || "").trim().substring(0, 80),
                    href: a.href
                })).filter(l => l.href.includes("rating") || l.href.includes("Rating") || l.href.includes("credito") || l.text.toLowerCase().includes("rating"));
            });
            console.log("[Resend] Rating links found:", JSON.stringify(allLinks.slice(0, 10)));
            console.log("[Resend] Consulta nao encontrada. Verifique screenshots.");
            await browser.close();
            process.exit(1);
        }

        // Wait for detail page
        await new Promise(r => setTimeout(r, 10000));
        await page.screenshot({ path: "/tmp/ksi_hist_detail.png" });
        console.log("[Resend] Detail URL:", page.url());

        // Generate PDF
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
            console.error("[Resend] PDF muito pequeno");
            await browser.close();
            process.exit(1);
        }

        // Upload to WhatsApp
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
        console.log("[Resend] Upload:", JSON.stringify(uploadData));

        if (!uploadData.id) {
            console.error("[Resend] Upload falhou");
            await browser.close();
            process.exit(1);
        }

        // Send document
        console.log("[Resend] Enviando para " + TARGET_PHONE + "...");
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
        console.log("[Resend] Send:", JSON.stringify(sendData));

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
            console.log("[Resend] System event logged.");
        } else {
            console.error("[Resend] Send falhou:", JSON.stringify(sendData));
        }

        fs.unlinkSync(pdfPath);
        await browser.close();
    } catch (err) {
        console.error("[Resend] ERRO:", err.message);
        await browser.close().catch(() => {});
        process.exit(1);
    }
}

main();
