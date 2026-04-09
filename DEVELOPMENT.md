# CC360 - Ambiente de Desenvolvimento Local

## Arquitetura: Como VPS e Hostinger se conectam

```
┌─────────────────────────────────────┐
│         HOSTINGER                   │
│   checkup360.online                 │
│                                     │
│   Frontend estático (HTML/JS/CSS)   │
│   ├── / .............. Landing page │
│   ├── /cartao ........ LP Cartão    │
│   ├── /casa-carro .... LP Imóvel    │
│   ├── /financiamento . LP Financ.   │
│   └── /admin/ ........ SPA Admin    │
│       └── api.js → chama API VPS    │
└──────────────┬──────────────────────┘
               │ HTTPS (fetch)
               ▼
┌─────────────────────────────────────┐
│         VPS (72.60.51.200)          │
│   api.checkup360.online             │
│                                     │
│   PM2 Services:                     │
│   ├── consulta-api (:3001)          │
│   │   ├── Express + TypeScript      │
│   │   ├── Webhooks WA + MP          │
│   │   ├── Gemini AI (LLM)          │
│   │   ├── Meta WA Cloud API        │
│   │   └── CRUD leads/payments/etc   │
│   │                                 │
│   ├── rpa-ksi (:3050)               │
│   │   ├── Puppeteer → KSI site     │
│   │   ├── Gera PDF relatório        │
│   │   └── Envia PDF via WhatsApp    │
│   │                                 │
│   ├── followup-scheduler (cron)     │
│   │   ├── Nudges (janela aberta)    │
│   │   └── Follow-ups (templates)    │
│   │                                 │
│   └── rag-consultor (:3200)         │
│       └── Gemini + knowledge base   │
│                                     │
│   Docker Containers:                │
│   ├── PostgreSQL 16 (:5432)         │
│   ├── Redis 7 (:6379)              │
│   ├── Traefik (reverse proxy)       │
│   ├── Evolution API (WA gateway)    │
│   ├── N8N (automação)              │
│   ├── Chatwoot (inbox)             │
│   ├── Flowise (chatbot builder)     │
│   └── + outros                      │
└─────────────────────────────────────┘
```

## Fluxo de Dados

```
Lead cadastra na LP → POST /api/webhooks/lead
                    → DB insere lead (stage: novo)
                    → Envia template WA boas_vindas
                    → Lead responde WA
                    → Webhook Meta → POST /api/webhooks/whatsapp
                    → Gemini AI processa mensagem
                    → AI qualifica → stage: qualificado
                    → AI detecta intenção de pagar → stage: negociando
                    → Cria checkout Mercado Pago
                    → Lead paga → Webhook MP → stage: pago
                    → Lead envia CPF → RPA job criado → stage: processando
                    → RPA consulta KSI → gera PDF → envia WA → stage: entregue
                    → AI faz 10 perguntas sobre relatório
                    → AI oferece upsell → stage: upsell
```

## Estrutura Local

```
CC360/
├── backend/                 # consulta-credito-api (TypeScript)
│   ├── index.ts             # Entry point Express
│   ├── db.ts                # Pool PostgreSQL
│   ├── middleware/auth.ts   # JWT auth
│   ├── routes/
│   │   ├── auth.ts          # Login/registro admin
│   │   ├── leads.ts         # CRUD leads
│   │   ├── conversations.ts # Mensagens WA
│   │   ├── payments.ts      # Mercado Pago
│   │   ├── webhooks.ts      # WA + MP webhooks
│   │   ├── dashboard.ts     # Stats/charts
│   │   ├── users.ts         # CRUD admin users
│   │   ├── templates.ts     # WA templates
│   │   └── automation.ts    # Automação pipeline
│   ├── followup-scheduler.js # Scheduler nudges/follow-ups
│   ├── .env.local           # Env template local
│   └── package.json
│
├── rpa-service/             # RPA Puppeteer (KSI)
│   ├── index.js             # Worker principal
│   ├── .env.local
│   └── package.json
│
├── rag-service/             # RAG Consultor Financeiro
│   └── server.js            # HTTP + Gemini
│
├── frontend/                # Hostinger mirror
│   ├── index.html           # Landing page principal
│   ├── landing-*.html       # Variantes de LP
│   ├── admin/               # SPA admin (JS puro)
│   │   ├── index.html
│   │   ├── api.js           # API client (auto-detecta local/prod)
│   │   ├── app.js           # Router SPA
│   │   ├── dashboard.js     # Dashboard
│   │   ├── crm.js           # CRM Kanban
│   │   ├── leads.js         # Lista leads
│   │   ├── lead-detail.js   # Detalhe + chat
│   │   ├── templates.js     # WA templates
│   │   ├── users.js         # Admin users
│   │   ├── performance.js   # Analytics
│   │   └── styles.css
│   ├── cartao/index.html
│   ├── casa-carro/index.html
│   └── financiamento/index.html
│
├── database/
│   ├── schema.sql           # Dump original produção
│   └── init.sql             # Schema limpo + seed (usado pelo Docker)
│
├── docker-compose.yml       # PostgreSQL 16 + Redis 7 (alternativa Docker)
├── start-local.sh           # Script startup
└── DEVELOPMENT.md           # Este arquivo
```

## Quick Start (Homebrew — recomendado)

PostgreSQL 16 e Redis 7 rodam nativos via Homebrew (já instalados e configurados).

```bash
# 1. Garantir que PG e Redis estão rodando
brew services start postgresql@16
brew services start redis

# 2. Criar schema (só na primeira vez)
psql -U postgres -d postgres -f database/init.sql

# 3. Instalar deps + copiar .env
cd backend && cp .env.local .env && npm install
cd ../rpa-service && cp .env.local .env && npm install
cd ..

# 4. Rodar API em modo dev (hot reload)
cd backend && npx tsx watch index.ts

# 5. Em outro terminal — frontend
cd frontend && npx http-server -p 8080 -c-1 --cors

# 6. Acessar
# Landing: http://localhost:8080
# Admin:   http://localhost:8080/admin/
# API:     http://localhost:3001/api/health
```

### Alternativa: Docker Compose

Se preferir containers isolados (requer Docker Desktop):
```bash
docker compose up -d   # PG na porta 5433, Redis na 6380
# Ajustar .env com as portas Docker
```

## Portas Locais

| Serviço | Porta Local | Porta Produção |
|---------|-------------|----------------|
| PostgreSQL | 5432 (Homebrew) / 5433 (Docker) | 5432 |
| Redis | 6379 (Homebrew) / 6380 (Docker) | 6379 |
| API (consulta-api) | 3001 | 3001 |
| RPA (rpa-ksi) | 3050 | 3050 |
| RAG (rag-consultor) | 3200 | 3200 |
| Frontend | 8080 | 443 (Hostinger) |

## Login Admin Local

- Email: `admin@local.dev`
- Senha: `admin123`

## Comandos Úteis

```bash
# Ver status
./start-local.sh status

# Resetar banco (drop + recreate)
./start-local.sh reset-db

# Parar tudo
./start-local.sh down

# Conectar no banco local
psql postgresql://postgres:cc360local@127.0.0.1:5433/postgres
# Depois: SET search_path TO consulta_credito;
```

## Diferenças Local vs Produção

| Aspecto | Local | Produção |
|---------|-------|----------|
| WhatsApp | Não envia (tokens mock) | Meta Cloud API real |
| Pagamento | Não funciona (tokens mock) | Mercado Pago real |
| Gemini AI | Funciona se colocar API key real | Funciona |
| RPA/KSI | Não funciona sem credenciais KSI | Puppeteer real |
| Frontend | http-server | Hostinger CDN |
| Traefik | N/A | Reverse proxy |
| SSL | N/A | Let's Encrypt |

## Deploy para Produção

**NUNCA alterar produção direto. Sempre testar local primeiro.**

### Backend (VPS)
```bash
cd CC360/backend
tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf /tmp/cc360-api.tar.gz .
sshpass -p 'PASSWORD' scp /tmp/cc360-api.tar.gz root@72.60.51.200:/tmp/
sshpass -p 'PASSWORD' ssh root@72.60.51.200 "cd /opt/consulta-credito-api && tar -xzf /tmp/cc360-api.tar.gz && npm install && npx tsc && pm2 restart consulta-api"
```

### Frontend (Hostinger)
```bash
sshpass -p 'PASSWORD' scp -P 65002 frontend/admin/ARQUIVO.js u435641156@147.93.37.21:/home/u435641156/domains/checkup360.online/public_html/admin/ARQUIVO.js
# Limpar OPcache (se PHP)
sshpass -p 'PASSWORD' ssh -p 65002 u435641156@147.93.37.21 "killall lsphp"
```
