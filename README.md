# Checkup360 — Consulta Credito 360

Funil de vendas automatizado para consulta de credito/CPF via WhatsApp. Lead se cadastra na landing page, IA qualifica via WhatsApp, cobra R$99, RPA gera relatorio PDF do KSI, entrega via WhatsApp, e oferece upsell.

## Arquitetura

```
HOSTINGER (checkup360.online)              VPS (api.checkup360.online)
├── Landing Pages (5 LPs)                  ├── Express.js API :3001 (PM2)
│   └── Form → POST /api/leads             │   ├── /api/leads
├── Admin SPA (/admin/)                    │   ├── /api/webhooks (WA + MP)
│   └── api.js → fetch JWT Bearer          │   ├── /api/conversations
│       auto-detect localhost/prod         │   ├── /api/payments
└── Static HTML/JS/CSS                     │   ├── /api/meta (templates)
                                           │   ├── /api/analytics (pages, funnel, etc)
                                           │   ├── /api/automation (RPA/N8N)
                                           │   └── /api/auth (JWT login)
                                           │
                                           ├── PM2: followup-scheduler
                                           ├── PM2: rpa-ksi :3050 (Puppeteer)
                                           ├── PM2: rag-consultor :3200
                                           │
                                           ├── Docker: PostgreSQL 16, Redis
                                           ├── Docker: Traefik, Flowise, N8N
                                           ├── Docker: Evolution, Chatwoot
                                           └── Docker: Portainer, Uptime Kuma, MinIO
                                                      │
                                           APIs externas:
                                           ├── Meta WhatsApp Cloud API v21.0
                                           ├── Flowise + Gemini 2.5 Flash
                                           ├── Mercado Pago
                                           └── Google Gemini (transcricao audio)
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (sem framework) |
| Admin Panel | SPA puro JS + Chart.js |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 (schema consulta_credito) |
| Cache | Redis 7 |
| IA | Flowise + Gemini 2.5 Flash |
| RPA | Puppeteer + Chromium (KSI) |
| Pagamentos | Mercado Pago |
| Mensageria | Meta WhatsApp Cloud API |
| Tracking | Meta Pixel + GA4 + CAPI server-side |
| Deploy | PM2 + Docker Swarm + Traefik |

## Estrutura

```
CC360/
├── backend/                # Express API (TypeScript)
│   ├── index.ts            # Entry point (11 route modules)
│   ├── db.ts               # PostgreSQL pool
│   ├── flowise.ts          # Flowise AI integration
│   ├── followup-scheduler.js # Nudges + follow-ups automaticos
│   ├── middleware/auth.ts   # JWT + RBAC
│   └── routes/
│       ├── analytics.ts     # Overview, funnel, chart, sources, pages, velocity, WA metrics
│       ├── auth.ts          # Login, /me
│       ├── automation.ts    # N8N, RPA endpoints
│       ├── conversations.ts # Chat history
│       ├── dashboard.ts     # Stats (fallback)
│       ├── leads.ts         # CRUD + DELETE cascade
│       ├── meta.ts          # Templates WA CRUD
│       ├── payments.ts      # Checkout MP
│       ├── users.ts         # Admin user management
│       └── webhooks.ts      # WA inbound + MP IPN + audio transcricao
│
├── frontend/               # Static (Hostinger)
│   ├── index.html          # LP principal (form no hero + modal R$99)
│   ├── landing-*.html      # LPs variantes
│   ├── admin/              # Admin SPA
│   │   ├── api.js          # API client (auto-detect env)
│   │   ├── app.js          # SPA router + RBAC
│   │   ├── dashboard.js    # KPIs + charts
│   │   ├── crm.js          # Kanban 9 colunas
│   │   ├── performance.js  # Landing Pages + Fontes + A/B Tests
│   │   └── ...
│   ├── consultasob/        # Video LP (ConverteAI)
│   └── consultacob/        # Video LP alternativa
│
├── rpa-service/            # Puppeteer KSI automation
├── rag-service/            # Gemini RAG advisor
├── database/               # Schema SQL + init
├── deploy/                 # Setup scripts (fail2ban, portainer, etc)
├── docker-compose.yml      # PG + Redis local
└── start-local.sh          # Dev startup script
```

## Pipeline CRM (automatico via IA)

```
novo → tentativa_contato → qualificado → negociando → pago → processando → entregue → upsell
                                                                                         ↓
                                                                          follow_up ← perdido
```

Tags Flowise: QUALIFIED, READY_TO_PAY, COLLECTING_DATA, DATA_RECEIVED, READY_FOR_UPSELL, OPT_OUT

## Features

- **IA WhatsApp**: Flowise + Gemini qualifica leads, responde perguntas, oferece upsell
- **Audio WhatsApp**: Transcricao automatica via Gemini 2.5 Flash → IA responde normalmente
- **Follow-up automatico**: Nudges (janela aberta) + Templates (janela fechada)
- **RPA KSI**: Consulta automatica, gera PDF, entrega via WhatsApp
- **Admin Dashboard**: KPIs, funil, receita, fontes, velocidade pipeline, metricas WA
- **Landing Pages**: Form no hero, modal confirmacao R$99, tracking Meta+GA4
- **Performance**: Stats por landing page (URL, leads, vendas, conversao)
- **CRM**: Kanban 9 colunas, detalhes lead com chat tempo real
- **Pagamentos**: Mercado Pago (PIX, cartao, boleto)

## Setup Local

```bash
# Servicos
brew services start postgresql@16
brew services start redis

# Backend
cd backend && cp .env.example .env  # preencher credenciais
npx tsx watch index.ts              # porta 3001

# Frontend
cd frontend && npx http-server -p 8080 -c-1 --cors

# Admin: http://localhost:8080/admin/
# API:   http://localhost:3001/api/health
```

## Deploy

**Frontend (Hostinger):**
```bash
scp -P 65002 ARQUIVO user@HOSTINGER_IP:/path/to/checkup360.online/public_html/ARQUIVO
```

**Backend (VPS):**
```bash
npx tsc --outDir /tmp/cc360-dist
scp /tmp/cc360-dist/routes/ARQUIVO.js root@VPS_IP:/opt/consulta-credito-api/dist/routes/
ssh root@VPS_IP "pm2 restart consulta-api"
```

## Variaveis de Ambiente

Ver `backend/.env.example` para template completo.

## Licenca

Projeto privado. Todos os direitos reservados.
