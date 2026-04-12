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

        // Go to Consultas Realizadas
        await page.goto(KSI_URL + "/consultasRealizadasSearch", { waitUntil: "networkidle2", timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));

        // The form uses a daterangepicker. We need to set the date range and submit.
        // The RPA job completed on 2026-04-03 23:30. Set range to cover that.
        // Set the hidden inputs for the daterangepicker
        await page.evaluate(() => {
            // Set a wide range to capture the consultation
            const startInput = document.querySelector("input[name='daterangepicker_start']");
            const endInput = document.querySelector("input[name='daterangepicker_end']");
            const rangeInput = document.querySelector("#reportrange");
            if (startInput) startInput.value = "01/04/2026";
            if (endInput) endInput.value = "04/04/2026";
            if (rangeInput) rangeInput.value = "01/04/2026 - 04/04/2026";
        });

        // Click Buscar
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll("button, input[type=submit], a.btn, .btn"));
            for (const b of btns) {
                const txt = (b.textContent || b.value || "").toLowerCase().trim();
                if (txt === "buscar" || txt.includes("buscar")) {
                    b.click();
                    return true;
                }
            }
            const form = document.querySelector("form");
            if (form) { form.submit(); return true; }
            return false;
        });

        await new Promise(r => setTimeout(r, 8000));
        await page.screenshot({ path: "/tmp/ksi_hist_results.png" });

        // Check results
        const resultText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
        console.log("[Resend] Results:", resultText.substring(0, 800));

        // Check if our CPF appears
        const hasCpf = resultText.includes(TARGET_CPF) || resultText.includes("112.827.766-22");
        console.log("[Resend] CPF found in results:", hasCpf);

        // Get all rows from the table
        const rows = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("table tbody tr")).map(tr => {
                const cells = Array.from(tr.querySelectorAll("td"));
                const links = Array.from(tr.querySelectorAll("a"));
                return {
                    text: cells.map(c => c.textContent.trim()).join(" | "),
                    links: links.map(a => ({ text: a.textContent.trim(), href: a.href }))
                };
            });
        });
        console.log("[Resend] Table rows:", rows.length);
        rows.forEach((r, i) => console.log("  Row " + i + ":", r.text.substring(0, 150)));

        // Find row with our CPF
        let targetRow = null;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].text.includes(TARGET_CPF) || rows[i].text.includes("112.827.766-22") || rows[i].text.includes("11282776622")) {
                targetRow = i;
                break;
            }
        }

        if (targetRow === null && rows.length > 0) {
            // If not found by CPF, check if there's a "Rating" consultation
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].text.toLowerCase().includes("rating")) {
                    console.log("[Resend] Found Rating row:", rows[i].text.substring(0, 150));
                    targetRow = i;
                    break;
                }
            }
        }

        if (targetRow !== null) {
            console.log("[Resend] Found target at row " + targetRow + ":", rows[targetRow].text.substring(0, 150));

            // Click the row/link to open the consultation
            const clickResult = await page.evaluate((rowIdx) => {
                const tr = document.querySelectorAll("table tbody tr")[rowIdx];
                if (!tr) return "row not found";
                // Try clicking any link in the row
                const link = tr.querySelector("a");
                if (link) { link.click(); return "clicked link: " + link.href; }
                // Try clicking the row itself
                tr.click();
                return "clicked row";
            }, targetRow);
            console.log("[Resend] Click:", clickResult);

            await new Promise(r => setTimeout(r, 10000));
            await page.screenshot({ path: "/tmp/ksi_hist_detail.png" });
            console.log("[Resend] Detail URL:", page.url());

            // Check if we're on a result page with content
            const detailText = await page.evaluate(() => document.body.innerText.substring(0, 500));
            console.log("[Resend] Detail page:", detailText.substring(0, 300));

            // Generate PDF
            console.log("[Resend] Gerando PDF...");
            await page.evaluate(() => {
                const remove = document.querySelectorAll(".main-sidebar, .main-header, .main-footer, .hidden-print, .breadcrumb, .content-header, .navbar, nav");
                remove.forEach(el => el.remove());
                const wrapper = document.querySelector(".content-wrapper") || document.querySelector(".main-content") || document.querySelector("main");
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
            console.log("[Resend] PDF:", pdfPath, "(" + pdfSize + " bytes)");

            if (pdfSize < 5000) {
                console.error("[Resend] PDF muito pequeno");
                await browser.close();
                process.exit(1);
            }

            // Upload to WhatsApp
            console.log("[Resend] Upload WhatsApp...");
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
            console.log("[Resend] Enviando...");
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
                console.error("[Resend] Envio falhou:", JSON.stringify(sendData));
            }

            fs.unlinkSync(pdfPath);
        } else {
            console.log("[Resend] Nenhuma consulta encontrada para o CPF no periodo.");
            console.log("[Resend] Verifique screenshots.");
        }

        await browser.close();
    } catch (err) {
        console.error("[Resend] ERRO:", err.message);
        await browser.close().catch(() => {});
        process.exit(1);
    }
}

main();
