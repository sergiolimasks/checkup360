# Checkup360 — Documentacao Completa do Projeto

> Ultima atualizacao: 2026-04-05  
> Autor: Sergio Lima (founder)  
> Servidor: YOUR_VPS_IP (Debian 6.1, 4 vCPU, 16GB RAM, 197GB SSD)

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnica](#3-stack-tecnica)
4. [Servicos PM2](#4-servicos-pm2)
5. [Containers Docker](#5-containers-docker)
6. [Banco de Dados](#6-banco-de-dados)
7. [Rotas da API](#7-rotas-da-api)
8. [Pipeline CRM (Stages)](#8-pipeline-crm-stages)
9. [Gemini AI — Sistema de Prompts](#9-gemini-ai--sistema-de-prompts)
10. [Integracao WhatsApp](#10-integracao-whatsapp)
11. [Pagamento — Mercado Pago](#11-pagamento--mercado-pago)
12. [RPA/KSI — Consulta de Credito](#12-rpaksi--consulta-de-credito)
13. [Sistema de Follow-up](#13-sistema-de-follow-up)
14. [Tracking — Meta CAPI + GA4](#14-tracking--meta-capi--ga4)
15. [Infraestrutura](#15-infraestrutura)
16. [Credenciais (Variaveis de Ambiente)](#16-credenciais-variaveis-de-ambiente)
17. [Arquivos Importantes](#17-arquivos-importantes)

---

## 1. Visao Geral

O **Checkup360** e um funil de vendas automatizado via WhatsApp para consulta de credito. O produto principal e o **Rating Bancario** — um relatorio PDF completo que cruza dados de Banco Central, SPC, Serasa, cartorios e Receita Federal — vendido por **R$ 99**.

### Fluxo resumido

```
Landing Page (checkup360.online)
    |
    v
Lead cadastra nome + telefone
    |
    v
WhatsApp: IA (Gemini) conversa e qualifica
    |
    v
Lead paga R$ 99 (Mercado Pago: PIX, cartao, boleto)
    |
    v
RPA faz consulta no painel KSI Consultas
    |
    v
PDF entregue no WhatsApp + analise Gemini
    |
    v
IA ajuda lead a entender o relatorio
    |
    v
Upsell: Limpa Nome ou Melhora Score
```

### Proposta de valor

- **73% dos brasileiros** tem alguma pendencia no CPF sem saber
- O relatorio mostra o que **bancos realmente consultam** (SCR do Banco Central)
- Entrega em **minutos a 24h** via WhatsApp
- Analise personalizada com IA explicando cada ponto do relatorio

---

## 2. Arquitetura do Sistema

```
                                    INTERNET
                                       |
                        +--------------+--------------+
                        |              |              |
                   checkup360      api.checkup360   *.sykedigital
                    .online         .online         .com.br
                        |              |              |
                   [Cloudflare DNS + CDN]             |
                        |              |              |
                   +-----------[Traefik :80/:443]-----------+
                   |              |              |           |
              [Landing       [Nginx           [N8N]    [Portainer]
               Page]          Proxy]                   [Evolution]
                               |                       [Chatwoot]
                               |                       [Flowise]
                          [consulta-api :3001]          [Uptime Kuma]
                           /       |        \
                          /        |         \
                   [PostgreSQL] [Gemini AI] [Meta WA Cloud API]
                    (Docker)       |              |
                         \    [followup-         [Webhook
                          \   scheduler]        /whatsapp]
                           \       |           /
                            \      |          /
                         [rpa-ksi :3050]
                              |
                      [KSI Consultas]
                       (Puppeteer RPA)
                              |
                         [PDF gerado]
                              |
                     [Gemini analisa PDF]
                              |
                     [Entrega via WA]
                              |
                     [rag-consultor :3200]
                     (base conhecimento)
```

### Fluxo detalhado de dados

```
1. CAPTACAO
   Landing Page → POST /api/leads → cria lead (stage: novo)
   → envia template "boas_vindas" via WA
   → trackEvent("lead") → Meta CAPI + GA4

2. QUALIFICACAO
   Lead responde WA → webhook POST /api/webhooks/whatsapp
   → Gemini buildStagePrompt(stage=novo) → conversa
   → se [QUALIFIED] → stage: qualificado

3. NEGOCIACAO
   Gemini detecta interesse → [READY_TO_PAY]
   → POST /api/payments/create-checkout → Mercado Pago
   → link de pagamento enviado no WA → stage: negociando

4. PAGAMENTO
   Mercado Pago webhook → POST /api/webhooks/mercadopago
   → status: paid → stage: pago
   → cria rpa_job (status: pending)

5. CONSULTA
   rpa-ksi poll a cada 30s → pega job pending
   → Puppeteer acessa KSI → gera PDF
   → POST /api/automation/analyze-report → Gemini extrai dados
   → envia PDF no WA → stage: entregue

6. POS-ENTREGA
   Lead pergunta sobre relatorio → Gemini responde com dados reais
   → quando entende → [READY_FOR_UPSELL] → stage: upsell
   → oferece Limpa Nome ou Melhora Score

7. FOLLOW-UP (automatico)
   Janela aberta: nudges texto (5m/10m/30m/1h/3h/8h)
   Janela fechada: templates (1h/3h/12h/12h/12h)
```

---

## 3. Stack Tecnica

| Componente | Tecnologia | Versao |
|---|---|---|
| **Backend** | Node.js + Express (TypeScript compilado) | Node 20.20.2 |
| **Banco de Dados** | PostgreSQL (Docker) | 16-alpine |
| **Cache/Filas** | Redis (Docker) | 7-alpine |
| **Process Manager** | PM2 | com logrotate |
| **Reverse Proxy** | Traefik (SSL) + Nginx (API proxy) | Traefik 2.11.3 |
| **Orquestrador** | Docker Swarm | — |
| **IA Conversacional** | Google Gemini (gemini-2.5-flash) | API v1beta |
| **WhatsApp** | Meta WhatsApp Cloud API | v21.0 |
| **Pagamento** | Mercado Pago | Checkout Pro |
| **RPA** | Puppeteer (headless Chrome) | puppeteer-core |
| **Consulta** | KSI Consultas (painel web) | — |
| **Automacao** | N8N (editor + worker + webhook) | latest |
| **WA Gateway** | Evolution API | v2.3.7 |
| **Help Desk** | Chatwoot | v3.10.2-ce |
| **RAG** | Flowise | 1.8.2 |
| **Monitoring** | Uptime Kuma | 1 |
| **Storage** | MinIO | 2024-05-27 |
| **Docker UI** | Portainer CE | sts |
| **Tracking** | Meta CAPI + GA4 Measurement Protocol | — |
| **DNS/CDN** | Cloudflare | — |

---

## 4. Servicos PM2

| # | Nome | Script | Porta | Diretorio | Funcao |
|---|---|---|---|---|---|
| 5 | `consulta-api` | `/opt/consulta-credito-api/dist/index.js` | 3001 | `/opt/consulta-credito-api` | API principal: rotas, webhooks WA/MP, Gemini AI, CRM pipeline |
| 2 | `rpa-ksi` | `/root/rpa-service/index.js` | 3050 | `/root/rpa-service` | RPA: Puppeteer acessa KSI, gera PDF, analisa com Gemini, entrega WA |
| 7 | `followup-scheduler` | `/opt/consulta-credito-api/followup-scheduler.js` | — | `/opt/consulta-credito-api` | Agendador: nudges (janela aberta) e follow-ups (janela fechada) |
| 6 | `rag-consultor` | `/opt/rag-service/server.js` | 3200 | `/opt/rag-service` | Base de conhecimento: consultor financeiro IA com Gemini |

### Logs PM2

```bash
pm2 logs consulta-api --lines 100
pm2 logs rpa-ksi --lines 100
pm2 logs followup-scheduler --lines 50
pm2 logs rag-consultor --lines 50
```

---

## 5. Containers Docker

Todos rodam em **Docker Swarm** na rede overlay `network_swarm_public`.

| Container | Imagem | Porta Interna | Funcao |
|---|---|---|---|
| `postgres_postgres` | `postgres:16-alpine` | 5432 | Banco principal (schema: consulta_credito) |
| `redis_redis` | `redis:7-alpine` | 6379 | Cache e filas |
| `traefik_traefik` | `traefik:v2.11.3` | 80, 443 | Reverse proxy + SSL automatico (Let's Encrypt) |
| `api_proxy_api-proxy` | `nginx:alpine` | 80 | Proxy para consulta-api (:3001) |
| `evolution_v2_evolution_v2` | `evoapicloud/evolution-api:v2.3.7` | 8080 | Gateway WhatsApp alternativo |
| `n8n_editor` | `n8nio/n8n:latest` | 5678 | Automacao: editor |
| `n8n_worker` | `n8nio/n8n:latest` | 5678 | Automacao: worker |
| `n8n_webhook` (x2) | `n8nio/n8n:latest` | 5678 | Automacao: webhook handler (2 replicas) |
| `portainer_portainer` | `portainer/portainer-ce:sts` | 9000, 9443 | UI Docker |
| `portainer_agent` | `portainer/agent:sts` | — | Agente Portainer |
| `chatwoot_admin` | `chatwoot/chatwoot:v3.10.2-ce` | 3000 | Atendimento humano: web |
| `chatwoot_sidekiq` | `chatwoot/chatwoot:latest` | 3000 | Atendimento humano: jobs |
| `flowise` | `flowiseai/flowise:1.8.2` | 3000→3100 | RAG visual (pgvector) |
| `uptime-kuma` | `louislam/uptime-kuma:1` | 3001→3390 | Monitoramento de uptime |
| `minio_minio` | `minio/minio:2024-05-27` | 9000 | Object storage (S3-compatible) |

### Redes Docker

| Rede | Driver | Uso |
|---|---|---|
| `network_swarm_public` | overlay | Rede principal dos servicos Swarm |
| `minio_network_public` | overlay | Rede do MinIO |
| `monitoring` | bridge | Monitoramento local |

---

## 6. Banco de Dados

- **Engine:** PostgreSQL 16 (Docker)
- **Schema:** `consulta_credito`
- **Host:** 127.0.0.1:5432
- **Database:** `postgres`

### Tabelas

#### `leads` — Tabela principal (47 colunas)

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | uuid PK | Identificador unico |
| `name` | varchar NOT NULL | Nome do lead |
| `cpf` | varchar | CPF (preenchido na qualificacao) |
| `phone` | varchar NOT NULL | Telefone (formato 5511999999999) |
| `email` | varchar | Email (opcional) |
| `status` | varchar | Status geral: new, in_conversation, payment_pending, paid, completed, lost |
| `pipeline_stage` | varchar | Stage do CRM (ver secao 8) |
| `source` | varchar | Origem: landing_page, whatsapp, manual |
| `utm_source/medium/campaign/content/term` | varchar | UTM params de tracking |
| `fbclid` / `gclid` | varchar | Click IDs Facebook/Google |
| `fbp` / `fbc` | varchar | Cookies Meta (para CAPI) |
| `ga_client_id` / `ga_session_id` | varchar | IDs Google Analytics |
| `ip_address` | varchar | IP do lead (para CAPI) |
| `user_agent` | text | User-Agent (para CAPI) |
| `referrer` | text | Referrer da landing page |
| `wa_conversation_id` | varchar | ID da conversa WA |
| `wa_last_message_at` | timestamptz | Ultima mensagem no WA |
| `wa_template_sent` | boolean | Se template de boas-vindas foi enviado |
| `wa_template_sent_at` | timestamptz | Quando o template foi enviado |
| `wa_opted_in` | boolean | Se o lead aceitou receber mensagens |
| `window_expires_at` | timestamptz | Quando a janela de 24h expira |
| `consultation_result` | jsonb | Resultado da consulta (JSON) |
| `consultation_done_at` | timestamptz | Quando a consulta foi concluida |
| `product_interest` | varchar | Produto de interesse |
| `protocol_number` | varchar | Numero de protocolo (CC-YYYYMMDD-XXXX) |
| `assigned_to` | uuid | Atendente atribuido |
| `notes` | text | Notas internas |
| `lost_reason` | varchar | Motivo da perda |
| `follow_up_count` | integer | Contador de follow-ups enviados |
| `nudge_count` | integer | Contador de nudges enviados |
| `last_template_sent_at` | timestamptz | Ultimo template enviado |
| `last_template_name` | varchar | Nome do ultimo template |
| `last_message_direction` | varchar | Ultima direcao: inbound/outbound |
| `consent_service` / `consent_marketing` | boolean | Consentimentos LGPD |
| `consent_at` | timestamptz | Quando consentiu |
| `tracking_consent` | boolean | Consentimento de tracking |
| `created_at` / `updated_at` | timestamptz | Timestamps |

#### `conversations` — Historico de mensagens

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | uuid PK | ID da mensagem |
| `lead_id` | uuid FK | Referencia ao lead |
| `direction` | varchar NOT NULL | inbound (lead) ou outbound (sistema/IA) |
| `message_type` | varchar | text, template, image, document, audio |
| `content` | text NOT NULL | Conteudo da mensagem |
| `wa_message_id` | varchar | ID da mensagem na Meta |
| `wa_status` | varchar | sent, delivered, read, failed |
| `wa_timestamp` | timestamptz | Timestamp da Meta |
| `is_ai_generated` | boolean | Se foi gerada pela IA |
| `ai_model` | varchar | Modelo: gemini-2.5-flash, scheduler |
| `ai_tokens_used` | integer | Tokens consumidos |
| `meta_error_code` / `meta_error_message` | varchar/text | Erro da Meta API |
| `created_at` | timestamptz | — |

#### `payments` — Pagamentos

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | uuid PK | ID do pagamento |
| `lead_id` | uuid FK | Referencia ao lead |
| `gateway` | varchar NOT NULL | mercado_pago |
| `gateway_payment_id` | varchar | ID no Mercado Pago |
| `gateway_checkout_url` | text | URL do checkout |
| `amount` | numeric NOT NULL | Valor (99.00) |
| `currency` | varchar | BRL |
| `status` | varchar | pending, approved, rejected, cancelled |
| `payment_method` | varchar | pix, credit_card, boleto |
| `product` | varchar NOT NULL | rating_bancario |
| `paid_at` | timestamptz | Quando foi pago |
| `expires_at` | timestamptz | Expiracao do checkout |
| `created_at` / `updated_at` | timestamptz | — |

#### `rpa_jobs` — Fila de consultas RPA

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | uuid PK | ID do job |
| `lead_id` | uuid FK | Referencia ao lead |
| `cpf` | varchar NOT NULL | CPF a consultar |
| `phone` | varchar NOT NULL | Telefone para entrega |
| `status` | varchar NOT NULL | pending, processing, completed, failed |
| `attempts` | integer | Tentativas realizadas |
| `max_attempts` | integer | Maximo de tentativas |
| `error` | text | Mensagem de erro |
| `report_summary` | text | Resumo do relatorio |
| `has_pendencias` | boolean | Se tem pendencias no CPF |
| `analysis_json` | jsonb | Analise completa do Gemini |
| `started_at` / `completed_at` | timestamptz | — |
| `next_retry_at` | timestamptz | Proxima tentativa |
| `created_at` / `updated_at` | timestamptz | — |

#### `upsell_leads` — Leads interessados em upsell

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | uuid PK | — |
| `lead_id` | uuid FK | Referencia ao lead |
| `service_type` | varchar NOT NULL | limpa_nome, melhora_score, geral |
| `name` / `phone` / `email` / `cpf` | varchar | Dados do lead |
| `notes` | text | Notas |
| `status` | varchar | pending, contacted, converted, declined |
| `created_at` / `updated_at` | timestamp | — |

#### `webhook_logs` — Log de webhooks recebidos

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | uuid PK | — |
| `source` | varchar NOT NULL | whatsapp, mercadopago |
| `event_type` | varchar | message, status, payment |
| `payload` | jsonb NOT NULL | Payload completo |
| `status` | varchar | processed, error, ignored |
| `error_message` | text | Erro no processamento |
| `processed_at` / `created_at` | timestamptz | — |

#### Outras tabelas

| Tabela | Descricao |
|---|---|
| `wa_templates` | Templates WA cadastrados (nome, body, buttons, status Meta) |
| `admin_users` | Usuarios do painel admin (email, password_hash, role) |
| `daily_metrics` | Metricas diarias agregadas (leads, pagamentos, receita, tokens IA) |
| `ab_tests` | Testes A/B (variantes em JSONB, metrica primaria, vencedor) |

#### Views

| View | Descricao |
|---|---|
| `vw_funnel` | Visao do funil por stage |
| `vw_revenue_summary` | Resumo de receita |

---

## 7. Rotas da API

Base URL: `https://api.checkup360.online/api`

### `/api/auth` — Autenticacao

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | `/setup` | — | Setup inicial (cria admin com SETUP_MASTER_KEY) |
| POST | `/login` | — | Login (retorna JWT) |
| GET | `/me` | JWT | Dados do usuario logado |

### `/api/leads` — Gestao de Leads

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/` | JWT | Lista leads (paginado, filtros) |
| GET | `/:id` | JWT | Detalhes de um lead |
| POST | `/` | — | Cria lead (landing page) |
| PATCH | `/:id` | JWT | Atualiza lead |
| DELETE | `/:id` | JWT+Admin | Remove lead |

### `/api/conversations` — Historico de Conversas

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/:leadId` | JWT | Historico de mensagens do lead |
| POST | `/` | — | Registra nova mensagem |

### `/api/payments` — Pagamentos

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/` | JWT | Lista pagamentos |
| POST | `/create-checkout` | — | Cria checkout Mercado Pago |

### `/api/webhooks` — Webhooks

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/whatsapp` | — | Verificacao do webhook Meta (challenge) |
| POST | `/whatsapp` | — | Recebe mensagens/status do WhatsApp |
| POST | `/mercadopago` | — | Recebe notificacoes de pagamento |
| POST | `/send-welcome` | — | Envia template de boas-vindas |

### `/api/automation` — Automacao

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/leads/follow-up` | API Key | Leads para follow-up |
| GET | `/leads/nudge` | API Key | Leads para nudge |
| GET | `/leads/by-stage/:stage` | API Key | Leads por stage |
| POST | `/leads/:id/move` | API Key | Move lead de stage |
| POST | `/send-message` | API Key | Envia mensagem WA |
| POST | `/leads/:id/nudge-sent` | API Key | Registra nudge enviado |
| POST | `/leads/:id/followup-sent` | API Key | Registra follow-up enviado |
| POST | `/log-event` | API Key | Log de evento |
| POST | `/post-delivery` | API Key | Processamento pos-entrega |
| POST | `/analyze-report` | API Key | Analise Gemini do relatorio PDF |

### `/api/flows` — WhatsApp Flows

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | `/data-exchange` | — | Data exchange endpoint para WA Flows |

### `/api/meta` — Gestao de Templates

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/templates` | JWT | Lista templates da Meta |
| POST | `/create-template` | JWT | Cria novo template |
| DELETE | `/delete-template/:name` | JWT | Remove template |
| POST | `/send-template` | JWT | Envia template para lead |

### `/api/users` — Gestao de Usuarios

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/` | JWT+Admin | Lista usuarios |
| POST | `/` | JWT+Admin | Cria usuario |
| PATCH | `/:id` | JWT+Admin | Atualiza usuario |
| DELETE | `/:id` | JWT+Admin | Remove usuario |

### `/api/dashboard` — Dashboard

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/stats` | JWT | Estatisticas gerais |
| GET | `/chart` | JWT | Dados para graficos |
| GET | `/source-breakdown` | JWT | Breakdown por fonte |

### `/api/analytics` — Analytics Avancado

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/overview` | JWT | Visao geral de metricas |
| GET | `/funnel` | JWT | Dados do funil |
| GET | `/chart` | JWT | Graficos temporais |
| GET | `/sources` | JWT | Analise por fonte |
| GET | `/performance` | JWT | Performance geral |
| GET | `/pipeline-velocity` | JWT | Velocidade do pipeline |
| GET | `/whatsapp-metrics` | JWT | Metricas WhatsApp |
| GET | `/wa-funnel` | JWT | Funil WhatsApp |
| GET | `/crm-bottlenecks` | JWT | Gargalos do CRM |
| POST | `/ab-tests` | JWT | Cria teste A/B |
| GET | `/ab-tests` | JWT | Lista testes A/B |
| GET | `/ab-tests/:id` | JWT | Detalhes de teste |
| PATCH | `/ab-tests/:id` | JWT | Atualiza teste |

---

## 8. Pipeline CRM (Stages)

O pipeline tem **9 stages** que controlam todo o comportamento da IA e automacoes.

```
 novo → tentativa_contato → qualificado → negociando → pago → entregue → upsell
   \                                          |                              |
    \                                         v                              v
     +--→ follow_up -----→ perdido        (pagamento                   (interesse
          (max 5 tentativas)               rejeitado                    detectado
                                           volta p/                    → upsell_leads)
                                           negociando)
```

### Detalhamento de cada stage

| # | Stage | Status | Trigger de Entrada | Comportamento da IA | Saida |
|---|---|---|---|---|---|
| 1 | `novo` | new | Lead criado (landing page) | Acolhe, entende necessidade. NAO vende. | [QUALIFIED] → qualificado |
| 2 | `tentativa_contato` | new | Template boas-vindas enviado, sem resposta | Se respondeu: engaja e qualifica | [QUALIFIED] → qualificado |
| 3 | `qualificado` | in_conversation | IA detecta interesse real | Explica produto R$99, argumentos, objecoes | [READY_TO_PAY] → negociando |
| 4 | `negociando` | payment_pending | IA detecta intencao de pagar | Facilita decisao, link de pagamento | Pagamento aprovado → pago |
| 5 | `pago` | paid | Webhook Mercado Pago (approved) | Confirma pagamento, avisa sobre consulta | rpa_job criado → RPA processa |
| 6 | `entregue` | completed | PDF enviado no WhatsApp | Ajuda entender relatorio com DADOS REAIS | [READY_FOR_UPSELL] → upsell |
| 7 | `upsell` | completed | Lead demonstra que entendeu relatorio | Oferece Limpa Nome ou Melhora Score | [UPSELL_INTEREST:tipo] → upsell_leads |
| 8 | `follow_up` | — | Followup-scheduler (5 tentativas) | Responde se reengajar | [QUALIFIED] → qualificado |
| 9 | `perdido` | lost | Opt-out, 5 follow-ups sem resposta, ou [NOT_INTERESTED] | Se mandar msg: reengaja | [QUALIFIED] → qualificado |

### Intent Tags da IA

| Tag | Acao no Sistema |
|---|---|
| `[QUALIFIED]` | Move para `qualificado`, status `in_conversation` |
| `[READY_TO_PAY]` | Move para `negociando`, gera checkout Mercado Pago, envia link |
| `[READY_FOR_UPSELL]` | Move para `upsell` |
| `[UPSELL_INTEREST:limpa_nome]` | Registra em `upsell_leads` com service_type |
| `[UPSELL_INTEREST:melhora_score]` | Registra em `upsell_leads` com service_type |
| `[UPSELL_DECLINED]` | Registra declinio |
| `[NOT_INTERESTED]` | Pode mover para `perdido` |
| `[OPT_OUT]` | wa_opted_in = false, stage = `perdido` |

---

## 9. Gemini AI — Sistema de Prompts

### Funcao `buildStagePrompt(lead, analysisData)`

Localizada em `/opt/consulta-credito-api/dist/routes/webhooks.js` (linha 209).

Concatena:
1. **BASE_PERSONA** — personalidade da IA (acolhedora, objetiva, portugues BR)
2. **ETAPA ATUAL** — prompt especifico do stage (ver abaixo)
3. **Dados do relatorio** — injetados nos stages `entregue` e `upsell`

### Prompts por Stage

#### `novo`
> O lead acabou de se cadastrar. Engajar e qualificar. Responda de forma acolhedora, entenda a necessidade. NAO venda ainda. Se demonstrar interesse real → [QUALIFIED]. Se nao tiver interesse → [NOT_INTERESTED].

#### `tentativa_contato`
> O lead recebeu template de boas-vindas. Se respondeu, agradecer e perguntar como pode ajudar. NAO venda ainda. Se demonstrar interesse → [QUALIFIED].

#### `qualificado`
> Lead respondeu e tem interesse. Explicar o produto:
> - Consulta Completa R$99: PDF com 15+ pontos, cruza BC/SPC/Serasa/cartorios/RF
> - Mostra score, rating (AAA-H), dividas, protestos, financiamentos
> - Entrega via WhatsApp
> - Objecoes: "Serasa gratis" → nosso cruza BC; "R$99 caro" → investimento em clareza
> - Se quiser pagar → [READY_TO_PAY]

#### `negociando`
> Lead considerando pagar. Facilitar decisao. Se pediu pra pagar → [READY_TO_PAY]. Aceita PIX, cartao ou boleto ate 12x. NAO insista.

#### `entregue`
> Documento entregue. MISSAO: ajudar a ENTENDER com dados reais.
> 1. Responder perguntas citando dados especificos ("no seu relatorio consta que...")
> 2. Perguntar "ficou alguma duvida?"
> 3. SO quando disser que entendeu → [READY_FOR_UPSELL]
> 
> Distincao: RATING = letras (AAA-H), SCORE = numero (0-1000). NAO misturar.

#### `upsell`
> Lead entendeu o documento. Oferece servico complementar:
> - Se tem pendencias → LIMPA NOME (negociacao com credores)
> - Se CPF limpo → MELHORA SCORE (acompanhamento profissional)
> - Se aceitar → [UPSELL_INTEREST:tipo]
> - Se recusar → [UPSELL_DECLINED]

#### `perdido`
> Lead marcado como perdido mas mandou msg. Responder educadamente. Se demonstrar interesse → [QUALIFIED]. Se quiser cancelar → [OPT_OUT].

### Parametros de Geracao

| Stage | Temperature | Contexto Extra |
|---|---|---|
| `novo`, `qualificado`, `negociando` | 0.7 | — |
| `entregue`, `upsell` | 0.5 | analysis_json do rpa_job injetado |

### Injecao de dados do relatorio

Para stages `entregue` e `upsell`, o sistema busca o `analysis_json` do `rpa_jobs` e injeta no prompt:
```
=== DADOS DO RELATORIO DO CLIENTE ===
{rating, score, restricoes, protestos, dividas, conclusao...}
```

Isso permite que a IA cite dados reais: "Seu rating e C, que e regular" em vez de respostas genericas.

---

## 10. Integracao WhatsApp

### Configuracao

- **API:** Meta WhatsApp Cloud API v21.0
- **Phone Number ID:** configurado via env `META_PHONE_NUMBER_ID`
- **Business Account ID:** configurado via env `META_BUSINESS_ACCOUNT_ID`
- **Webhook Verify Token:** configurado via env `META_WEBHOOK_VERIFY_TOKEN`

### Webhook

- **URL:** `https://api.checkup360.online/api/webhooks/whatsapp`
- **Verificacao:** GET com `hub.verify_token` e `hub.challenge`
- **Mensagens:** POST com payload de mensagens/status

### Logica da Janela de 24h

A Meta permite enviar mensagens texto livre apenas dentro de 24h apos a ultima mensagem do usuario. Apos isso, so templates aprovados.

- `window_expires_at` — atualizado em cada mensagem inbound do lead (now + 24h)
- **Janela aberta:** nudges com texto livre
- **Janela fechada:** somente templates aprovados

### Templates Aprovados (14 total)

| # | Nome | Categoria | Variaveis | Uso | Buttons |
|---|---|---|---|---|---|
| 1 | `boas_vindas` | MARKETING | {{1}} nome | Primeiro contato apos cadastro | — |
| 2 | `cadastro_confirmado` | MARKETING | {{1}} nome, {{2}} protocolo | Confirma cadastro com protocolo | PIX / Cartao |
| 3 | `nudge_duvida` | MARKETING | {{1}} nome | Follow-up #1: pergunta se ficou duvida | Me explica / Gerar link |
| 4 | `nudge_valor` | MARKETING | {{1}} nome | Follow-up #2: destaca valor do produto | Quero fazer / O que inclui? |
| 5 | `nudge_urgencia` | MARKETING | {{1}} nome | Follow-up #3: cria urgencia, resultado 24h | PIX / Cartao / Duvida |
| 6 | `nudge_ultima_chance` | MARKETING | {{1}} nome | Follow-up #4: ultima mensagem | Manda resumo / Quero fazer / Nao preciso |
| 7 | `reativacao_consulta` | MARKETING | {{1}} nome | Follow-up #5: reativacao | Quero fazer / O que inclui? / Nao preciso |
| 8 | `dados_incompletos` | MARKETING | {{1}} nome | Pagamento pendente | Finalizar / Ta caro / Nao entendi |
| 9 | `pagamento_pendente` | MARKETING | {{1}} nome | Lembrete de pagamento | Gerar link / Duvida |
| 10 | `solicitacao_expirando` | MARKETING | {{1}} nome, {{2}} protocolo | Aviso de expiracao | Pagar agora / Me explica |
| 11 | `ultimo_aviso_arquivamento` | MARKETING | {{1}} nome, {{2}} protocolo | Ultimo aviso antes de arquivar | Garantir / Sem interesse |
| 12 | `solicitacao_arquivada` | MARKETING | {{1}} nome | Aviso de arquivamento | Reativar / Talvez depois |
| 13 | `consulta_resultado` | MARKETING | {{1}} nome | Aviso de resultado pronto | — |
| 14 | `hello_world` | UTILITY | — | Template padrao Meta (teste) | — |

### WhatsApp Flows

Endpoint: `POST /api/flows/data-exchange`

Usado para formularios interativos dentro do WhatsApp (coleta de CPF, consentimento, etc).

---

## 11. Pagamento — Mercado Pago

### Fluxo

```
1. IA detecta [READY_TO_PAY]
2. POST /api/payments/create-checkout
   → Cria preferencia no Mercado Pago (R$ 99)
   → Salva payment (status: pending, gateway_checkout_url)
   → Envia link no WhatsApp
3. Lead paga (PIX, cartao ou boleto)
4. Mercado Pago envia webhook
   → POST /api/webhooks/mercadopago
   → Verifica status na API do MP
   → Se approved:
      - payment.status = approved
      - lead.status = paid
      - lead.pipeline_stage = pago
      - Cria rpa_job (status: pending)
      - trackEvent("purchase")
```

### Configuracao

- **Gateway:** Mercado Pago Checkout Pro
- **Produto:** Rating Bancario
- **Valor:** R$ 99,00
- **Metodos:** PIX (aprovacao instantanea), cartao de credito (ate 12x), boleto
- **Webhook:** `https://api.checkup360.online/api/webhooks/mercadopago`
- **Importante:** Webhook so logga warning se assinatura invalida (NAO rejeita) — MP usa secret diferente do documentado

---

## 12. RPA/KSI — Consulta de Credito

### Servico: `rpa-ksi` (porta 3050)

O RPA usa **Puppeteer** (Chrome headless) para acessar o painel da **KSI Consultas** e gerar o relatorio PDF.

### Fluxo

```
1. rpa-ksi faz poll a cada 30s no banco
   → SELECT rpa_jobs WHERE status = 'pending' ORDER BY created_at LIMIT 1

2. Abre browser persistente (reutiliza sessao)
   → Login em https://painel.ksiconsultas.com.br
   → Email + senha via env

3. Navega ate a consulta de Rating Bancario
   → Insere CPF do lead
   → Aguarda processamento
   → Baixa PDF para /tmp/ksi-downloads/

4. Envia PDF para Gemini (via consulta-api)
   → POST /api/automation/analyze-report
   → Gemini extrai: rating, score, restricoes, protestos, dividas, conclusao
   → Retorna analysis_json + has_pendencias + report_summary

5. Faz upload do PDF para Meta (Media API)
   → Envia documento no WhatsApp com caption

6. Atualiza rpa_job:
   → status = completed
   → report_summary, has_pendencias, analysis_json salvos

7. Trigger pos-entrega:
   → POST /api/automation/post-delivery
   → Atualiza lead: stage = entregue
   → IA pronta para explicar relatorio
```

### Regras importantes

- **NUNCA regerar consulta** — cada consulta custa credito na KSI. Buscar no historico primeiro.
- **Maximo 1 consulta simultanea** (MAX_CONCURRENT = 1)
- **Retry automatico** com max_attempts
- **Cleanup automatico:** cron deleta PDFs com mais de 2h em `/tmp/ksi-downloads/`

### Analise Gemini do PDF

O endpoint `/api/automation/analyze-report` envia o conteudo do PDF para o Gemini com prompt de extracao estruturada. Retorna:

```json
{
  "rating": "C",
  "score": 580,
  "has_pendencias": true,
  "restricoes": [...],
  "protestos": [...],
  "dividas": [...],
  "conclusao": "...",
  "recommended_service": "limpa_nome"
}
```

---

## 13. Sistema de Follow-up

Servico: `followup-scheduler` — roda a cada 60 segundos.

### Dois tipos de automacao

#### 1. NUDGE — Janela Aberta (texto livre)

Enviado quando o lead recebeu uma mensagem do bot e nao respondeu, mas a janela de 24h ainda esta aberta.

| # | Intervalo | Mensagem |
|---|---|---|
| 1 | 5 min | "Oi! Tudo certo por ai? Se tiver alguma duvida, e so falar" |
| 2 | 10 min | "Ei, sei que a rotina e corrida! To aqui pra te ajudar quando puder" |
| 3 | 30 min | "Opa! Ainda to por aqui se precisar. Posso te explicar melhor como funciona a consulta?" |
| 4 | 1 hora | "Oi! So passando pra lembrar que to disponivel pra te ajudar com a consulta de credito." |
| 5 | 3 horas | "Oi! Faz um tempinho que a gente tava conversando. Se ainda tiver interesse, me avisa" |
| 6 | 8 horas | "Ultima mensagem por aqui! Se quiser saber mais sobre a consulta de credito, e so responder" |

**Condicoes para nudge:**
- Stage em: `qualificado`, `negociando`, `pago`
- Status NAO e: paid, completed, lost
- last_message_direction = outbound (bot foi o ultimo a falar)
- window_expires_at > NOW() (janela aberta)
- nudge_count < 6
- wa_opted_in = true

#### 2. FOLLOW-UP — Janela Fechada (templates)

Enviado quando a janela de 24h ja fechou. Usa templates aprovados pela Meta.

| # | Intervalo | Template | Estrategia |
|---|---|---|---|
| 1 | 1 hora | `nudge_duvida` | Pergunta se ficou duvida |
| 2 | 3 horas | `nudge_valor` | Mostra valor do produto |
| 3 | 12 horas | `nudge_urgencia` | Cria urgencia (resultado 24h) |
| 4 | 12 horas | `nudge_ultima_chance` | Ultima tentativa |
| 5 | 12 horas | `reativacao_consulta` | Reativacao |

**Condicoes para follow-up:**
- Stage em: `novo`, `tentativa_contato`, `qualificado`, `negociando`, `follow_up`
- Status NAO e: paid, completed, lost
- window_expires_at IS NULL OU < NOW() (janela fechada)
- follow_up_count < 5
- wa_opted_in = true

**Transicoes automaticas:**
- Se stage = `novo` e recebeu follow-up → move para `tentativa_contato`
- Se follow_up_count >= 4 → move para `follow_up`

---

## 14. Tracking — Meta CAPI + GA4

### Arquitetura

```
/opt/consulta-credito-api/dist/tracking/
├── index.js      ← trackEvent() — dispatcher
├── meta-capi.js  ← Conversions API do Facebook
└── ga4-mp.js     ← GA4 Measurement Protocol
```

### Funcao `trackEvent(eventType, lead, extraData)`

Despacha eventos para Meta CAPI e GA4 simultaneamente.

### Eventos por tipo

| Tipo de Evento | Meta CAPI | GA4 | Quando |
|---|---|---|---|
| `lead` | Lead | generateLead | Novo lead criado |
| `initiate_checkout` | InitiateCheckout | beginCheckout | Link de pagamento gerado |
| `purchase` | Purchase | purchase | Pagamento aprovado (valor: R$99) |

### Eventos por mudanca de stage

| Stage | Meta CAPI | GA4 |
|---|---|---|
| `novo` | lead | generateLead |
| `tentativa_contato` | contactAttempt | contactAttempt |
| `qualificado` | qualified | qualified |
| `negociando` | — | negotiating |
| `pago` | purchase | purchase |
| `entregue` | delivered | delivered |
| `upsell` | — | upsellOffered |
| `follow_up` | — | followUp |
| `perdido` | — | leadLost |

### Dados de usuario (Meta CAPI)

Enviados hashados (SHA-256) conforme exigido pela Meta:
- `phone` (formato E.164)
- `firstName`, `lastName`
- `externalId` (lead.id)
- `clientIp`, `userAgent`
- `fbc`, `fbp` (cookies Meta capturados na landing page)

### Dados de sessao (GA4)

- `ga_client_id` — capturado via cookie _ga na landing page
- `ga_session_id` — capturado via cookie _ga_session
- `userId` — lead.id

---

## 15. Infraestrutura

### Servidor

| Item | Detalhe |
|---|---|
| **IP** | YOUR_VPS_IP |
| **Hostname** | srv969233 |
| **OS** | Debian 12 (kernel 6.1.0-42-cloud-amd64) |
| **CPU** | 4 vCPU |
| **RAM** | 16 GB (aprox. 4.4 GB em uso) |
| **Disco** | 197 GB SSD (30 GB em uso, 16%) |
| **Swap** | 2 GB |
| **Node.js** | 20.20.2 |

### Nginx (API Proxy)

Arquivo: `/root/api-proxy-nginx.conf`

```nginx
server {
    listen 80;
    server_name api.checkup360.online;

    location / {
        proxy_pass http://172.17.0.1:3001;  # consulta-api
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

O Nginx roda como container Docker (`nginx:alpine`) no Swarm, com Traefik fazendo o SSL termination na frente.

### Traefik

- **Versao:** 2.11.3
- **Portas:** 80 (HTTP) e 443 (HTTPS)
- **SSL:** Let's Encrypt automatico (ACME)
- **IMPORTANTE:** NAO mexer no Traefik sem necessidade absoluta — ja derrubou tudo antes

### DNS (Cloudflare)

| Dominio | Tipo | Destino |
|---|---|---|
| `checkup360.online` | A | YOUR_VPS_IP |
| `api.checkup360.online` | A | YOUR_VPS_IP |
| `*.sykedigital.com.br` | A | YOUR_VPS_IP |

### Backups

**Crontab ativa:**

```
# Backup diario do banco (3h da manha)
0 3 * * * /opt/backups/daily-backup.sh >> /var/log/backup.log 2>&1

# Limpeza de PDFs temporarios (a cada 4h, deleta >2h)
0 */4 * * * find /tmp/ksi-downloads -name '*.pdf' -mmin +120 -delete 2>/dev/null

# Meta scripts (sincronizacao)
0 4 * * * /usr/bin/python3 /root/meta_scripts/meta_links_uelicon_venancio.py
0 5-23 * * * /usr/bin/python3 /root/meta_scripts/meta_sync_uelicon_venancio.py

# Limpeza de webhook_logs (mais de 30 dias)
30 3 * * * docker exec postgres_postgres psql -U postgres -d consulta_credito -c "DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '30 days'"
```

**Script de backup** (`/opt/backups/daily-backup.sh`):
1. `pg_dump` do schema `consulta_credito` (formato custom)
2. Compacta `.env` files
3. Retencao: 7 dias

**Diretorio de backups:** `/opt/backups/`

---

## 16. Credenciais (Variaveis de Ambiente)

### consulta-api (`/opt/consulta-credito-api/.env`)

| Variavel | Descricao |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (com schema consulta_credito) |
| `DATABASE_SCHEMA` | Nome do schema (consulta_credito) |
| `JWT_SECRET` | Secret para tokens JWT |
| `PORT` | Porta da API (3001) |
| `CORS_ORIGIN` | URL do frontend (https://checkup360.online) |
| `META_WHATSAPP_TOKEN` | Token de acesso da WhatsApp Cloud API |
| `META_PHONE_NUMBER_ID` | ID do numero de telefone no Meta |
| `META_BUSINESS_ACCOUNT_ID` | ID da conta Business no Meta |
| `META_WEBHOOK_VERIFY_TOKEN` | Token de verificacao do webhook WA |
| `META_APP_SECRET` | Secret do app Meta |
| `META_WHATSAPP_BUSINESS_ID` | ID do WhatsApp Business |
| `N8N_WEBHOOK_URL` | URL do webhook N8N |
| `N8N_API_KEY` | Chave da API N8N |
| `LLM_PROVIDER` | Provider de IA (gemini) |
| `GEMINI_API_KEY` | Chave da API Google Gemini |
| `PAYMENT_GATEWAY` | Gateway de pagamento (mercado_pago) |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de acesso Mercado Pago |
| `MERCADO_PAGO_PUBLIC_KEY` | Chave publica Mercado Pago |
| `MERCADO_PAGO_CLIENT_ID` | Client ID Mercado Pago |
| `MERCADO_PAGO_CLIENT_SECRET` | Client Secret Mercado Pago |
| `WEBHOOK_BASE_URL` | URL base para webhooks (https://api.checkup360.online) |
| `AUTOMATION_API_KEY` | Chave para rotas /api/automation |
| `SETUP_MASTER_KEY` | Chave para setup inicial do admin |

### rpa-ksi (`/root/rpa-service/.env`)

| Variavel | Descricao |
|---|---|
| `KSI_EMAIL` | Email de login no painel KSI |
| `KSI_PASSWORD` | Senha do painel KSI |
| `META_WHATSAPP_TOKEN` | Token WA (para envio do PDF) |
| `META_PHONE_NUMBER_ID` | ID do numero WA |
| `RPA_PORT` | Porta do servico (3050) |
| `DATABASE_URL` | Connection string PostgreSQL |
| `AUTOMATION_API_KEY` | Chave para chamar /api/automation |

### rag-consultor (hardcoded em `/opt/rag-service/server.js`)

| Variavel | Descricao |
|---|---|
| `PORT` | 3200 (hardcoded) |
| `GEMINI_KEY` | Chave Gemini (hardcoded) |
| `GEMINI_MODEL` | gemini-2.5-flash (hardcoded) |

---

## 17. Arquivos Importantes

### API Principal

| Caminho | Descricao |
|---|---|
| `/opt/consulta-credito-api/` | Raiz do projeto |
| `/opt/consulta-credito-api/.env` | Variaveis de ambiente |
| `/opt/consulta-credito-api/dist/index.js` | Entry point (Express app, rotas) |
| `/opt/consulta-credito-api/dist/db.js` | Pool de conexao PostgreSQL |
| `/opt/consulta-credito-api/dist/routes/webhooks.js` | **ARQUIVO CENTRAL** — webhook WA, Gemini AI, buildStagePrompt, intent tags, pagamento WA |
| `/opt/consulta-credito-api/dist/routes/leads.js` | CRUD de leads |
| `/opt/consulta-credito-api/dist/routes/payments.js` | Checkout Mercado Pago |
| `/opt/consulta-credito-api/dist/routes/automation.js` | Automacao: follow-up, nudge, post-delivery, analyze-report |
| `/opt/consulta-credito-api/dist/routes/analytics.js` | Analytics avancado, A/B tests, funil WA |
| `/opt/consulta-credito-api/dist/routes/auth.js` | Login, JWT, setup |
| `/opt/consulta-credito-api/dist/routes/conversations.js` | Historico de conversas |
| `/opt/consulta-credito-api/dist/routes/dashboard.js` | Dashboard admin |
| `/opt/consulta-credito-api/dist/routes/flows.js` | WhatsApp Flows data exchange |
| `/opt/consulta-credito-api/dist/routes/meta.js` | Gestao de templates Meta |
| `/opt/consulta-credito-api/dist/routes/users.js` | Gestao de usuarios admin |
| `/opt/consulta-credito-api/dist/tracking/index.js` | Dispatcher de tracking (CAPI + GA4) |
| `/opt/consulta-credito-api/dist/tracking/meta-capi.js` | Meta Conversions API |
| `/opt/consulta-credito-api/dist/tracking/ga4-mp.js` | GA4 Measurement Protocol |
| `/opt/consulta-credito-api/dist/middleware/` | Middlewares (auth, rate limit) |
| `/opt/consulta-credito-api/followup-scheduler.js` | Scheduler de nudges e follow-ups |

### RPA

| Caminho | Descricao |
|---|---|
| `/root/rpa-service/` | Raiz do RPA |
| `/root/rpa-service/.env` | Variaveis de ambiente |
| `/root/rpa-service/index.js` | **Servico completo** — Puppeteer, KSI login, consulta, PDF, entrega WA |
| `/root/rpa-service/explore_ksi.js` | Script de exploracao do painel KSI |
| `/root/rpa-service/resend_v3.js` | Reenvio de consultas (v3) |
| `/tmp/ksi-downloads/` | PDFs temporarios (limpos automaticamente) |

### RAG

| Caminho | Descricao |
|---|---|
| `/opt/rag-service/server.js` | Consultor financeiro IA com base de conhecimento embarcada |

### Infra

| Caminho | Descricao |
|---|---|
| `/root/api-proxy-nginx.conf` | Config Nginx para api.checkup360.online |
| `/opt/backups/daily-backup.sh` | Script de backup diario |
| `/opt/backups/` | Diretorio de backups (dumps + .env) |
| `/root/meta_scripts/` | Scripts Python de sincronizacao Meta |
| `/root/.pm2/logs/` | Logs de todos os servicos PM2 |

### Comandos Uteis

```bash
# Servicos
pm2 list                          # Ver status de todos os servicos
pm2 restart consulta-api          # Reiniciar API
pm2 restart rpa-ksi               # Reiniciar RPA
pm2 logs consulta-api --lines 50  # Ver logs recentes

# Docker
docker ps                         # Containers rodando
docker service ls                 # Servicos Swarm

# Banco
docker exec postgres_postgres.1.m5h4hvhnmhrf8dh5p7db20a4e psql -U postgres -d postgres
# Dentro do psql:
SET search_path TO consulta_credito;
SELECT count(*) FROM leads;
SELECT pipeline_stage, count(*) FROM leads GROUP BY pipeline_stage;

# Backup manual
/opt/backups/daily-backup.sh

# Logs
tail -f /root/.pm2/logs/consulta-api-out.log
tail -f /root/.pm2/logs/rpa-ksi-out.log
```

---

## Diagrama de Banco de Dados (Relacionamentos)

```
leads (1) ──────┬──── (*) conversations
                │
                ├──── (*) payments
                │
                ├──── (*) rpa_jobs
                │
                └──── (*) upsell_leads

admin_users ──── (independente, JWT auth)

webhook_logs ──── (independente, log de tudo)

wa_templates ──── (independente, cache local dos templates Meta)

daily_metrics ──── (independente, agregado diario)

ab_tests ──── (independente, variantes em JSONB)
```

---

## Resumo de Portas

| Porta | Servico | Acesso |
|---|---|---|
| 80 | Traefik (HTTP → redirect HTTPS) | Publico |
| 443 | Traefik (HTTPS) | Publico |
| 3001 | consulta-api (Node.js) | Via Nginx/Traefik |
| 3050 | rpa-ksi (Node.js) | Local only |
| 3100 | Flowise | Local (127.0.0.1) |
| 3200 | rag-consultor (Node.js) | Local only |
| 3390 | Uptime Kuma | Local (127.0.0.1) |
| 5432 | PostgreSQL | Docker internal |
| 5678 | N8N (editor/worker/webhook) | Docker internal |
| 6379 | Redis | Docker internal |
| 8080 | Evolution API | Docker internal |
| 9000 | Portainer / MinIO | Docker internal |

---

> **Nota final:** Este documento e a referencia master do projeto Checkup360. Mantenha atualizado conforme mudancas forem feitas. Para duvidas, consulte os logs PM2 e o historico de conversas no banco.
