# Pesquisa: WhatsApp BSPs e Plataformas de Integracao

> Pesquisa realizada em Abril/2026 para o projeto Checkup360.
> Contexto: atualmente usando Meta WhatsApp Cloud API direto via N8N.

---

## Indice

1. [Precos Base Meta (Brasil)](#1-precos-base-meta-brasil)
2. [Twilio](#2-twilio)
3. [Zenvia](#3-zenvia)
4. [Gupshup](#4-gupshup)
5. [Wati](#5-wati)
6. [360dialog](#6-360dialog)
7. [MessageBird (Bird)](#7-messagebird-bird)
8. [Make (Integromat)](#8-make-integromat)
9. [Zapier](#9-zapier)
10. [Comparativo BSP vs Meta Cloud API Direto](#10-comparativo-bsp-vs-meta-cloud-api-direto)
11. [Matriz Comparativa Geral](#11-matriz-comparativa-geral)
12. [Recomendacao para Checkup360](#12-recomendacao-para-checkup360)

---

## 1. Precos Base Meta (Brasil)

Desde Julho/2025, Meta mudou de cobranca por conversa (24h) para cobranca **por mensagem template enviada**. Mensagens free-form dentro da janela de 24h do cliente sao gratuitas.

| Categoria | Preco/msg (USD) | Observacao |
|-----------|----------------|------------|
| **Marketing** | $0.0625 | Templates promocionais, ofertas |
| **Utility** | $0.0068 | Confirmacoes, atualizacoes de pedido |
| **Authentication** | $0.0068 | OTPs, verificacao |
| **Service** | Gratis | Resposta free-form dentro da janela 24h |

**Descontos por volume**: Meta introduziu tiers automaticos para Utility e Authentication -- quanto mais envia no mes, menor o preco por mensagem.

**Janela de servico 24h**: Cada mensagem do usuario reinicia a janela. Dentro dela, templates de Utility e mensagens free-form sao gratuitos.

**Ads Click-to-WhatsApp**: Primeiras 72h de conversa iniciada por anuncio sao gratuitas.

> **Fonte**: [Meta WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing) | [FlowCall - Brazil Rates 2026](https://www.flowcall.co/blog/whatsapp-business-api-pricing-2026)

---

## 2. Twilio

### Overview
Maior CPaaS do mundo (Twilio Inc., EUA). BSP oficial do WhatsApp com API madura e ecossistema completo. Recentemente integrou ferramentas de IA (Twilio AI Assistants).

### Modelo de Precos
- **Markup Twilio**: $0.005/msg (enviada ou recebida) -- fixo, independente de categoria
- **+ Taxa Meta**: conforme tabela acima
- **Custo total Marketing Brasil**: ~$0.0675/msg ($0.0625 + $0.005)
- **Custo total Utility Brasil**: ~$0.0118/msg ($0.0068 + $0.005)
- **Messaging Engagement Suite**: $0.015/msg (link shortening, scheduling) -- 1.000 gratis/mes
- **Conversations API**: $0.05/usuario ativo mensal (para funcoes de inbox)
- **Sem mensalidade fixa** -- pay-as-you-go puro

### Recursos WhatsApp
- Envio de templates (marketing, utility, auth)
- Mensagens de midia (imagem, video, documento, audio, localizacao)
- Mensagens interativas (botoes, listas)
- Webhooks para status de entrega (sent, delivered, read, failed)
- Content Templates API para gerenciar templates
- Twilio Flex: contact center omnichannel completo

### Qualidade da API/Docs
- **Excelente**. Documentacao referencia da industria. SDKs em 7+ linguagens.
- Helper libraries, quickstarts, exemplos de codigo abundantes
- Console web robusto para debug
- Comunidade grande, Stack Overflow ativo

### Integracao com N8N
- Node nativo de Twilio no N8N (SMS, WhatsApp, Voice)
- Webhooks faceis de configurar para receber mensagens

### Self-hosted vs Cloud
- Cloud only. Nao ha opcao self-hosted.

### Quando escolher
- Equipe tecnica que quer API robusta e confiavel
- Precisa de omnichannel (SMS + WhatsApp + Voice + Email)
- Volume medio-alto com budget para o markup
- Quer Flex como contact center

### Pros
- API mais madura e estavel do mercado
- Documentacao impecavel
- Ecossistema enorme (Segment, SendGrid, Flex)
- Pay-as-you-go sem compromisso

### Contras
- Markup de $0.005/msg em AMBAS direcoes (envia e recebe)
- Fica caro em alto volume
- Sem dashboard visual de chatbot (precisa codificar)
- Sem interface de team inbox nativa (precisa Flex, que tem custo adicional)

> **Fonte**: [Twilio WhatsApp Pricing](https://www.twilio.com/en-us/whatsapp/pricing) | [Twilio Pricing Changes July 2025](https://help.twilio.com/articles/30304057900699)

---

## 3. Zenvia

### Overview
CPaaS brasileira (listada na NASDAQ: ZENV). Maior player local, forte em SMS e WhatsApp. Oferece plataforma completa "Zenvia Customer Cloud" com CRM, chatbot, campanhas.

### Modelo de Precos
**Planos de Software (mensalidade)**:

| Plano | USD/mes | Usuarios | Interacoes incluidas |
|-------|---------|----------|---------------------|
| Starter | $0 | 1 | 100 |
| Specialist | $130 | 10 | 500 |
| Expert | $390 | 30 | 2.000 |
| Professional | $845 | 50 | 5.000 |
| Enterprise | Sob consulta | Custom | Custom |

**Pacotes de Canal (WhatsApp)**:

| Pacote | Custo WhatsApp/msg | SMS/msg |
|--------|-------------------|---------|
| Pack $20 | $0.0463 (business) / $0.0185 (user) | $0.0184 |
| Pack $50 | $0.0446 | $0.0156 |
| Pack $100 | Proporcional | $0.0147 |
| Pack $200 | Proporcional | $0.0138 |
| Pack $400 | Proporcional | $0.0129 |

- **Taxa de setup**: $137 (Starter c/ WA) a $421+ (planos superiores)
- **WhatsApp Calling**: $0.0342/min (Pack $20) a $0.0235/min (Pack $400)
- **Usuarios extras**: $22-$53/usuario conforme plano

### Recursos WhatsApp
- Envio e recepcao de mensagens
- Templates com aprovacao integrada
- Chatbot builder visual (drag-and-drop)
- Campanhas em massa (broadcast)
- Dashboard de analytics
- CRM integrado
- Atendimento multiagente (team inbox)

### Qualidade da API/Docs
- **Boa**. API REST unificada para SMS, WhatsApp, Email
- Docs em `zenvia.github.io` -- bem organizados
- Endpoint unico: `POST /v2/channels/whatsapp/messages`
- Webhooks para status em tempo real (delivered, read, etc.)
- SDKs limitados comparado a Twilio (foco em REST)
- Tempo de integracao: ~5 minutos do registro ao primeiro envio (segundo Zenvia)

### Integracao com N8N
- Sem node nativo -- usar HTTP Request node
- API REST simples facilita integracao manual
- Webhooks compativeis com N8N webhook trigger

### Self-hosted vs Cloud
- Cloud only. Plataforma SaaS.

### Quando escolher
- Empresa brasileira querendo suporte local em PT-BR
- Precisa de plataforma completa (chatbot + CRM + campanhas)
- Time nao-tecnico que quer interface visual
- Ja usa SMS e quer unificar canais
- Prefere faturamento em BRL (ou USD com CNPJ)

### Pros
- **Empresa brasileira**: suporte em PT-BR, faturamento local, entende regulacao
- Plataforma all-in-one (chatbot, CRM, campanhas)
- BSP oficial do WhatsApp
- Plano Starter gratuito para comecar

### Contras
- **Mais cara** que API direta (markup embutido nos pacotes)
- Taxa de setup pesada ($137-$421+)
- Lock-in na plataforma proprietaria
- API menos documentada que Twilio/Gupshup
- Interacoes incluidas nos planos sao limitadas

> **Fonte**: [Zenvia Pricing](https://www.zenvia.com/en/prices/) | [Zenvia WhatsApp](https://zenvia.com/en/whatsapp/) | [Zenvia API Reference](https://zenvia.github.io/)

---

## 4. Gupshup

### Overview
BSP indiano focado em messaging. Forte em mercados emergentes (India, LATAM, SEA). Oferece Bot Studio (low-code), Campaign Manager e API de alto volume.

### Modelo de Precos
- **Markup Gupshup**: $0.001/msg (todas as direcoes e tipos)
- **+ Taxa Meta**: conforme tabela base
- **Custo total Marketing Brasil**: ~$0.0635/msg
- **Custo total Utility Brasil**: ~$0.0078/msg
- **Markup adicional (jan/2026)**: +6% sobre taxa de marketing via Cloud API (nao MM Lite)
- **Enterprise**: pricing negociado com minimo mensal
- **Self-serve**: disponivel sem contrato, $0.001/msg flat

### Recursos WhatsApp
- Bot Studio: chatbot builder low-code/no-code
- Campaign Manager: broadcasts, segmentacao, scheduling
- Template management integrado
- Rich media: imagens, videos, documentos, localizacao
- Mensagens interativas (botoes, listas, catalogo)
- Suporte a multiplos idiomas incluindo PT-BR
- AI Agents para automacao avancada

### Qualidade da API/Docs
- **Boa a muito boa**. REST API bem documentada
- Docs em `docs.gupshup.io`
- Sandbox gratuito para testes
- SDKs e exemplos de codigo
- Suporte a webhooks robusto

### Integracao com N8N
- Sem node nativo -- HTTP Request node
- API REST padrao facilita integracao
- Webhooks compativeis

### Self-hosted vs Cloud
- Cloud only. SaaS.

### Quando escolher
- Precisa do **menor markup por mensagem** entre BSPs (empatado com 360dialog)
- Alto volume de mensagens
- Quer bot builder incluso sem custo extra
- Mercados emergentes (otimizado para India, LATAM)

### Pros
- **Markup mais baixo**: $0.001/msg vs $0.005 de Twilio/Bird
- Bot Studio e Campaign Manager inclusos
- Self-serve sem contrato minimo
- Forte em mercados emergentes

### Contras
- Markup adicional de 6% em marketing (desde jan/2026)
- Enterprise pricing opaco (requer negociacao)
- Suporte pode ser lento para contas self-serve
- Menos integracao nativa com ferramentas ocidentais
- Interface pode ser confusa para iniciantes

> **Fonte**: [Gupshup WhatsApp Pricing](https://www.gupshup.ai/channels/self-serve/whatsapp/pricing) | [Gupshup Support - Pricing Model](https://support.gupshup.io/hc/en-us/articles/360012075779)

---

## 5. Wati

### Overview
Plataforma WhatsApp Business focada em PMEs. Oferece team inbox, chatbot no-code, broadcasts e automacoes. Focada em usabilidade para equipes nao-tecnicas.

### Modelo de Precos
| Plano | Preco/mes (anual) | Usuarios | Automacoes/mes |
|-------|-------------------|----------|----------------|
| **Growth** | ~$59 | 5 | 1.000 triggers |
| **Pro** | ~$279 | 5 | 5.000 triggers |
| **Business** | Sob consulta | Custom | Custom |

- **Markup de mensagem**: ~20% sobre taxa Meta (significativo!)
- **Custo efetivo Marketing Brasil**: ~$0.075/msg ($0.0625 x 1.20)
- **Usuarios extras**: cobrados a parte
- **Automacoes extras**: apos limite, resposta manual only
- **Trial**: 7 dias gratis

### Recursos WhatsApp
- **Team Inbox**: atendimento multi-agente com routing automatico
- **Chatbot no-code**: builder visual drag-and-drop
- **Broadcasts**: envio em massa com segmentacao
- **Formularios WhatsApp**: coleta de dados dentro do chat
- **Green Tick**: auxilio na verificacao de conta oficial
- **Integracao CRM**: Salesforce, HubSpot, Zoho, Shopify
- **API REST**: para integracao customizada
- **Reports**: metricas de agente, tempo de resposta, etc.

### Qualidade da API/Docs
- **Media**. API REST funcional mas documentacao menos profunda
- Foco principal na interface visual, API e secundaria
- Webhooks disponveis
- Integracao Zapier/Make nativa

### Integracao com N8N
- Sem node nativo dedicado
- HTTP Request node via API REST
- Templates de workflow no Make.com (suporte indireto)

### Self-hosted vs Cloud
- Cloud only. SaaS.

### Quando escolher
- PME que precisa de **team inbox pronto** sem desenvolvimento
- Time de atendimento nao-tecnico
- Quer chatbot visual sem codificar
- Volume baixo-medio (markup de 20% pesa em alto volume)

### Pros
- Interface mais amigavel para equipes de atendimento
- Team inbox com routing e reports prontos
- Chatbot no-code funcional
- Suporte a Green Tick verification
- Presente em mercados LATAM (suporte em espanhol)

### Contras
- **Markup de ~20% sobre Meta** -- o mais caro entre BSPs
- Automacoes limitadas por plano (1.000/5.000 triggers)
- API secundaria -- plataforma e visual-first
- Lock-in forte na plataforma
- Escala limitada: pricing fica proibitivo em alto volume

> **Fonte**: [Wati Pricing](https://www.wati.io/pricing/) | [Chatarmin - Wati Pricing Analysis](https://chatarmin.com/en/blog/wati-pricing) | [YCloud - Wati Pricing Explained](https://www.ycloud.com/blog/wati-pricing)

---

## 6. 360dialog

### Overview
BSP alemao focado em **API pura** -- sem interface visual, sem chatbot builder. Filosofia: menor custo, maximo controle para desenvolvedores. Modelo de pricing mais transparente do mercado.

### Modelo de Precos

| Plano | Preco/mes | Throughput | Markup/msg |
|-------|-----------|------------|------------|
| **Regular** | EUR 49 (~$53) | 80 msg/s | **Zero** |
| **Premium** | EUR 99 (~$107) | 80 msg/s | **Zero** |
| **High Throughput** | EUR 249 (~$270) | 1.000 msg/s | **Zero** |

**Partner Platform** (para revendedores):

| Plano | Preco/mes |
|-------|-----------|
| Growth | EUR 500 |
| Premium | EUR 1.000 |

- **ZERO markup por mensagem** -- paga apenas a taxa Meta + mensalidade fixa
- **Custo efetivo Marketing Brasil**: $0.0625/msg + ~$53/mes fixo
- **Break-even vs Twilio**: ~10.600 msgs/mes (onde o fixo compensa vs $0.005/msg)

### Recursos WhatsApp
- API REST pura (Cloud API wrapper)
- Template management via API
- Webhook para status e mensagens recebidas
- Sandbox gratuito para testes
- Dashboard basico para gerenciar numeros
- **SEM**: chatbot builder, team inbox, campaign manager, analytics visual

### Qualidade da API/Docs
- **Boa para devs**. Docs em `docs.360dialog.com`
- API alinhada com Cloud API oficial da Meta
- Sandbox imediato e gratuito
- Desafios reportados com integracao HTTP em algumas ferramentas

### Integracao com N8N
- **Sem node nativo** -- HTTP Request node obrigatorio
- Comunidade reporta dificuldades com erros 400 na integracao
- Requer conhecimento tecnico para configurar headers/auth
- Webhooks compativeis com N8N webhook trigger

### Self-hosted vs Cloud
- Cloud (API hospedada pela 360dialog)
- Historicamente ofereciam Docker on-premise, mas migraram para Cloud API pos-sunset do On-Premises API (Out/2025)

### Quando escolher
- **Volume alto** onde markup zero compensa a mensalidade
- Time tecnico que vai construir propria interface
- Quer o **menor custo total** para >10k msgs/mes
- Parceiros/agencias que revendem WhatsApp

### Pros
- **Zero markup por mensagem** -- unico BSP com modelo puramente fixo
- Pricing mais transparente do mercado
- API leve e alinhada com Cloud API Meta
- Ideal para alto volume
- Sandbox gratis

### Contras
- **API pura** -- zero interface visual, zero chatbot, zero inbox
- Mensalidade fixa mesmo com volume zero
- Integracao com N8N requer trabalho manual
- Suporte basico no plano Regular
- Precisa construir TUDO por conta propria (ou usar com N8N/ferramentas externas)

> **Fonte**: [360dialog Pricing](https://360dialog.com/pricing) | [360dialog Docs](https://docs.360dialog.com/docs) | [SendZen - 360dialog Guide](https://www.sendzen.io/360dialog-whatsapp-pricing)

---

## 7. MessageBird (Bird)

### Overview
CPaaS holandes (rebrand para "Bird" em 2023, merger com Sinch em andamento). Plataforma omnichannel com Flow Builder visual. Oferece WhatsApp, SMS, Email, Voice, Instagram, Messenger.

### Modelo de Precos
- **Markup Bird**: $0.005/msg (template e session, apenas outbound)
- **+ Taxa Meta**: conforme tabela base
- **Custo total Marketing Brasil**: ~$0.0675/msg
- **Inbox**: 2 seats gratis, $30/seat adicional/mes
- **Flow Builder**: 1.000 invocacoes gratis/mes
- **Pay-as-you-go**: sem mensalidade fixa para API

### Recursos WhatsApp
- API REST completa para WhatsApp
- **Flow Builder**: automacao visual drag-and-drop
- Inbox omnichannel (WhatsApp + Email + SMS + Messenger)
- Templates management
- Rich media e mensagens interativas
- Analytics e reports
- Integracao com Shopify, Salesforce, etc.

### Qualidade da API/Docs
- **Boa**. Docs em `developers.messagebird.com`
- REST API bem estruturada
- SDKs em varias linguagens
- Em transicao pos-merger com Sinch (docs podem ter inconsistencias)

### Integracao com N8N
- Sem node nativo dedicado para WhatsApp
- HTTP Request node via API REST
- Flow Builder proprio pode substituir/complementar N8N

### Self-hosted vs Cloud
- Cloud only. SaaS.

### Quando escolher
- Quer plataforma omnichannel pronta com Flow Builder visual
- Precisa de inbox multi-canal (WA + Email + SMS)
- Time de marketing quer automacao visual sem codigo
- Budget similar a Twilio mas quer UI mais moderna

### Pros
- Flow Builder visual poderoso (1.000 invocacoes gratis)
- Inbox omnichannel com 2 seats gratis
- Plataforma moderna e bem desenhada
- Omnichannel real (10+ canais)

### Contras
- Markup identico ao Twilio ($0.005/msg)
- Em transicao pos-merger -- incerteza sobre roadmap
- Menos integracao nativa com ecossistema brasileiro
- Documentacao pode estar desatualizada em partes
- Suporte menos responsivo que Twilio

> **Fonte**: [Bird/MessageBird WhatsApp API](https://developers.messagebird.com/api/whatsapp) | [MessageBird Pricing](https://www.smscomparison.com/reviews/messagebird/pricing/)

---

## 8. Make (Integromat)

### Overview
Plataforma de automacao visual (ex-Integromat, rebrand 2022). Concorrente do N8N e Zapier. Foco em workflows visuais com 1.500+ integracoes.

### Modelo de Precos (Ago/2025+: creditos)

| Plano | Preco/mes | Creditos/mes | Cenarios ativos |
|-------|-----------|--------------|-----------------|
| Free | $0 | 1.000 | 2 |
| Core | $9 | 10.000 | Ilimitados |
| Pro | $16 | 10.000 | Ilimitados |
| Teams | $29 | 10.000 | Ilimitados |
| Enterprise | Sob consulta | Custom | Custom |

- **Cada modulo/step = 1 operacao/credito** (diferente do N8N que conta por execucao)
- Workflow de 10 passos rodando 100x = 1.000 creditos
- Creditos extras: ~$0.001-$0.002/credito
- Modulos AI podem consumir mais creditos (variavel)

### Modulos WhatsApp
- **WhatsApp Business Cloud**: modulo nativo oficial
  - Send a Message (free-form dentro da janela 24h)
  - Send a Template Message
  - Download Media
  - Watch Events (trigger de mensagens recebidas)
  - Get Business Profile
  - Register Sender
- **WhatsApp via Wati**: modulo nativo para quem usa Wati como BSP
- **WhatsApp via Twilio**: modulo nativo
- **HTTP Module**: para qualquer BSP com API REST

### Comparacao com N8N

| Aspecto | Make | N8N |
|---------|------|-----|
| Billing | Por operacao/credito | Por execucao (workflow inteiro) |
| Custo workflow 10 steps x 1000 runs | 10.000 creditos | 1.000 execucoes |
| Self-hosting | Nao | Sim (gratis) |
| WhatsApp node | Nativo (Cloud API) | Nativo (Cloud API) |
| AI/LangChain | Basico | Avancado (nativo) |
| Integracao count | 1.500+ | 400+ (mas HTTP cobre tudo) |
| Curva de aprendizado | Baixa | Media |
| Open source | Nao | Sim |

### Quando escolher (vs N8N)
- Time nao-tecnico que quer visual builder sem self-hosting
- Precisa de muitas integracoes nativas prontas
- Volume de automacao baixo-medio (billing por operacao pesa em alto volume)
- Quer setup rapido sem infra propria

### Pros
- Interface visual mais polida que N8N
- Modulo WhatsApp Business Cloud nativo
- 1.500+ integracoes prontas
- Free tier funcional para testes

### Contras
- **Billing por operacao** -- MUITO mais caro que N8N em alto volume
- Sem self-hosting (vendor lock-in)
- AI/agentes menos maduros que N8N
- Closed source
- Workflow de 10 steps custa 10x mais que no N8N

> **Fonte**: [Make WhatsApp Integration](https://www.make.com/en/integrations/whatsapp-business-cloud) | [n8n vs Make Comparison](https://cipherprojects.com/blog/posts/n8n-vs-make-automation-platform-comparison/)

---

## 9. Zapier

### Overview
Maior plataforma de automacao no-code (8.000+ integracoes). Focada em simplicidade extrema -- "if this then that" para business users.

### Modelo de Precos

| Plano | Preco/mes | Tasks/mes |
|-------|-----------|-----------|
| Free | $0 | 100 |
| Starter | $20 | 750 |
| Professional | $49 | 2.000 |
| Team | $69 | 2.000 |
| Enterprise | Custom | Custom |

- **Cada acao = 1 task** (similar ao Make, diferente do N8N)
- WhatsApp Business e **app premium** (requer plano pago)
- Tasks extras cobradas proporcionalmente

### Modulos WhatsApp
- **Triggers**:
  - New Message Received
  - New Message Status Updated (sent, delivered, read, failed)
- **Actions**:
  - Send Freeform Message (apenas dentro janela 24h)
  - Send Template Message
  - Send Media Message (documento, imagem, video, audio)
  - Get Attachment (por media ID)

### Requisitos
- Meta Business Manager account
- WhatsApp Business Account (WABA) com numero registrado
- Plano pago do Zapier (WhatsApp e premium app)

### Comparacao com N8N

| Aspecto | Zapier | N8N |
|---------|--------|-----|
| Billing | Por task | Por execucao |
| Integracoes | 8.000+ | 400+ |
| Self-hosting | Nao | Sim |
| WhatsApp node | Nativo (premium) | Nativo (Cloud API) |
| AI capabilities | AI Actions, NLP workflow | LangChain nativo, agentes |
| Curva aprendizado | Muito baixa | Media |
| Open source | Nao | Sim |
| Preco alto volume | Muito caro | Muito barato (self-hosted) |

### Quando escolher (vs N8N)
- Absolutamente zero conhecimento tecnico no time
- Precisa de integracao com apps obscuros (8.000+ conectores)
- Volume muito baixo de automacoes
- Quer setup em minutos sem pensar em infra

### Pros
- Maior catalogo de integracoes (8.000+)
- Interface mais simples do mercado
- Setup em minutos
- Modulos WhatsApp completos (trigger + actions + media)

### Contras
- **Mais caro** de todas as opcoes para alto volume
- WhatsApp e app premium (plano pago obrigatorio)
- Billing por task -- workflows complexos consomem rapido
- Zero controle sobre infra
- AI menos sofisticada que N8N
- Sem self-hosting

> **Fonte**: [Zapier WhatsApp Business Integration](https://zapier.com/apps/whatsapp-business/integrations) | [Zapier vs Make vs n8n 2026](https://www.digitalapplied.com/blog/zapier-vs-make-vs-n8n-2026-automation-comparison)

---

## 10. Comparativo BSP vs Meta Cloud API Direto

### Meta Cloud API Direto (abordagem atual do Checkup360)

| Aspecto | Detalhe |
|---------|---------|
| **Custo** | Apenas taxa Meta -- zero markup |
| **Setup** | Gratuito (Meta eliminou taxa de setup) |
| **Controle** | Total sobre infra, webhooks, templates |
| **Suporte** | Generico da Meta (sem SLA dedicado) |
| **Template approval** | Direto via Business Manager |
| **Hosting** | Gerenciado pela Meta (Cloud API) |
| **Rate limits** | Padrao Meta (80 msg/s, escalonavel) |
| **On-Premises API** | Descontinuada em Out/2025 |

### Quando BSP faz sentido

| Cenario | BSP recomendado |
|---------|----------------|
| Precisa de team inbox visual | Wati, Zenvia, Bird |
| Quer chatbot no-code | Wati, Zenvia, Gupshup |
| Volume altissimo com suporte dedicado | 360dialog, Gupshup |
| Precisa de omnichannel (SMS + WA + Email) | Twilio, Zenvia, Bird |
| Time 100% nao-tecnico | Wati, Zenvia |
| Quer menor custo possivel | Cloud API direto ou 360dialog |

### Quando ficar com Cloud API direto

- **Ja tem integracao funcionando** (caso do Checkup360 via N8N)
- Time tecnico capaz de manter webhooks, templates, erros
- Volume baixo-medio onde markup de BSP nao se justifica
- Quer zero dependencia de terceiros
- Usa N8N que ja tem node nativo de WhatsApp Cloud API

---

## 11. Matriz Comparativa Geral

### BSPs -- Custo por Mensagem Marketing (Brasil)

| Plataforma | Markup/msg | Custo total/msg | Custo fixo/mes | Modelo |
|------------|-----------|-----------------|----------------|--------|
| **Meta direto** | $0 | $0.0625 | $0 | Pay-as-you-go |
| **360dialog** | $0 | $0.0625 | ~$53 (EUR 49) | Fixo + Meta |
| **Gupshup** | $0.001 | $0.0635 | $0 | Pay-as-you-go |
| **Twilio** | $0.005 | $0.0675 | $0 | Pay-as-you-go |
| **Bird** | $0.005 | $0.0675 | $0 | Pay-as-you-go |
| **Zenvia** | ~$0.0463* | Embutido | $0-$845 | Pacotes |
| **Wati** | ~20% Meta | ~$0.075 | $59-$279 | Plano + markup |

*Zenvia cobra por pacote, nao separa markup claramente.

### Plataformas de Automacao -- Custo para Workflow WA de 10 Steps x 1.000 Runs/mes

| Plataforma | Unidade de billing | Consumo | Custo estimado |
|------------|-------------------|---------|----------------|
| **N8N self-hosted** | Execucao | 1.000 | $0 (infra only) |
| **N8N Cloud** | Execucao | 1.000 | ~$20-50/mes |
| **Make** | Credito/operacao | 10.000 | $9-16/mes |
| **Zapier** | Task | 10.000 | $49-100+/mes |

### Features Comparativas

| Feature | Twilio | Zenvia | Gupshup | Wati | 360dialog | Bird | Make | Zapier |
|---------|--------|--------|---------|------|-----------|------|------|--------|
| WhatsApp API | Sim | Sim | Sim | Sim | Sim | Sim | Via node | Via node |
| Team Inbox | Flex ($) | Sim | Nao | Sim | Nao | Sim | Nao | Nao |
| Chatbot builder | Nao | Sim | Sim | Sim | Nao | Flow | Nao | Nao |
| Broadcast/Campaigns | API | Sim | Sim | Sim | API | Sim | Via workflow | Via workflow |
| SMS | Sim | Sim | Sim | Nao | Nao | Sim | Via node | Via node |
| Email | SendGrid | Sim | Nao | Nao | Nao | Sim | Via node | Via node |
| Voice | Sim | Sim | Nao | Nao | Nao | Sim | Nao | Nao |
| Self-hosted | Nao | Nao | Nao | Nao | Nao* | Nao | Nao | Nao |
| Node N8N nativo | Sim | Nao | Nao | Nao | Nao | Nao | N/A | N/A |
| Zero markup | Nao | Nao | Nao | Nao | **Sim** | Nao | N/A | N/A |
| API docs quality | A+ | B+ | B+ | B | B+ | B+ | B | B |
| Brasil focus | Nao | **Sim** | Parcial | Parcial | Nao | Nao | Nao | Nao |

---

## 12. Recomendacao para Checkup360

### Situacao Atual
- Meta Cloud API direto via N8N (self-hosted)
- Funil WA: landing -> Gemini AI -> R$99 -> RPA/KSI -> upsell
- Operacao enxuta, founder solo, nivel tecnico avancado

### Veredicto: **Manter Cloud API direto + N8N**

**Por que:**

1. **Custo**: Zero markup. Com ~500-2.000 msgs/mes estimadas, o markup de qualquer BSP nao se justifica.

2. **Ja funciona**: Trocar agora adicionaria complexidade sem beneficio claro.

3. **N8N ja tem node nativo**: WhatsApp Business Cloud node cobre send message, send template, receive message, media.

4. **Controle total**: Pipeline de stages com Gemini AI exige flexibilidade que BSPs visuais (Wati, Zenvia) limitariam.

5. **Sem necessidade de team inbox**: Operacao e automatizada por IA, nao por agentes humanos.

### Cenarios onde reconsiderar:

| Se... | Entao considerar... |
|-------|-------------------|
| Contratar time de atendimento humano | **Wati** (team inbox pronto) ou **Zenvia** (suporte BR) |
| Volume passar de 50k msgs/mes | **360dialog** (zero markup, mensalidade fixa baixa) |
| Precisar de SMS + WA unificado | **Twilio** (melhor API) ou **Zenvia** (foco BR) |
| Substituir N8N por no-code | **Make** (melhor custo) -- mas N8N self-hosted e superior |
| Precisar de campanhas em massa com UI | **Gupshup** (Campaign Manager + menor markup) |

### Custo mensal estimado (1.000 msgs Marketing/mes)

| Abordagem | Custo Meta | Custo BSP | Custo infra | Total/mes |
|-----------|-----------|-----------|-------------|-----------|
| **Cloud API + N8N (atual)** | $62.50 | $0 | ~$10-20 (VPS) | ~$72-82 |
| 360dialog + N8N | $62.50 | $53 fixo | ~$10-20 | ~$125-135 |
| Twilio + N8N | $62.50 | $10 ($0.005x2k) | ~$10-20 | ~$82-92 |
| Gupshup + N8N | $62.50 | $2 ($0.001x2k) | ~$10-20 | ~$74-84 |
| Wati | $62.50 | $12.50 (20%) | $59-279 plano | ~$134-354 |
| Zenvia | Embutido | $46.30+ | $0-845 plano | ~$46-891 |

---

## Sources

- [Twilio WhatsApp Pricing](https://www.twilio.com/en-us/whatsapp/pricing)
- [Twilio Pricing Changes July 2025](https://help.twilio.com/articles/30304057900699)
- [Zenvia Pricing](https://www.zenvia.com/en/prices/)
- [Zenvia API Reference](https://zenvia.github.io/)
- [Gupshup WhatsApp Pricing](https://www.gupshup.ai/channels/self-serve/whatsapp/pricing)
- [Gupshup Support - Pricing Model](https://support.gupshup.io/hc/en-us/articles/360012075779)
- [Wati Pricing](https://www.wati.io/pricing/)
- [Chatarmin - Wati Pricing Analysis](https://chatarmin.com/en/blog/wati-pricing)
- [360dialog Pricing](https://360dialog.com/pricing)
- [360dialog Documentation](https://docs.360dialog.com/docs)
- [Bird/MessageBird WhatsApp API](https://developers.messagebird.com/api/whatsapp)
- [Make WhatsApp Integration](https://www.make.com/en/integrations/whatsapp-business-cloud)
- [Zapier WhatsApp Business Integration](https://zapier.com/apps/whatsapp-business/integrations)
- [Meta WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [FlowCall - Brazil WhatsApp Rates 2026](https://www.flowcall.co/blog/whatsapp-business-api-pricing-2026)
- [respond.io - WhatsApp API Pricing 2026](https://respond.io/blog/whatsapp-business-api-pricing)
- [Prelude - Top BSPs 2026](https://prelude.so/blog/best-whatsapp-business-solution-providers)
- [n8n vs Make Comparison](https://cipherprojects.com/blog/posts/n8n-vs-make-automation-platform-comparison/)
- [Zapier vs Make vs n8n 2026](https://www.digitalapplied.com/blog/zapier-vs-make-vs-n8n-2026-automation-comparison)
- [n8n WhatsApp Business Cloud Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.whatsapp/)
