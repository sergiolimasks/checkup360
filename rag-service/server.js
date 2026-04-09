const http = require("http");
const https = require("https");

const PORT = 3200;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

const KNOWLEDGE_BASE = `
VOCE E UM CONSULTOR FINANCEIRO ESPECIALISTA DA CHECKUP360.
Responda SEMPRE em portugues brasileiro. Seja persuasivo mas honesto. Use dados especificos.

== PRODUTO PRINCIPAL ==
Consulta de Credito Completa (Rating Bancario): R$99
Inclui: Score (0-1000), classificacao AAA-C, restricoes SPC/Serasa, protestos, CCF, historico Banco Central (SCR), dados cadastrais, analise consolidada
Entrega: PDF via WhatsApp em ate 24h
Pagamento: PIX, cartao ou boleto pelo WhatsApp

== SCORE DE CREDITO ==
Faixas: 0-300 muito baixo | 301-500 baixo | 501-700 bom | 701-900 muito bom | 901-1000 excelente
Rating: AAA (minimo risco) | AA (muito baixo) | A (baixo) | B (moderado) | C (elevado)
O que piora: atrasos, dividas negativadas, protestos, cheques devolvidos, muitas consultas, alto comprometimento
O que melhora: pagar em dia, negociar dividas, usar <30% do limite, cadastro positivo, historico longo

== RESTRICOES ==
Tipos: SPC/Serasa, protesto em cartorio, CCF (cheque sem fundo), divida ativa governo, execucao fiscal
Prescricao: 5 anos (apos isso, negativacao DEVE ser removida)
Limpar nome: consultar restricoes → priorizar por impacto → negociar com credor (descontos 40-80%) → pagar → exigir baixa

== BANCO CENTRAL (SCR) ==
Registra TODAS operacoes de credito >R$200. Mostra emprestimos, financiamentos, cartoes, cheque especial, garantias. E o que bancos REALMENTE consultam.

== FINANCIAMENTOS ==
Imobiliario: 9-12%/ano, entrada 20%, ate 35 anos, max 30% renda, score >600
Veicular: 1.5-2.5%/mes, ate 60 meses, score >500
Pessoal: consignado 1.5-2.5%/mes (melhor CLT/INSS), pessoal 3-8%/mes
FGTS: antecipacao 1.5-2%/mes

== ORGANIZACAO FINANCEIRA ==
Regra 50/30/20: 50% necessidades, 30% desejos, 20% poupanca/dividas
Reserva emergencia: 3-6 meses de gastos

== OBJECOES ==
"Serasa mostra gratis" �� Serasa so mostra score deles. Nosso cruza Banco Central, SPC, cartorios, Receita Federal
"R$99 e caro" → Sem saber sua situacao, pode perder tempo com credito negado. E investimento.
"Vou pensar" → Se fizer agora, priorizo sua analise e recebe hoje

== GOLPES ==
"Limpa nome cobrando antecipado" = golpe | "Emprestimo sem consulta" = golpe | "Aumente score pagando" = nao existe

== ARGUMENTOS ==
- Mesmo relatorio que bancos consultam
- Cruza 5+ bases oficiais
- 73% dos brasileiros tem pendencia sem saber
- R$99 = menos de R$3,30/dia
`;

// In-memory conversation store
const conversations = {};

function callGemini(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: messages,
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
    });

    const url = new URL(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      GEMINI_MODEL + ":generateContent?key=" + GEMINI_KEY
    );

    const req = https.request(url, { method: "POST", headers: { "Content-Type": "application/json" } }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
          resolve(text);
        } catch(e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // Health
  if (req.url === "/health") {
    res.writeHead(200, {"Content-Type":"application/json"});
    res.end(JSON.stringify({ status: "ok", conversations: Object.keys(conversations).length }));
    return;
  }

  // Prediction
  if (req.method === "POST" && req.url === "/api/v1/prediction") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        const { question, sessionId = "default" } = JSON.parse(body);
        if (!question) {
          res.writeHead(400, {"Content-Type":"application/json"});
          res.end(JSON.stringify({ error: "question is required" }));
          return;
        }

        // Get or create conversation
        if (!conversations[sessionId]) {
          conversations[sessionId] = [
            { role: "user", parts: [{ text: "CONTEXTO DO SISTEMA:\n" + KNOWLEDGE_BASE + "\n\nAGORA VOCE ESTA PRONTO PARA ATENDER." }] },
            { role: "model", parts: [{ text: "Entendido! Sou o consultor financeiro da Checkup360. Estou pronto para ajudar com duvidas sobre credito, score, dividas e nossa consulta completa por R$99. Como posso ajudar?" }] }
          ];
        }

        // Add user message
        conversations[sessionId].push({ role: "user", parts: [{ text: question }] });

        // Call Gemini
        const answer = await callGemini(conversations[sessionId]);

        // Add assistant response
        conversations[sessionId].push({ role: "model", parts: [{ text: answer }] });

        // Keep max 20 messages (10 turns)
        if (conversations[sessionId].length > 22) {
          conversations[sessionId] = [
            conversations[sessionId][0], // system context
            conversations[sessionId][1], // initial response
            ...conversations[sessionId].slice(-18)
          ];
        }

        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ text: answer, sessionId }));

      } catch(e) {
        console.error("Error:", e.message);
        res.writeHead(500, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Default
  res.writeHead(200, {"Content-Type":"application/json"});
  res.end(JSON.stringify({
    service: "Checkup360 RAG Consultor Financeiro",
    endpoints: {
      health: "GET /health",
      predict: "POST /api/v1/prediction { question, sessionId }"
    }
  }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("RAG Service running on http://127.0.0.1:" + PORT);
});
