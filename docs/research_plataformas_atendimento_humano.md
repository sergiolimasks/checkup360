# Pesquisa: Plataformas de Atendimento Humano para Checkup360

> Pesquisa realizada em abril/2026 para o projeto Checkup360 (SaaS brasileiro, funil via WhatsApp).

---

## Indice

1. [Zendesk](#1-zendesk)
2. [Intercom](#2-intercom)
3. [Freshdesk / Freshchat](#3-freshdesk--freshchat)
4. [HubSpot Service Hub](#4-hubspot-service-hub)
5. [Crisp](#5-crisp)
6. [JivoChat](#6-jivochat)
7. [Tawk.to](#7-tawkto)
8. [Rocket.Chat](#8-rocketchat)
9. [Tidio](#9-tidio)
10. [LiveAgent](#10-liveagent)
11. [BONUS: Chatwoot](#11-bonus-chatwoot)
12. [Tabela Comparativa](#tabela-comparativa)
13. [Recomendacao para Checkup360](#recomendacao-para-checkup360)

---

## 1. Zendesk

### Visao Geral
Plataforma enterprise de suporte ao cliente com ticketing, live chat, base de conhecimento, automacao e reporting avancado. Lider de mercado global.

### Precos (por agente/mes, cobranca anual)
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Suite Team | US$55/agente/mes | Messaging (WhatsApp incluso), IA basica, inbox unificado |
| Suite Growth | US$89/agente/mes | Formularios de ticket, SLA, portal self-service |
| Suite Professional | US$115/agente/mes | CSAT surveys, skills-based routing, analytics avancado |
| Suite Enterprise | US$169/agente/mes | Custom roles, sandbox, SSO avancado |

### Integracao WhatsApp
- **Metodo**: Nativo via WhatsApp Business API (integrado no Sunshine Conversations)
- **Disponivel a partir de**: Suite Team (todos os planos)
- **Funcionalidades**: Envio/recebimento de midia rica (imagens, videos, docs), quick reply buttons, templates de mensagem
- **Custo extra**: Custos da Meta por conversa (cobrados separadamente)

### API
- REST API completa para tickets, usuarios, organizacoes, webhooks
- Webhooks com triggers e automacoes (HTTP requests automaticos por evento)
- Autenticacao via API key, basic auth ou bearer token
- Rate limits variam por plano

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud.

### Pros para Checkup360
- Plataforma madura e robusta
- WhatsApp nativo em todos os planos
- API e webhooks poderosos para integrar com pipeline existente
- Automacoes avancadas (triggers, macros, SLA)
- Reporting detalhado

### Contras para Checkup360
- **Preco elevado**: minimo ~R$280/agente/mes (Suite Team) -- caro para operacao enxuta
- Complexidade excessiva para equipe pequena
- Sem self-hosted
- Cobrado em USD

---

## 2. Intercom

### Visao Geral
Plataforma de messaging para clientes com foco em conversas, bots de IA (Fin), inbox unificado, help center e product tours. Muito usado por SaaS.

### Precos (por seat/mes, cobranca anual)
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Essential | US$29/seat/mes | Messenger, Fin AI, inbox compartilhado, reports basicos |
| Advanced | US$85/seat/mes | Workflow builder, multiplos inboxes, round robin, help center multilingual |
| Expert | US$132/seat/mes | SSO, HIPAA, SLA compliance, multi-brand |

**Fin AI Agent**: US$0,99 por resolucao (paga apenas por resultado entregue)

### Integracao WhatsApp
- **Metodo**: Nativo via WhatsApp Business API (configurado em Settings > Channels > WhatsApp)
- **Limitacoes**: Maximo 2 numeros conectados, nao suporta templates com headers
- **Nao e possivel** iniciar conversa WhatsApp via REST API (apenas responder)
- **Custo**: Meta cobra por conversa (inbound vs outbound tem precos diferentes)

### API
- REST API para conversas, contatos, tags, notas
- Limitacao importante: nao e possivel iniciar conversa WhatsApp via API
- Webhooks disponiveis para eventos

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud.

### Pros para Checkup360
- UX moderna e intuitiva
- Fin AI com cobranca por resultado (excelente custo-beneficio se funcionar bem)
- Bom para SaaS
- Inbox unificado com WhatsApp

### Contras para Checkup360
- Limitacao de 2 numeros WhatsApp
- Nao inicia conversa WhatsApp via API (problema para fluxo proativo)
- Preco escala rapido com mais seats
- Sem self-hosted
- Cobrado em USD

---

## 3. Freshdesk / Freshchat

### Visao Geral
Suite da Freshworks com help desk (Freshdesk) e chat em tempo real (Freshchat). Concorrente direto do Zendesk com precos mais acessiveis. Freddy AI para automacao.

### Precos Freshchat (por agente/mes, cobranca anual)
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Free | US$0 (ate 10 agentes) | Chat basico, sem WhatsApp |
| Growth | US$19/agente/mes | WhatsApp, Instagram, FB Messenger, 500 sessoes Freddy AI gratis/mes |
| Pro | US$49/agente/mes | IntelliAssign, SLA, reports avancados |
| Enterprise | US$79/agente/mes | Custom bots, audit log, skill-based routing |

### Precos Freshdesk (ticketing)
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Free | US$0 (ate 2 agentes) | Email + social ticketing basico |
| Growth | US$15/agente/mes | Automacao, SLA, marketplace |
| Pro | US$49/agente/mes | Round robin, CSAT, reports custom |
| Enterprise | US$79/agente/mes | Skill-based routing, audit log |

**Freddy AI**: US$100 por 1.000 sessoes (Agent) + US$29/agente/mes (Copilot)

### Integracao WhatsApp
- **Metodo**: WhatsApp Business API integrado nativamente no Freshchat
- **Disponivel a partir de**: Growth (US$19/agente)
- **Custos Meta**: Cobrados separadamente por conversa de 24h, com possivel service charge da Freshworks

### API
- REST API completa para tickets, contatos, conversas
- Webhooks em automation rules
- Rate limits maiores em planos superiores

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud.

### Pros para Checkup360
- **Melhor custo-beneficio entre os enterprise**: Growth a US$19/agente com WhatsApp incluso
- Plano gratuito do Freshdesk para ate 2 agentes
- Freddy AI com 500 sessoes gratis no Growth
- Omnichannel completo (WhatsApp, Instagram, FB, email)
- Interface intuitiva

### Contras para Checkup360
- Freshchat e Freshdesk sao produtos separados (pode confundir)
- Freddy AI tem custo adicional significativo em escala
- Sem self-hosted
- Cobrado em USD

---

## 4. HubSpot Service Hub

### Visao Geral
Hub de atendimento integrado ao CRM da HubSpot. Ticketing, live chat, base de conhecimento, pesquisas de satisfacao. Forte integracao com Marketing e Sales Hubs.

### Precos (por seat/mes, cobranca anual)
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Free Tools | US$0 (ate 2 usuarios) | CRM basico, live chat, ticketing limitado |
| Starter | US$15/seat/mes | Pipelines de tickets, automacao simples, 1.000 msgs WhatsApp/mes |
| Professional | US$90/seat/mes + US$1.500 onboarding | Knowledge base, CSAT, SLA, workflows |
| Enterprise | US$150/seat/mes + US$3.500 onboarding | Custom objects, SSO, playbooks |

**WhatsApp extra**: US$70 por 1.000 conversas alem do incluso.

### Integracao WhatsApp
- **Metodo**: Nativo via WhatsApp Business API
- **Funcionalidades**: Enviar/receber mensagens no inbox compartilhado, automacao via workflows
- **Incluso**: 1.000 mensagens/mes (Starter+)
- **Excedente**: US$70/1.000 conversas

### API
- REST API robusta (parte do ecossistema HubSpot)
- Webhooks via workflows
- Integracao nativa com Marketing Hub e Sales Hub

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud.

### Pros para Checkup360
- **CRM integrado** -- leads, marketing e atendimento num so lugar
- Plano gratuito funcional para comecar
- Starter acessivel (US$15/seat)
- Ecossistema completo (marketing, vendas, atendimento)

### Contras para Checkup360
- **Onboarding fees absurdas**: US$1.500 (Pro) e US$3.500 (Enterprise)
- WhatsApp limitado a 1.000 msgs/mes no Starter
- Excedente WhatsApp caro (US$70/1.000 conversas)
- Complexidade do ecossistema HubSpot para equipe solo
- Cobrado em USD

---

## 5. Crisp

### Visao Geral
Plataforma all-in-one de messaging com live chat, chatbot, inbox compartilhado, base de conhecimento e CRM leve. Popular entre startups e PMEs europeias.

### Precos (por workspace/mes, inclui agentes fixos)
| Plano | Preco | Agentes Inclusos | Destaques |
|-------|-------|-------------------|-----------|
| Free | EUR 0 | 2 | Chat widget basico |
| Mini | EUR 45/mes | 4 | WhatsApp, Instagram, email, chatbot basico |
| Essentials | EUR 95/mes | 10 | MagicReply AI, audio/video calls, analytics |
| Plus | EUR 295/mes | 20 (+EUR 10/extra) | Automacao avancada, dedicated support |

### Integracao WhatsApp
- **Metodo**: WhatsApp Business API integrado nativamente
- **Disponivel a partir de**: Mini (EUR 45/mes)
- **Sem custo extra** da Crisp para WhatsApp (custos Meta separados)
- Inbox unificado com todos os canais

### MagicReply AI
- IA para sugerir respostas rapidas baseadas na base de conhecimento
- Funcionalidades limitadas: nao redige emails completos, "Predict" frequentemente impreciso
- Modos "Friendly" e "Formal" apenas reformulam sem personalizar

### API
- REST API e webhooks disponiveis
- SDK para JavaScript, iOS, Android

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud. Para self-hosted, alternativas open-source como Chatwoot sao recomendadas.

### Pros para Checkup360
- **Preco por workspace, nao por agente** -- otimo para equipes que crescem
- Mini a EUR 45/mes com 4 agentes e WhatsApp incluso
- Interface limpa e moderna
- Bom custo-beneficio para PME

### Contras para Checkup360
- MagicReply AI ainda fraco
- Sem self-hosted
- Cobrado em EUR
- Menos automacoes avancadas que Zendesk/Freshdesk

---

## 6. JivoChat

### Visao Geral
Plataforma de chat muito popular no Brasil, com presenca forte no mercado latino-americano. Suporta live chat, WhatsApp, Instagram, Telegram, Facebook e telefone. Interface em portugues.

### Precos (em BRL, por operador/mes)
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Gratuito | R$0 (ate 5 operadores) | Chat basico, 1 canal |
| Profissional (anual) | R$49/operador/mes | WhatsApp, Instagram, Telegram, FB, telefone, CRM basico |
| Profissional (trimestral) | R$63/operador/mes | Mesmo acima |
| Profissional (mensal) | R$69/operador/mes | Mesmo acima |

### WhatsApp -- Custos de Mensagem
- Via WhatsApp Cloud API (direto com Meta, sem intermediarios)
- **Avulso**: US$0,005/mensagem na sessao de chat
- **Modelo de Mensagem (template)**: US$0,0523/template
- **Pacote**: US$50/mes com 15.000 mensagens/mes

### Integracao WhatsApp
- **Metodo**: WhatsApp Cloud API nativo (sem intermediarios como 360dialog)
- Pagamento de trafego direto para Meta
- Inbox unificado com todos os canais

### API
- API disponivel para integracao com sistemas externos
- Webhooks para eventos de chat
- SDK para JavaScript

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud.

### Pros para Checkup360
- **Cobra em BRL** -- sem exposicao cambial
- Muito popular no Brasil, suporte em portugues
- Plano gratuito generoso (5 operadores)
- WhatsApp Cloud API nativo (sem intermediarios)
- Preco competitivo: R$49/operador/mes
- Integracao com Nuvemshop, Loja Integrada e e-commerces BR

### Contras para Checkup360
- Automacoes menos avancadas que Zendesk/Intercom
- IA limitada comparada a concorrentes
- Sem self-hosted
- Reports menos robustos

---

## 7. Tawk.to

### Visao Geral
Solucao de live chat 100% gratuita com ticketing, base de conhecimento e CRM basico. Monetiza via add-ons e servicos de atendimento humano terceirizado.

### Precos
| Item | Preco |
|------|-------|
| Plataforma completa | **Gratis** (agentes ilimitados, chats ilimitados) |
| Remover branding | US$29/mes |
| AI Assist Growth | US$29/mes (1.000 msgs IA/mes) |
| AI Assist Business | US$99/mes (5.000 msgs IA/mes) |
| AI Assist Enterprise | US$399/mes (20.000 msgs IA/mes) |
| Hired Agents | US$1/hora (atendentes humanos terceirizados) |

### Integracao WhatsApp
- **NAO TEM integracao nativa com WhatsApp**
- Apenas chat de website, sem canais sociais nativos
- Possivel via Zapier/integradores terceiros (limitado)

### API
- JavaScript API para customizar widget
- REST API para chats e tickets
- Webhooks basicos

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud.

### Pros para Checkup360
- **Totalmente gratis** para chat de website
- Agentes ilimitados
- AI Assist acessivel (a partir de US$29/mes)
- Bom para comecar sem custo

### Contras para Checkup360
- **SEM WhatsApp nativo** -- dealbreaker para Checkup360
- Apenas chat de website
- Interface datada
- Sem omnichannel real
- Sem self-hosted

---

## 8. Rocket.Chat

### Visao Geral
Plataforma open-source de comunicacao em equipe com funcionalidades omnichannel para atendimento ao cliente. Escrita em TypeScript/Node.js com MongoDB. Deploy via Docker, Kubernetes ou servidor convencional.

### Precos
| Plano | Preco | Limites |
|-------|-------|---------|
| Starter (self-managed) | **Gratis** | 50 usuarios, 100 contatos omnichannel/mes |
| Pro | Sob consulta | Acima dos limites do Starter |
| Enterprise | Sob consulta | Funcionalidades enterprise |
| Managed (Elestio) | A partir de US$14/mes | Instancia gerenciada |

### Integracao WhatsApp
- **Metodo**: Via apps do Marketplace (360dialog, Twilio, ou WhatsApp Cloud API)
- Omnichannel: Instagram, WhatsApp, email, SMS no inbox unificado
- Configuracao mais complexa que solucoes SaaS

### API
- REST API completa
- Realtime API (WebSocket)
- Webhooks para integracao
- SDK disponivel

### Self-Hosted
- **SIM** -- open-source (MIT License)
- Docker, Kubernetes, instalacao manual
- MongoDB como banco de dados
- Starter gratuito para ate 50 usuarios

### Pros para Checkup360
- **Self-hosted gratis** -- controle total dos dados
- Open-source com comunidade ativa
- Omnichannel com WhatsApp
- Deploy via Docker (ja familiar na infra Checkup360)
- Sem custo por agente no self-hosted

### Contras para Checkup360
- **Foco principal e chat interno de equipe**, nao atendimento ao cliente
- Omnichannel menos polido que Chatwoot
- Limite de 100 contatos omnichannel/mes no Starter
- Configuracao WhatsApp mais complexa
- Requer manutencao DevOps

---

## 9. Tidio

### Visao Geral
Plataforma de live chat com chatbot visual e IA (Lyro). Forte integracao com e-commerce (Shopify, WordPress). Multichannel com WhatsApp, Instagram, Messenger.

### Precos (por mes, cobranca anual)
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Free | US$0 | 50 conversas/mes, chat basico |
| Starter | US$24/mes | 100 conversas/mes, analytics basico |
| Growth | US$59/mes | 250 conversas, integracao WhatsApp, automacoes |
| Plus | ~US$749/mes | ~5.000 conversas, custom quotas, premium support |
| Lyro AI | US$39/mes (add-on) | 50 conversas IA/mes |

### Integracao WhatsApp
- **Metodo**: WhatsApp Business API nativo
- **Disponivel a partir de**: Growth (US$59/mes)
- Custos Meta por conversa cobrados separadamente
- Inbox unificado com chat, email, Instagram, Messenger

### Lyro AI
- Resolve ate 67% das perguntas automaticamente
- Machine learning baseado na sua base de conhecimento
- A partir de US$39/mes para 50 conversas IA

### API
- REST API disponivel
- Webhooks para eventos
- SDK JavaScript

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud.

### Pros para Checkup360
- Lyro AI com boa taxa de resolucao automatica
- Plano gratuito para comecar
- Boa integracao com e-commerce
- Interface intuitiva

### Contras para Checkup360
- **Caro em escala**: Plus a US$749/mes
- WhatsApp so a partir do Growth (US$59/mes)
- Cobranca por conversa, nao por agente -- pode encarecer rapido
- Foco em e-commerce, menos adequado para SaaS B2C
- Sem self-hosted
- Cobrado em USD

---

## 10. LiveAgent

### Visao Geral
Help desk com live chat, ticketing, call center e omnichannel. 175+ funcionalidades e 200+ integracoes. Boa opcao intermediaria.

### Precos (por agente/mes, cobranca anual)
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Small Business | US$15/agente/mes | 1 conta email, 1 botao chat, ticketing |
| Medium Business | US$29/agente/mes | WhatsApp, call center, feedback |
| Large Business | US$49/agente/mes | Todos os canais, automacoes avancadas, reports |
| Enterprise | US$69/agente/mes | Senior account manager, priority support, custom billing |

### Integracao WhatsApp
- **Metodo**: WhatsApp Business API integrado nativamente
- **Disponivel a partir de**: Medium Business (US$29/agente/mes)
- Conversas WhatsApp viram tickets no help desk
- Trial gratuito de 30 dias com WhatsApp incluso

### API
- REST API para tickets, agentes, tags
- Webhooks e automacoes

### Self-Hosted
- **Nao disponivel**. Apenas SaaS cloud.

### Pros para Checkup360
- Preco intermediario acessivel
- WhatsApp a partir de US$29/agente
- 175+ funcionalidades em um dashboard
- Trial de 30 dias gratis
- Boa relacao recursos/preco

### Contras para Checkup360
- Interface menos moderna que concorrentes
- Menos conhecido no Brasil
- Sem self-hosted
- IA menos avancada
- Cobrado em USD

---

## 11. BONUS: Chatwoot

> Surgiu como forte alternativa open-source durante a pesquisa, especialmente relevante para Checkup360.

### Visao Geral
Plataforma open-source (MIT License) de customer engagement com inbox unificado, live chat, WhatsApp, Facebook, Instagram, Twitter, email, SMS. Considerada a melhor alternativa open-source ao Intercom.

### Precos
| Plano | Preco | Destaques |
|-------|-------|-----------|
| Community (self-hosted) | **Gratis** | Open-source, sem limite de agentes, sem funcionalidades premium |
| Self-Hosted Starter | US$19/agente/mes | Suporte oficial, funcionalidades premium |
| Self-Hosted Business | US$39/agente/mes | Funcionalidades avancadas |
| Self-Hosted Enterprise | US$99/agente/mes | Todas as funcionalidades |
| Cloud (gerenciado) | A partir de US$19/agente/mes | SaaS gerenciado pela Chatwoot |
| Managed (Elestio) | A partir de US$14/mes | Instancia gerenciada terceirizada |

### Integracao WhatsApp
- **Metodo**: WhatsApp Business API (via 360dialog, Twilio, ou WhatsApp Cloud API)
- Disponivel nos planos pagos (self-hosted ou cloud)
- Custos Meta por conversa separados
- Inbox unificado com todos os canais

### API
- REST API completa
- Webhooks poderosos
- SDKs para JavaScript, Ruby
- Documentacao excelente

### Self-Hosted
- **SIM** -- open-source (MIT License)
- Docker, Kubernetes, Caprover, Heroku
- Controle total dos dados
- Community edition gratuita

### Pros para Checkup360
- **Self-hosted gratis** com Docker (ja na infra do projeto)
- **Melhor omnichannel open-source** do mercado
- WhatsApp, Instagram, Telegram, email, live chat
- API e webhooks robustos para integrar com pipeline Gemini/RPA
- Sem limite de agentes na community edition
- Comunidade ativa e crescente

### Contras para Checkup360
- Requer manutencao DevOps (servidor, updates, backups)
- Community edition sem funcionalidades premium
- IA nativa limitada (precisa integrar externamente)
- Suporte oficial apenas nos planos pagos

---

## Tabela Comparativa

| Plataforma | Menor Preco c/ WhatsApp | Modelo de Cobranca | WhatsApp Nativo | Self-Hosted | IA Inclusa | Moeda | API Robusta |
|------------|------------------------|-------------------|-----------------|-------------|------------|-------|-------------|
| **Zendesk** | US$55/agente/mes | Por agente | Sim | Nao | Basica (avancada paga) | USD | Sim |
| **Intercom** | US$29/seat/mes | Por seat + por resolucao | Sim (max 2 numeros) | Nao | Fin (US$0,99/resolucao) | USD | Sim (limitada p/ WA) |
| **Freshchat** | US$19/agente/mes | Por agente | Sim | Nao | Freddy (500 gratis/mes) | USD | Sim |
| **HubSpot** | US$15/seat/mes | Por seat | Sim (1k msgs/mes) | Nao | Basica | USD | Sim |
| **Crisp** | EUR 45/workspace/mes | Por workspace (4 agentes) | Sim | Nao | MagicReply (fraca) | EUR | Sim |
| **JivoChat** | R$49/operador/mes | Por operador | Sim (Cloud API) | Nao | Limitada | BRL | Sim |
| **Tawk.to** | Gratis (sem WA) | Gratis + add-ons | **NAO** | Nao | AI Assist (US$29+) | USD | Basica |
| **Rocket.Chat** | Gratis (self-hosted) | Gratis ate 50 users | Sim (via apps) | **SIM** | Nao | USD | Sim |
| **Tidio** | US$59/mes (Growth) | Por conversas | Sim | Nao | Lyro (US$39+) | USD | Sim |
| **LiveAgent** | US$29/agente/mes | Por agente | Sim | Nao | Basica | USD | Sim |
| **Chatwoot** | **Gratis** (self-hosted) | Gratis ou por agente | Sim (via API providers) | **SIM** | Nao (integravel) | USD | Sim |

---

## Recomendacao para Checkup360

### Contexto do Projeto
- Operacao enxuta (founder solo / equipe minima)
- WhatsApp e canal principal
- Pipeline existente: Gemini AI + RPA/KSI
- Infra com Docker (VPS propria com Traefik)
- Orcamento limitado (produto R$99)
- Precisa de API para integrar com fluxo existente

### Ranking por Adequacao

#### 1. Chatwoot (Self-Hosted) -- RECOMENDADO
- **Por que**: Gratis, self-hosted via Docker (ja familiar), omnichannel com WhatsApp, API robusta para integrar com pipeline Gemini. Controle total dos dados (LGPD). Sem custo por agente.
- **Custo estimado**: R$0/mes (apenas custos Meta por conversa WA + VPS que ja existe)
- **Risco**: Manutencao DevOps, sem IA nativa (mas Checkup360 ja tem Gemini)

#### 2. JivoChat -- MELHOR SaaS PARA BR
- **Por que**: Cobra em BRL, popular no Brasil, suporte em portugues, WhatsApp Cloud API nativo, plano gratuito com 5 operadores, R$49/operador no Pro.
- **Custo estimado**: R$0-49/mes (1 operador)
- **Risco**: Automacoes limitadas, IA fraca

#### 3. Freshchat Growth -- MELHOR CUSTO-BENEFICIO SaaS GLOBAL
- **Por que**: US$19/agente com WhatsApp, 500 sessoes Freddy AI gratis/mes, interface moderna, omnichannel completo.
- **Custo estimado**: ~R$100/mes (1 agente)
- **Risco**: Cobrado em USD, Freddy AI custa extra em escala

#### 4. Crisp Mini -- BOA OPCAO EUROPEIA
- **Por que**: EUR 45/mes com 4 agentes e WhatsApp. Preco por workspace (nao por agente) e vantajoso se equipe crescer.
- **Custo estimado**: ~R$260/mes (4 agentes inclusos)
- **Risco**: MagicReply AI fraca, cobrado em EUR

#### 5. HubSpot Starter -- SE JA USAR HUBSPOT
- **Por que**: US$15/seat com CRM integrado, 1.000 msgs WhatsApp/mes. So vale se ja usar ecossistema HubSpot.
- **Custo estimado**: ~R$80/mes (1 seat)
- **Risco**: WhatsApp limitado, excedente caro, onboarding fees nos planos superiores

### Eliminados
- **Zendesk**: Muito caro e complexo para operacao enxuta
- **Intercom**: Limitacao de nao iniciar conversa WA via API, caro
- **Tawk.to**: Sem WhatsApp nativo -- inviavel
- **Rocket.Chat**: Foco em chat interno, omnichannel inferior ao Chatwoot
- **Tidio**: Caro em escala, foco em e-commerce
- **LiveAgent**: Sem diferencial claro para o caso de uso

---

## Fontes

- [Zendesk Pricing](https://www.zendesk.com/pricing/)
- [Zendesk WhatsApp Guide 2026](https://www.eesel.ai/blog/zendesk-whatsapp)
- [Zendesk Pricing Explained 2026](https://helpcrunch.com/blog/zendesk-pricing/)
- [Intercom Pricing](https://www.intercom.com/pricing)
- [Intercom Pricing 2026 Breakdown](https://www.bolddesk.com/blogs/intercom-pricing)
- [Intercom Fin AI Pricing](https://www.featurebase.app/blog/intercom-pricing)
- [Intercom WhatsApp Setup](https://www.intercom.com/help/en/articles/5454490-connect-your-whatsapp-channel)
- [Freshchat Pricing](https://www.freshworks.com/live-chat-software/pricing/)
- [Freshdesk WhatsApp Guide 2026](https://www.eesel.ai/blog/freshdesk-whatsapp-business)
- [Freshdesk Freddy AI Guide 2026](https://myaskai.com/blog/freshdesk-freddy-ai-agent-complete-guide-2026)
- [HubSpot Pricing 2026](https://elefanterevops.com/blog/hubspot-pricing)
- [Crisp Pricing](https://crisp.chat/en/pricing/)
- [Crisp Review 2026](https://hackceleration.com/crisp-review/)
- [JivoChat Precos BR](https://www.jivochat.com.br/precos/)
- [JivoChat Blog Novos Precos](https://www.jivochat.com.br/blog/anuncios-da-jivo/novos-precos-do-jivochat.html)
- [Tawk.to Pricing](https://www.tawk.to/pricing/)
- [Tawk.to AI Assist Billing](https://help.tawk.to/article/how-to-manage-billing-for-ai-assist)
- [Tawk.to Review 2026](https://www.tidio.com/blog/tawk-to-review/)
- [Rocket.Chat Plans](https://docs.rocket.chat/docs/our-plans)
- [Rocket.Chat GitHub](https://github.com/RocketChat/Rocket.Chat)
- [Rocket.Chat vs Chatwoot](https://blog.elest.io/chatwoot-vs-zulip-vs-rocket-chat-which-self-hosted-chat-platform-for-your-team/)
- [Tidio Pricing](https://www.tidio.com/pricing/)
- [Tidio Lyro AI](https://www.tidio.com/ai-agent/)
- [LiveAgent Pricing](https://www.liveagent.com/pricing/)
- [LiveAgent WhatsApp](https://www.liveagent.com/integrations/whatsapp/)
- [Chatwoot Pricing](https://www.chatwoot.com/pricing/)
- [Chatwoot Self-Hosted](https://www.chatwoot.com/pricing/self-hosted-plans/)
- [Chatwoot Deploy](https://www.chatwoot.com/deploy/)
