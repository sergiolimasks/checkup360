const puppeteer = require("puppeteer-core");
require("dotenv").config({ path: "/root/rpa-service/.env" });

const KSI_URL = "https://painel.ksiconsultas.com.br";
const KSI_EMAIL = process.env.KSI_EMAIL || "contato@agenciaevergrowth.com.br";
const KSI_PASSWORD = process.env.KSI_PASSWORD || "@Ever2026";

async function main() {
    const browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium",
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // LOGIN
    await page.goto(KSI_URL + "/", { waitUntil: "networkidle2", timeout: 30000 });
    await page.type("#login", KSI_EMAIL, { delay: 20 });
    await page.type("#senha", KSI_PASSWORD, { delay: 20 });
    await page.click(".order");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    console.log("Logado. URL:", page.url());

    // Get all menu links from sidebar
    const links = await page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll("a"));
        return allLinks.map(a => ({
            text: (a.textContent || "").trim().substring(0, 60),
            href: a.href || ""
        })).filter(l => l.href && l.href.includes("ksiconsultas"));
    });
    console.log("\n=== MENU LINKS ===");
    links.forEach(l => console.log(l.text, "->", l.href));

    // Take screenshot of dashboard/sidebar
    await page.screenshot({ path: "/tmp/ksi_dashboard.png", fullPage: true });

    // Try common URLs for history
    const tryUrls = [
        "/consultas/realizadas",
        "/consultas/historico",
        "/consultas/consultasRealizadas",
        "/historico",
        "/consultas",
        "/relatorios",
        "/minhas-consultas"
    ];

    for (const url of tryUrls) {
        const resp = await page.goto(KSI_URL + url, { waitUntil: "networkidle2", timeout: 10000 }).catch(() => null);
        const status = resp ? resp.status() : "error";
        const isError = await page.evaluate(() => document.body.innerText.includes("Error Page") || document.body.innerText.includes("404"));
        console.log(url, "-> status:", status, isError ? "(ERROR PAGE)" : "(OK)");
        if (!isError && status === 200) {
            await page.screenshot({ path: "/tmp/ksi_found_" + url.replace(/\//g, "_") + ".png" });
            const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
            console.log("  Content:", text.substring(0, 200));
        }
    }

    await browser.close();
}

main();
