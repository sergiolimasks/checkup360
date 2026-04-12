# Checkup360 — RPA Service

Servico de automacao (RPA) que consulta credito no painel KSI, gera PDF do relatorio e entrega via WhatsApp.

## O que faz

1. Recebe job via API (CPF + telefone + lead_id)
2. Abre browser headless (Puppeteer/Chromium)
3. Faz login no painel KSI (ksiconsultas.com.br)
4. Submete CPF e aguarda resultado
5. Gera PDF do relatorio de Rating Bancario
6. Envia PDF via WhatsApp (Meta Cloud API)
7. Dispara analise IA (Gemini) do relatorio
8. Atualiza pipeline do lead (stage → entregue)

## Stack

| Componente | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Browser | Puppeteer + Chromium headless |
| Banco de dados | PostgreSQL (fila de jobs) |
| Mensageria | Meta WhatsApp Cloud API |
| IA | Gemini (via API principal, localhost:3001) |

## Arquitetura

```
[API Backend] --POST /api/rpa/consulta--> [RPA Service]
                                              |
                                         [Job Queue (PostgreSQL)]
                                              |
                                         [Puppeteer → KSI]
                                              |
                                         [PDF gerado]
                                              |
                                    [Upload Meta API → WhatsApp]
                                              |
                                    [Analise IA + Pipeline update]
```

## Fila de Jobs

- **Storage:** tabela `rpa_jobs` no PostgreSQL
- **Polling:** a cada 30 segundos
- **Retry:** ate 3 tentativas com backoff exponencial (2min, 5min, 10min)
- **Timeout:** 5 minutos por job
- **Recovery:** jobs travados >10min sao recuperados automaticamente
- **Dedup:** verifica historico KSI antes de gastar consulta

## Endpoints

| Metodo | Rota | Descricao |
|---|---|---|
| POST | `/api/rpa/consulta` | Enfileirar nova consulta (CPF + phone + lead_id) |
| GET | `/api/rpa/jobs` | Listar ultimos 20 jobs (CPF mascarado - LGPD) |
| POST | `/api/rpa/jobs/:id/retry` | Reprocessar job com falha |
| GET | `/api/rpa/health` | Health check com stats da fila |

Todos os endpoints (exceto health) requerem header `x-automation-key`.

## Estrutura

```
rpa-service/
  index.js        # Arquivo unico com toda a logica (~716 linhas)
  package.json    # Dependencias
  .env            # Credenciais (KSI, Meta, PostgreSQL)
```

### Funcoes principais (index.js)

| Funcao | Descricao |
|---|---|
| `isValidCPF()` | Validacao de CPF com digitos verificadores |
| `isValidBRPhone()` | Validacao telefone BR (+55) |
| `getLoggedInPage()` | Sessao persistente do browser (reusa login) |
| `checkHistoryForCPF()` | Busca consulta anterior no KSI (economia de creditos) |
| `runKSIConsultation()` | Pipeline completo: formulario → PDF → analise IA |
| `uploadMedia()` | Upload do PDF para Meta Cloud API |
| `sendDocument()` | Envio do PDF via WhatsApp |
| `processJob()` | Orquestrador: consulta → upload → envio → pipeline update |
| `pollJobs()` | Polling da fila com lock atomico |
| `recoverStuckJobs()` | Recuperacao de jobs travados |

## Variaveis de ambiente

```env
RPA_PORT=3050
AUTOMATION_API_KEY=...

# KSI (plataforma de consultas)
KSI_EMAIL=...
KSI_PASSWORD=...

# Meta/WhatsApp
META_WHATSAPP_TOKEN=...
META_PHONE_NUMBER_ID=...

# Banco
DATABASE_URL=postgresql://...
```

## Deploy

Roda como servico PM2:

```bash
pm2 start index.js --name rpa-service
```

**Requisitos:**
- Chromium instalado no servidor
- Acesso a porta 3001 (API principal) para analise IA e pipeline updates
- Pasta `/tmp/ksi-downloads/` para PDFs temporarios
