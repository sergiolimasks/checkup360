# Checkup360 — API Backend

API principal do Checkup360, plataforma de consulta de credito via WhatsApp.

## O que faz

O lead chega pela landing page, entra no funil via WhatsApp com IA (Gemini), paga R$99 via Mercado Pago, recebe um relatorio PDF de Rating Bancario, e a IA explica o resultado com sugestoes de melhoria e upsell.

Esta API gerencia todo o pipeline:

- **CRM automatico** — 9 stages (novo → entregue/perdido), transicoes por IA
- **Chat IA** — Gemini 2.5 Flash Lite, respostas contextuais por stage
- **Pagamento** — Mercado Pago Checkout Pro com webhooks IPN
- **WhatsApp** — Meta Cloud API (envio/recebimento de mensagens, templates, midia)
- **Follow-ups** — Nudges (janela aberta) e templates (janela fechada), scheduler independente
- **Tracking** — Meta CAPI + GA4 em todos os stages do funil
- **Admin Panel** — Dashboard, CRM, analytics, gestao de leads/usuarios

## Stack

| Componente | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Banco de dados | PostgreSQL |
| IA | Google Gemini 2.5 Flash Lite |
| Pagamento | Mercado Pago |
| Mensageria | Meta WhatsApp Cloud API |
| Seguranca | Helmet, JWT, bcrypt, rate limiting |
| Tracking | Meta Conversions API, GA4 Measurement Protocol |

## Estrutura

```
dist/dist/
  index.js              # Entry point — Express, middlewares, rotas
  db.js                 # Pool PostgreSQL, query com logging
  middleware/
    auth.js             # JWT auth + role-based access (admin/gestor/operador)
  routes/
    webhooks.js         # Webhook WhatsApp + Mercado Pago (maior arquivo, ~1300 linhas)
    leads.js            # CRUD leads, filtros, tracking, envio boas-vindas
    conversations.js    # Historico de chat, envio de mensagens
    payments.js         # Listagem pagamentos, criacao checkout MP
    auth.js             # Login, setup inicial, /me
    dashboard.js        # Stats, funil, receita, uso IA
    analytics.js        # Pipeline analytics, velocity, WA metrics, UTM
    automation.js       # Follow-up queries, nudge/template send, analise IA
    flows.js            # WhatsApp Flows (criptografia RSA+AES)
    meta.js             # CRUD templates WhatsApp
    users.js            # Gestao usuarios admin (RBAC)
  services/
    gemini.js           # Integracao Gemini — chat IA contextual
  tracking/
    index.js            # Agregador de eventos (Meta + GA4)
    meta-capi.js        # Meta Conversions API (server-side)
    ga4-mp.js           # Google Analytics 4 Measurement Protocol
followup-scheduler.js   # Scheduler PM2 — nudges + follow-ups automaticos
```

## Pipeline (Stages)

```
novo → boas_vindas → engajado → qualificado → pagamento_pendente → pago → processando → entregue
                                                                                          ↓
                                                                                       perdido
```

Cada transicao e decidida pela IA (Gemini) com base no conteudo da conversa e tags de intent.

## Variaveis de ambiente

```env
# Servidor
PORT=3001

# Banco
DATABASE_URL=postgresql://...
DATABASE_SCHEMA=consulta_credito

# Auth
JWT_SECRET=...
SETUP_MASTER_KEY=...

# Meta/WhatsApp
META_WHATSAPP_TOKEN=...
META_PHONE_NUMBER_ID=...
META_BUSINESS_ACCOUNT_ID=...
META_WEBHOOK_VERIFY_TOKEN=...
META_APP_SECRET=...

# IA
LLM_PROVIDER=gemini
GEMINI_API_KEY=...

# Pagamento
MERCADO_PAGO_ACCESS_TOKEN=...
MERCADO_PAGO_PUBLIC_KEY=...

# Tracking
META_PIXEL_ID=...
META_CAPI_TOKEN=...
GA4_MEASUREMENT_ID=...
GA4_API_SECRET=...

# Automacao
AUTOMATION_API_KEY=...
WEBHOOK_BASE_URL=...
```

## Deploy

Roda como servico PM2 no servidor de producao:

```bash
pm2 start dist/dist/index.js --name consulta-credito-api
pm2 start followup-scheduler.js --name followup-scheduler
```

## Endpoints principais

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login admin |
| GET | `/api/leads` | Listar leads (filtros, paginacao) |
| POST | `/api/leads` | Criar lead |
| GET | `/api/conversations/:leadId` | Historico de chat |
| GET/POST | `/api/webhooks/whatsapp` | Webhook WhatsApp |
| POST | `/api/webhooks/mercadopago` | Webhook Mercado Pago |
| GET | `/api/dashboard/stats` | Metricas dashboard |
| GET | `/api/analytics/overview` | Analytics do funil |
| GET | `/api/payments` | Listar pagamentos |
| POST | `/api/payments/create-preference` | Criar checkout MP |
| GET | `/api/meta/templates` | Listar templates WA |
| GET | `/api/users` | Listar usuarios admin |
| GET | `/api/automation/leads/follow-up` | Leads para follow-up |
