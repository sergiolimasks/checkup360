# Pesquisa: Plataformas de Chatbot e Automacao para Checkup360

> Pesquisa realizada em Abril/2026. Foco: stack WhatsApp + N8N + Gemini AI para SaaS brasileiro.

---

## Indice

1. [Evolution API v2](#1-evolution-api-v2)
2. [Chatwoot](#2-chatwoot)
3. [Typebot](#3-typebot)
4. [Botpress](#4-botpress)
5. [N8N (Deep Dive)](#5-n8n-deep-dive)
6. [Comparativo Geral](#6-comparativo-geral)
7. [Recomendacao para Checkup360](#7-recomendacao-para-checkup360)

---

## 1. Evolution API v2

### Visao Geral

Evolution API v2 e um gateway WhatsApp open-source (Apache 2.0) que expoe uma API REST completa para envio/recebimento de mensagens, gerenciamento de instancias multiplas, grupos, midia e integracoes nativas com Typebot, Chatwoot, Dify e OpenAI. Nasceu do projeto CodeChat que implementava a biblioteca Baileys.

**Repositorio:** github.com/EvolutionAPI/evolution-api
**Documentacao:** doc.evolution-api.com/v2
**Docker Hub:** atendai/evolution-api
**Licenca:** Apache 2.0 (gratuito, open-source)

### Tipos de Conexao

| Tipo | Descricao | Custo |
|------|-----------|-------|
| **Baileys (WhatsApp Web)** | API nao-oficial baseada no WhatsApp Web. QR Code para autenticacao. Gratuito, sem limites oficiais da Meta. | Gratis |
| **WhatsApp Cloud API** | API oficial da Meta. Requer Business Account, verificacao, compliance com politicas da Meta. | Meta cobra por conversa (primeiras 1.000/mes gratis) |

### Recursos Principais

- **Multi-instancia**: gerenciar multiplos numeros WhatsApp em um unico deploy
- **QR Code Auth**: autenticacao via QR code para conexoes Baileys
- **Envio de midia**: imagens, audio, video, documentos, stickers
- **Grupos**: criar, gerenciar membros, enviar mensagens
- **Webhooks**: eventos em tempo real (mensagens, conexao, QR code, etc.)
- **Integracoes nativas**: Typebot, Chatwoot, Dify, OpenAI, RabbitMQ, Kafka, Amazon SQS, Socket.io, S3/Minio
- **Evolution Manager v2**: dashboard web para gerenciamento

### Eventos de Webhook

```
QRCODE_UPDATED        - QR code atualizado (para leitura)
MESSAGES_UPSERT       - Nova mensagem recebida
MESSAGES_UPDATE       - Mensagem atualizada (status, lida, etc.)
MESSAGES_DELETE        - Mensagem deletada
SEND_MESSAGE          - Mensagem enviada com sucesso
CONNECTION_UPDATE      - Status da conexao alterado
TYPEBOT_START         - Fluxo Typebot iniciado
TYPEBOT_CHANGE_STATUS - Status do Typebot alterado
CONTACTS_UPDATE       - Contato atualizado
GROUPS_UPSERT         - Grupo criado/atualizado
```

### Docker Compose

```yaml
version: '3.9'
services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=sua-chave-secreta
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://user:pass@postgres:5432/evolution
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379/1
      - CACHE_REDIS_PREFIX_KEY=evolution
      - CACHE_REDIS_SAVE_INSTANCES=true
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      - DATABASE_SAVE_DATA_LABELS=true
      - DATABASE_SAVE_DATA_HISTORIC=true
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    restart: always
    environment:
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=evolution_pass
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    command: ["postgres", "-c", "max_connections=1000"]

  redis:
    image: redis:latest
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  evolution_instances:
  postgres_data:
  redis_data:
```

### Integracao com Chatwoot

Endpoint `/instance/create` aceita parametros Chatwoot:

```json
{
  "instanceName": "checkup360",
  "number": "5511999999999",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS",
  "chatwootAccountId": "1",
  "chatwootToken": "token-do-chatwoot",
  "chatwootUrl": "https://chatwoot.seudominio.com",
  "chatwootSignMsg": true,
  "chatwootReopenConversation": true,
  "chatwootConversationPending": true,
  "chatwootNameInbox": "WhatsApp Checkup360",
  "chatwootImportContacts": true,
  "chatwootImportMessages": true,
  "chatwootAutoCreate": true
}
```

### Integracao com N8N

- **Community Node**: `n8n-nodes-evolution-api` (disponivel via npm, apenas self-hosted)
- **Via HTTP Request**: qualquer endpoint da Evolution API pode ser chamado via HTTP Request node
- **Webhook**: configurar webhook da Evolution API apontando para webhook do N8N
- **Templates prontos**: assistente WhatsApp com GPT-4o, forwarder Chatwoot-WhatsApp

### Rate Limits e Riscos de Ban (Baileys)

- **Nao ha rate limit oficial** na Evolution API, mas o WhatsApp detecta comportamento robotico
- **Pacing recomendado**: 3-8 segundos entre mensagens
- **Verificacao de numeros em massa**: alto risco de ban
- **Restricao temporaria**: relatos de bloqueio apos 1-2 dias de uso intenso
- **Boas praticas**: nao enviar mais de 200-300 msgs/dia por numero novo, escalar gradualmente

### Problemas Comuns (2025)

- Desconexoes frequentes que exigem re-scan do QR code
- Consumo alto de recursos (RAM/CPU)
- Complexidade de setup e manutencao
- Instabilidade em VPS com rede instavel
- Redis disconnected em Docker Compose (networking)

### Pros e Contras

| Pros | Contras |
|------|---------|
| 100% gratuito e open-source | Baileys e API nao-oficial (risco de ban) |
| Multi-instancia | Desconexoes frequentes |
| Integracoes nativas (Typebot, Chatwoot) | Consumo elevado de recursos |
| Comunidade brasileira forte | Setup complexo para producao |
| Suporta Cloud API oficial tambem | Manutencao constante necessaria |
| API REST completa | Documentacao pode ficar desatualizada |

---

## 2. Chatwoot

### Visao Geral

Chatwoot e uma plataforma open-source de atendimento ao cliente com suporte omnichannel (WhatsApp, email, web widget, Facebook, Instagram, Telegram, Twitter, Line, SMS). Alternativa ao Intercom e Zendesk. Possui IA embarcada ("Captain") para auxiliar agentes.

**Repositorio:** github.com/chatwoot/chatwoot
**Site:** chatwoot.com
**Licenca:** MIT (Community Edition)
**Docker Hub:** chatwoot/chatwoot

### Recursos Principais

- **Omnichannel**: WhatsApp, email, web widget, Facebook, Instagram, Telegram, Twitter, Line, SMS
- **Captain AI**: assistente IA para agentes (respostas sugeridas, resumos)
- **Automation Rules**: regras automaticas para atribuicao, labels, snooze
- **Canned Responses**: respostas pre-definidas com short-codes
- **CSAT**: pesquisa de satisfacao pos-resolucao com review notes
- **SLA**: First Response Time, Next Response Time, Resolution Time com alertas
- **Custom Attributes**: dados adicionais em conversas e contatos
- **Pre-Chat Forms**: coleta de dados antes do chat
- **Teams & Agent Assignment**: times, atribuicao automatica round-robin
- **Reports**: conversas, agentes, inbox, labels, times, CSAT
- **API completa**: REST API v1 com autenticacao por userApiKey

### API Reference

Base path: `/api/v1/accounts/{account_id}/`

Endpoints principais:
- `GET/POST /conversations` - Listar/criar conversas
- `POST /conversations/{id}/messages` - Enviar mensagem
- `GET/POST /contacts` - Gerenciar contatos
- `GET/POST /inboxes` - Gerenciar caixas de entrada
- `GET/POST /automation_rules` - Regras de automacao
- `GET/POST /canned_responses` - Respostas prontas
- `GET/POST /custom_attribute_definitions` - Atributos customizados
- `GET /reports` - Relatorios
- `POST /webhooks` - Configurar webhooks

### Pricing

| Plano | Cloud | Self-Hosted |
|-------|-------|-------------|
| **Hacker (Free)** | Gratis (limitado) | Gratis (MIT) |
| **Startups** | $19/agente/mes | $19/agente/mes (premium) |
| **Business** | $39/agente/mes | $39/agente/mes (premium) |
| **Enterprise** | $99/agente/mes | $99/agente/mes (premium) |

- Community Edition self-hosted: 100% gratis, sem limites
- Captain AI credits: 300 (Startups), 500 (Business), 800 (Enterprise)
- Open source/nonprofits podem solicitar plano Startups gratis

### Docker Compose

```yaml
version: '3'
services:
  base: &base
    image: chatwoot/chatwoot:latest
    env_file: .env
    volumes:
      - storage_data:/app/storage

  rails:
    <<: *base
    depends_on:
      - postgres
      - redis
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - RAILS_ENV=production
      - INSTALLATION_ENV=docker
    entrypoint: docker/entrypoints/rails.sh
    command: ['bundle', 'exec', 'rails', 's', '-p', '3000', '-b', '0.0.0.0']
    restart: always

  sidekiq:
    <<: *base
    depends_on:
      - postgres
      - redis
    environment:
      - NODE_ENV=production
      - RAILS_ENV=production
      - INSTALLATION_ENV=docker
    command: ['bundle', 'exec', 'sidekiq', '-C', 'config/sidekiq.yml']
    restart: always

  postgres:
    image: pgvector/pgvector:pg16
    restart: always
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=chatwoot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=sua_senha_aqui

  redis:
    image: redis:alpine
    restart: always
    command: ["sh", "-c", "redis-server --requirepass \"$REDIS_PASSWORD\""]
    env_file: .env
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'

volumes:
  storage_data:
  postgres_data:
  redis_data:
```

**Variaveis .env essenciais:**
```bash
SECRET_KEY_BASE=chave_longa_gerada
FRONTEND_URL=https://chatwoot.seudominio.com
REDIS_PASSWORD=senha_redis
POSTGRES_HOST=postgres
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=sua_senha_aqui
POSTGRES_DATABASE=chatwoot
MAILER_SENDER_EMAIL=noreply@seudominio.com
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu@email.com
SMTP_PASSWORD=app_password
```

### Integracao WhatsApp (via Evolution API)

1. Criar instancia na Evolution API com parametros Chatwoot
2. Ler QR code para conectar WhatsApp
3. Evolution API cria inbox automaticamente no Chatwoot (`chatwootAutoCreate: true`)
4. Mensagens WhatsApp aparecem no painel Chatwoot
5. Respostas do agente sao enviadas via Evolution API para WhatsApp

Alternativamente, Chatwoot suporta WhatsApp Cloud API nativamente (sem Evolution API).

### Integracao com N8N

- Webhook do Chatwoot aponta para N8N para processamento customizado
- N8N pode chamar API do Chatwoot para criar conversas, enviar mensagens, atribuir agentes
- Template disponivel: "WhatsApp to Chatwoot message forwarder with media support"

### Pros e Contras

| Pros | Contras |
|------|---------|
| Open-source (MIT) community edition gratis | Setup complexo (Rails + Sidekiq + Postgres + Redis) |
| Omnichannel real (10+ canais) | Consumo de recursos significativo |
| Captain AI embutido | Curva de aprendizado para admins |
| CSAT, SLA, automacoes | Alguns recursos premium requerem licenca paga |
| API REST completa | Customizacao visual limitada |
| Comunidade ativa e bem documentado | Updates frequentes podem quebrar customizacoes |

---

## 3. Typebot

### Visao Geral

Typebot e um construtor visual de chatbots open-source (AGPL v3) que permite criar fluxos conversacionais com drag-and-drop, sem codigo. Suporta 45+ blocos de construcao, incluindo integracao com OpenAI, webhooks, Google Sheets, e deploy em WhatsApp via Evolution API.

**Repositorio:** github.com/baptisteArno/typebot.io
**Site:** typebot.com
**Documentacao:** docs.typebot.com
**Licenca:** AGPL v3

### Recursos Principais

- **Visual Builder**: drag-and-drop com 45+ blocos
- **Blocos de entrada**: texto, botoes, email, URL, telefone, data, pagamento, file upload
- **Blocos logicos**: condicoes, set variable, code JS, webhook, redirect, typebot link
- **Integracoes**: OpenAI/ChatGPT, Google Sheets, Google Analytics, Meta Pixel, Zapier, Make, Pabbly
- **Variaveis**: sistema de variaveis para personalizar fluxos
- **Logica condicional**: if/else baseado em variaveis e respostas
- **Embed**: widget de chat, popup, bubble, iframe, container
- **WhatsApp**: deploy de bots diretamente no WhatsApp (via Evolution API ou Cloud API)
- **Templates**: biblioteca de templates prontos
- **Resultados em tempo real**: coleta e visualizacao de respostas

### Pricing

| Plano | Preco | Chats/mes | Seats |
|-------|-------|-----------|-------|
| **Free** | $0 | 200 | 1 |
| **Starter** | $39/mes | 2.000 | 2 |
| **Pro** | $89/mes | 10.000 | 5 |
| **Enterprise** | Customizado | Customizado | Customizado |

- **Self-hosted**: gratis, ilimitado (AGPL v3)
- Free inclui: typebots ilimitados, integracoes nativas, webhooks, JS/CSS customizado

### Docker Compose

```yaml
version: '3.3'
services:
  typebot-builder:
    image: baptistearno/typebot-builder:latest
    restart: always
    ports:
      - '8080:3000'
    environment:
      - DATABASE_URL=postgresql://typebot:typebot@typebot-db:5432/typebot
      - NEXTAUTH_URL=https://typebot.seudominio.com
      - NEXT_PUBLIC_VIEWER_URL=https://bot.seudominio.com
      - ENCRYPTION_SECRET=chave-32-caracteres-gerada
      - NEXTAUTH_SECRET=outro-secret-32-chars
      - SMTP_HOST=mail
      - NEXT_PUBLIC_SMTP_FROM=notifications@seudominio.com
      - S3_ACCESS_KEY=minio
      - S3_SECRET_KEY=minio123
      - S3_BUCKET=typebot
      - S3_ENDPOINT=storage.seudominio.com
    depends_on:
      - typebot-db

  typebot-viewer:
    image: baptistearno/typebot-viewer:latest
    restart: always
    ports:
      - '8081:3000'
    environment:
      - DATABASE_URL=postgresql://typebot:typebot@typebot-db:5432/typebot
      - NEXTAUTH_URL=https://typebot.seudominio.com
      - NEXT_PUBLIC_VIEWER_URL=https://bot.seudominio.com
      - ENCRYPTION_SECRET=chave-32-caracteres-gerada
      - NEXTAUTH_SECRET=outro-secret-32-chars
    depends_on:
      - typebot-db

  typebot-db:
    image: postgres:16
    restart: always
    environment:
      - POSTGRES_DB=typebot
      - POSTGRES_PASSWORD=typebot
    volumes:
      - db-data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data
    ports:
      - '9000:9000'
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    volumes:
      - s3-data:/data

volumes:
  db-data:
  s3-data:
```

**DNS necessario:**
```
typebot   A  <ip_servidor>
bot       A  <ip_servidor>
storage   A  <ip_servidor>
```

### Integracao WhatsApp (via Evolution API)

1. Na Evolution API, configurar integracao Typebot na instancia
2. Definir URL do Typebot, typebot ID, trigger keyword
3. Mensagens WhatsApp disparam o fluxo Typebot automaticamente
4. Respostas do Typebot sao enviadas de volta via Evolution API

### Integracao com N8N

- Typebot pode chamar webhooks do N8N dentro dos fluxos
- N8N pode iniciar/controlar sessoes Typebot via API
- Combinacao comum: Typebot coleta dados -> webhook N8N -> processa -> retorna resultado

### Pros e Contras

| Pros | Contras |
|------|---------|
| Builder visual intuitivo | Menos poderoso que solucoes code-first |
| Self-hosted gratis ilimitado | Requer 3 subdomains (builder, viewer, storage) |
| 45+ blocos nativos | Customizacao avancada limitada |
| Integracao OpenAI nativa | Documentacao poderia ser mais completa |
| WhatsApp via Evolution API | Comunidade menor que Botpress |
| Embed facil em sites | Performance com muitos blocos |

---

## 4. Botpress

### Visao Geral

Botpress e uma plataforma de chatbot com foco em IA, NLU avancado, knowledge base (RAG), e multi-canal. Evoluiu de open-source (v12) para modelo cloud-first com Studio visual. Suporta GPT-4, Claude, LLMs customizados. Forte em enterprise.

**Site:** botpress.com
**Studio:** app.botpress.cloud
**Docker Hub:** botpress/server (apenas v12 open-source)

### Recursos Principais

- **Studio Visual**: drag-and-drop flow builder com IA
- **NLU Nativo**: intent detection, entity extraction, multilingual
- **Knowledge Base (RAG)**: conectar PDFs, websites, FAQs, dados estruturados
- **LLM Integration**: GPT-4, Claude, Gemini, LLMs customizados
- **Autonomous Nodes**: nos com tomada de decisao autonoma por IA
- **Multi-canal**: WhatsApp, web, Telegram, Messenger, Slack, Teams
- **Integracoes**: Zapier, Make, webhooks, APIs customizadas
- **Analytics**: metricas de conversa, funil, retencao

### Pricing (2026)

| Plano | Preco | AI Spend Limit |
|-------|-------|----------------|
| **Pay-as-you-go** | $0/mes | $5/mes incluso |
| **Plus** | $89/mes ($79 anual) | $100/mes |
| **Team** | $495/mes ($445 anual) | $500/mes |
| **Enterprise** | ~$2.000+/mes | Customizado |

- AI Spend: cobrado pelo custo real do provedor LLM (sem markup)
- Canais de terceiros podem ter custo adicional

### Docker (Self-Hosted)

**IMPORTANTE:** Apenas o Botpress v12 (legado) e self-hostable. O Botpress Cloud (atual) e SaaS closed-source.

```yaml
# Botpress v12 (legado) - NAO recomendado para novos projetos
version: '3'
services:
  botpress:
    image: botpress/server:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/botpress
      - EXTERNAL_URL=https://bot.seudominio.com
    volumes:
      - botpress_data:/botpress/data
    depends_on:
      - postgres

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=botpress
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  botpress_data:
  pg_data:
```

### Integracao WhatsApp

- Via canal WhatsApp no Botpress Cloud (requer WhatsApp Cloud API / Business Account)
- Nao suporta Baileys/Evolution API nativamente
- Webhook para receber mensagens, API para enviar

### Integracao com N8N

- Via webhooks: Botpress pode chamar N8N e vice-versa
- Nao tem community node dedicado no N8N
- HTTP Request node para chamar Botpress API

### Botpress vs Typebot

| Criterio | Botpress | Typebot |
|----------|----------|---------|
| **Modelo** | Cloud SaaS (v12 self-hosted legado) | Open-source self-hosted |
| **NLU** | Nativo avancado | Basico (depende de OpenAI) |
| **Knowledge Base** | RAG nativo | Nao nativo |
| **No-code** | Parcial (precisa code para avancado) | Totalmente no-code |
| **WhatsApp** | Cloud API apenas | Evolution API + Cloud API |
| **Preco** | $0-495+/mes | Gratis self-hosted |
| **Controle de dados** | Cloud da Botpress | Seus servidores |
| **Melhor para** | Enterprise, NLU complexo | PME, fluxos visuais simples |

### Pros e Contras

| Pros | Contras |
|------|---------|
| NLU e RAG nativos poderosos | Versao atual nao e self-hostable |
| Studio visual com IA | Pricing pode escalar rapido |
| Multi-LLM (GPT, Claude, etc.) | Vendor lock-in (cloud) |
| Enterprise-ready | Sem suporte Baileys/Evolution API |
| Analytics avancado | Complexidade para fluxos simples |
| Documentacao extensa | AI Spend pode surpreender |

---

## 5. N8N Deep Dive

### Visao Geral

N8N e uma plataforma de automacao de workflows open-source (Fair Code) com 400+ integracoes nativas, nodes de IA com LangChain, e capacidade de self-hosting. Alternativa ao Zapier/Make com controle total.

**Site:** n8n.io
**Docs:** docs.n8n.io
**Repositorio:** github.com/n8n-io/n8n
**Docker Hub:** n8nio/n8n
**Licenca:** Fair Code (Sustainable Use License)

### Pricing (2026)

| Plano | Preco | Execucoes/mes | Workflows | Users |
|-------|-------|---------------|-----------|-------|
| **Community (self-hosted)** | $0 | Ilimitado | Ilimitado | Ilimitado |
| **Starter (cloud)** | $24/mes | 2.500 | Ilimitado* | 1 |
| **Pro (cloud)** | $60/mes | 10.000 | Ilimitado* | 3 |
| **Business (cloud)** | $800/mes | 40.000 | Ilimitado* | Ilimitado |
| **Enterprise** | Custom | Ilimitado | Ilimitado | Ilimitado |

*Desde marco/2026, todos os planos tem workflows ativos ilimitados.

Self-hosted custa ~$3-5/mes em VPS. Community node da Evolution API so funciona em self-hosted.

### Docker Compose (Producao)

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.seudominio.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.seudominio.com/
      - NODE_ENV=production
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n_pass
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=none
      - EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true
      - N8N_ENCRYPTION_KEY=chave-unica-gerada
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    restart: always
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n_pass
      - POSTGRES_DB=n8n
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  pg_data:
```

**IMPORTANTE:**
- `WEBHOOK_URL` deve corresponder ao dominio publico (com trailing slash)
- SQLite NAO recomendado para producao
- Minimo recomendado: 2GB RAM, 1 vCPU
- Usar HTTPS em producao (via reverse proxy)

### Queue Mode (Scaling Horizontal)

Separa a instancia principal (webhook receiver, editor, scheduler) dos workers (executores de workflows).

**Arquitetura:**
```
[Webhook/Editor] --> [Redis Queue] --> [Worker 1]
                                   --> [Worker 2]
                                   --> [Worker N]
                 --> [PostgreSQL] <--
```

**Configuracao:**

```yaml
# docker-compose-queue.yml
version: '3.8'
services:
  n8n-main:
    image: n8nio/n8n:latest
    environment:
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      - QUEUE_HEALTH_CHECK_ACTIVE=true
      # ... demais variaveis de banco
    ports:
      - "5678:5678"

  n8n-worker:
    image: n8nio/n8n:latest
    command: worker
    environment:
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      - N8N_CONCURRENCY_PRODUCTION_LIMIT=10
      # ... mesmas variaveis de banco
    deploy:
      replicas: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:16
    # ... config padrao
```

**Parametros de concorrencia:**
- `N8N_CONCURRENCY_PRODUCTION_LIMIT`: execucoes simultaneas por worker (default: -1 = ilimitado)
- Multi-main: suportado para alta disponibilidade

### Nodes de IA (LangChain)

**Root Nodes (Agents):**
- AI Agent (6 tipos: Conversational, OpenAI Functions, Plan and Execute, ReAct, SQL, Tools)
- Basic LLM Chain
- Question and Answer Chain
- Summarization Chain
- Information Extractor
- Text Classifier
- Sentiment Analysis
- LangChain Code

**LLMs suportados:**
- OpenAI, Anthropic (Claude), Google Gemini, Google Vertex, AWS Bedrock
- Groq, Mistral, Ollama (local), DeepSeek, xAI Grok
- Azure OpenAI, Cohere, HuggingFace, OpenRouter, Vercel AI Gateway

**Memoria:**
- Simple Memory (buffer window)
- Postgres Chat Memory
- Redis Chat Memory
- MongoDB Chat Memory
- Motorhead, Xata, Zep

**Vector Stores:**
- PGVector, Pinecone, Qdrant, Weaviate, Chroma
- Supabase, Redis, Milvus, MongoDB Atlas
- Azure AI Search, In-Memory

**Tools para Agents:**
- Call n8n Workflow Tool (sub-workflows como tools!)
- Custom Code Tool, Calculator
- MCP Client Tool (Model Context Protocol)
- SearXNG, SerpApi, Wikipedia, Wolfram Alpha
- Vector Store QA Tool

**Embeddings:**
- OpenAI, Google (Gemini/PaLM/Vertex), AWS Bedrock
- Azure OpenAI, Cohere, HuggingFace, Mistral, Ollama

### Custom Nodes

```bash
# Scaffold um custom node
npx n8n-node-dev new

# Estrutura
n8n-nodes-meu-servico/
  ├── nodes/
  │   └── MeuServico/
  │       ├── MeuServico.node.ts    # Logica do node
  │       └── MeuServico.node.json  # Metadata
  ├── credentials/
  │   └── MeuServicoApi.credentials.ts
  ├── package.json
  └── tsconfig.json
```

- TypeScript obrigatorio (padrao 2026)
- Publicar no npm como `n8n-nodes-<nome>`
- Instalar via Settings > Community Nodes (apenas self-hosted)

### Credential Management

- Secrets criptografados no banco (via `N8N_ENCRYPTION_KEY`)
- Nunca expostos no frontend
- Suporte a OAuth 1.0, OAuth 2.0, API Key, Basic Auth, Header Auth, JWT
- Credentials sao referenciadas por ID, nao por valor

### Error Workflows

```
Workflow Principal
  ├── Node A --> [sucesso] --> Node B
  │              [erro] --> Error Branch (continueOnFail)
  └── Error Workflow (global)
       ├── Notificar Slack
       ├── Logar no banco
       └── Retry condicional
```

- **Node-level**: `continueOnFail` ou `continueErrorOutput` por node
- **Workflow-level**: Error Workflow dedicado (configurado nas settings do workflow)
- **Retry**: configuravel por node (quantas vezes, intervalo)
- **Error Workflow global**: captura falhas de qualquer workflow

### Sub-Workflows

- **Execute Workflow node**: chama outro workflow como funcao
- Passa dados de entrada e recebe dados de saida
- Ideal para modularizar logica reutilizavel
- Pode ser usado como Tool em AI Agents (`Call n8n Workflow Tool`)

### Webhook Authentication

- **Basic Auth**: usuario/senha configurados no Webhook node
- **Header Auth**: header customizado com token
- **JWT**: validacao de token JWT
- **IP Allowlist**: via reverse proxy (Traefik/Nginx)
- **Webhook-test vs Webhook**: URLs diferentes (test so funciona com editor aberto)

### Pros e Contras

| Pros | Contras |
|------|---------|
| Self-hosted gratis ilimitado | Fair Code (nao e 100% open-source) |
| 400+ integracoes nativas | Cloud pode ficar caro em escala |
| IA/LangChain nativo | Interface pode ser lenta com muitos nodes |
| Queue mode para escala | Debugging de workflows complexos |
| Community nodes (Evolution API) | Webhook URLs mudam entre test/prod |
| Error workflows robustos | Documentacao fragmentada |
| Sub-workflows modulares | Atualizacoes podem quebrar workflows |

---

## 6. Comparativo Geral

### Tabela Comparativa

| Criterio | Evolution API | Chatwoot | Typebot | Botpress | N8N |
|----------|--------------|----------|---------|----------|-----|
| **Tipo** | Gateway WhatsApp | Atendimento | Chatbot Builder | Chatbot IA | Automacao |
| **Licenca** | Apache 2.0 | MIT | AGPL v3 | SaaS (v12 Apache) | Fair Code |
| **Self-hosted** | Sim | Sim | Sim | Apenas v12 | Sim |
| **Gratis** | 100% | Community gratis | Self-hosted gratis | Pay-as-you-go $0 | Community gratis |
| **WhatsApp** | Core feature | Via Evolution/Cloud API | Via Evolution API | Cloud API apenas | Via Evolution API |
| **IA nativa** | OpenAI integration | Captain AI | OpenAI blocks | NLU + RAG + LLMs | LangChain completo |
| **N8N integration** | Community node + webhook | Webhook + API | Webhook | Webhook | -- |
| **Docker** | Sim (leve) | Sim (pesado) | Sim (medio) | Apenas v12 | Sim (leve) |
| **Comunidade BR** | Muito forte | Moderada | Forte | Fraca | Forte |
| **Complexidade** | Media | Alta | Baixa | Media | Media-Alta |

### Stack Recomendada para WhatsApp SaaS BR

```
[WhatsApp] <--> [Evolution API] <--> [N8N (orquestrador)]
                      |                    |
                      v                    v
                 [Chatwoot]          [Gemini AI]
                 (atendimento)       (processamento)
                      |                    |
                      v                    v
                 [Typebot]           [PostgreSQL]
                 (fluxos visuais)    (dados)
```

---

## 7. Recomendacao para Checkup360

### Stack Atual (Manter)

- **Evolution API v2**: gateway WhatsApp (Baileys) -- ja em uso
- **N8N**: orquestrador de workflows -- ja em uso
- **Gemini AI**: processamento de linguagem -- ja em uso

### Adicoes Recomendadas

| Ferramenta | Quando Usar | Prioridade |
|------------|------------|------------|
| **Chatwoot** | Quando precisar de atendimento humano (escala), historico de conversas centralizado, CSAT, SLA | Media (futuro proximo) |
| **Typebot** | Quando quiser fluxos visuais de onboarding, coleta de dados pre-venda, FAQs interativas | Baixa (ja tem N8N + Gemini) |
| **Botpress** | NAO recomendado. Lock-in de vendor, sem self-host atual, sem Baileys, pricing complexo | Descartado |

### Justificativa

1. **Chatwoot** complementa o Checkup360 para quando houver escala de atendimento humano. A integracao nativa com Evolution API facilita. Porem, para o volume atual (operacao enxuta), o N8N + Gemini ja resolve.

2. **Typebot** seria util para criar fluxos visuais de captacao (landing page -> WhatsApp), mas o fluxo atual via N8N + buildStagePrompt() ja atende. Considerar apenas se precisar de fluxos visuais editaveis por nao-devs.

3. **N8N** ja e o coracao da automacao. Investir em:
   - Queue mode quando volume crescer
   - AI Agent nodes com Gemini (via HTTP Request, ja que nao tem node nativo Gemini)
   - Error workflows para monitoramento
   - Sub-workflows para modularizar stages do funil

4. **Botpress** nao agrega ao Checkup360: vendor lock-in, sem suporte Baileys, pricing imprevisivel, e as capacidades de NLU/RAG podem ser replicadas com N8N + Gemini + vector store.

---

## Fontes

### Evolution API
- [GitHub - EvolutionAPI/evolution-api](https://github.com/EvolutionAPI/evolution-api)
- [Documentation](https://doc.evolution-api.com/v2/en/get-started/introduction)
- [Docker Install Guide](https://doc.evolution-api.com/v2/en/install/docker)
- [Chatwoot Integration](https://doc.evolution-api.com/v2/en/integrations/chatwoot)
- [Webhooks Configuration](https://doc.evolution-api.com/v2/en/configuration/webhooks)
- [Evolution API Problems 2025](https://wasenderapi.com/blog/evolution-api-problems-2025-issues-errors-best-alternative-wasenderapi)

### Chatwoot
- [Chatwoot Official](https://www.chatwoot.com/)
- [GitHub - chatwoot/chatwoot](https://github.com/chatwoot/chatwoot)
- [Developer Docs](https://developers.chatwoot.com/introduction)
- [Pricing](https://www.chatwoot.com/pricing/)
- [Self-Hosted Pricing](https://www.chatwoot.com/pricing/self-hosted-plans/)
- [Chatwoot 2025 Overview](https://www.eesel.ai/blog/chatwoot)
- [Automation Rules API](https://developers.chatwoot.com/api-reference/automation-rule/add-a-new-automation-rule)

### Typebot
- [GitHub - baptisteArno/typebot.io](https://github.com/baptisteArno/typebot.io)
- [Typebot Docs](https://docs.typebot.com/get-started/introduction)
- [Docker Deployment](https://docs.typebot.com/self-hosting/deploy/docker)
- [Pricing](https://typebot.com/pricing)
- [WhatsApp Chatbot Guide](https://www.typebot.com/blog/create-whatsapp-chatbot)

### Botpress
- [Botpress Pricing](https://botpress.com/pricing)
- [Botpress Review 2026](https://www.voiceflow.com/blog/botpress)
- [Botpress Pricing Analysis](https://www.lindy.ai/blog/botpress-pricing)
- [Botpress AI Review 2026](https://www.gptbots.ai/blog/botpress-alternatives)
- [Botpress Docker](https://hub.docker.com/r/botpress/server)

### N8N
- [N8N Pricing](https://n8n.io/pricing/)
- [Queue Mode Docs](https://docs.n8n.io/hosting/scaling/queue-mode/)
- [Scaling Overview](https://docs.n8n.io/hosting/scaling/overview/)
- [LangChain in N8N](https://docs.n8n.io/advanced-ai/langchain/overview/)
- [Advanced AI Docs](https://docs.n8n.io/advanced-ai/)
- [Docker Compose Setup](https://docs.n8n.io/hosting/installation/server-setups/docker-compose/)
- [N8N Pricing 2026 Guide](https://instapods.com/blog/n8n-pricing/)
- [N8N Custom Node Dev](https://thinkpeak.ai/n8n-custom-node-development-guide/)
- [Evolution API N8N Node](https://www.npmjs.com/package/n8n-nodes-evolution-api)
- [WhatsApp Assistant Template](https://n8n.io/workflows/11754-build-a-whatsapp-assistant-for-text-audio-and-images-using-gpt-4o-and-evolution-api/)
