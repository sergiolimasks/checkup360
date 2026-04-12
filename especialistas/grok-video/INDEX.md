# Especialista: Grok Video (xAI) — Geração de Vídeo com IA

**Ferramenta:** Grok Imagine Video (motor Aurora)
**Uso:** Produção de vídeos curtos para Meta Ads, WhatsApp Status, Instagram Reels
**Produto alvo:** Checkup360 — Consulta CPF R$99

---

## Índice da Base de Conhecimento

### 01 — Fundamentos
- [01-especificacoes-tecnicas.md](01-fundamentos/01-especificacoes-tecnicas.md) — Motor Aurora, resolução, duração, modos, API, pricing
- [02-estrutura-de-prompt.md](01-fundamentos/02-estrutura-de-prompt.md) — Fórmula 5 camadas, templates, regras de ouro, tamanho ideal
- [03-erros-comuns-e-fixes.md](01-fundamentos/03-erros-comuns-e-fixes.md) — Armadilhas, artefatos, limitações, workflow de iteração

### 02 — Cinematografia
- [04-movimentos-de-camera.md](02-cinematografia/04-movimentos-de-camera.md) — 42+ movimentos com keywords exatas: dolly, pan, orbit, crane, zoom, drone, tracking
- [05-iluminacao-e-atmosfera.md](02-cinematografia/05-iluminacao-e-atmosfera.md) — 27 estilos de luz, temperatura de cor, combinações para ads
- [06-movimento-e-acao.md](02-cinematografia/06-movimento-e-acao.md) — Verbos dinâmicos, slow motion, time-lapse, transições, emotion tokens

### 03 — Estilo e Controle Visual
- [07-estilos-visuais.md](03-estilo/07-estilos-visuais.md) — Cinematico, documental, retro, cyberpunk, referências de lente/câmera
- [08-aspect-ratios-e-composicao.md](03-estilo/08-aspect-ratios-e-composicao.md) — 7 ratios, composição por plataforma, regra dos terços
- [09-texto-e-tipografia.md](03-estilo/09-texto-e-tipografia.md) — Limitações, workarounds, workflow híbrido, espaço para overlay

### 04 — Marketing e Ads
- [10-prompts-prontos-marketing.md](04-marketing/10-prompts-prontos-marketing.md) — Templates copy-paste: produto, lifestyle, depoimento, hook, before/after
- [11-narrativas-10-segundos.md](04-marketing/11-narrativas-10-segundos.md) — 5 narrativas CC360, micro-arco dramático, hooks emocionais, CTAs
- [12-compliance-meta-ads.md](04-marketing/12-compliance-meta-ads.md) — Special Ad Category, linguagem segura vs perigosa, checklist

### 05 — Produção
- [13-pipeline-producao.md](05-producao/13-pipeline-producao.md) — Workflow completo: briefing → geração → upscale → edição → exportação
- [14-comparativo-ferramentas.md](05-producao/14-comparativo-ferramentas.md) — Grok vs Kling vs Sora vs Runway vs Pika, quando usar cada um

### Receita Aplicada
- [PROMPTS-CC360.md](PROMPTS-CC360.md) — Prompts finais prontos para uso no Grok para o Checkup360

---

## Resumo Rápido

| Spec | Valor |
|------|-------|
| Motor | Aurora (autorregressivo) |
| Resolução | 720p (1080p previsto abr/2026) |
| Duração | 1-15 segundos |
| FPS | 24 |
| Aspect Ratios | 16:9, 9:16, 1:1, 4:3, 3:4, 2:3, 3:2 |
| Audio | Nativo (diálogos, SFX, música) |
| Velocidade | ~15s por geração |
| API | $0.05/segundo (~$0.50 por clip de 10s) |
| Ponto forte | #1 em image-to-video (ELO 1336) |
| Ponto fraco | 720p, texto ilegível, faces/mãos em close |

## Fórmula do Prompt

```
[CENA/SUJEITO] + [CÂMERA/ENQUADRAMENTO] + [ESTILO/ILUMINAÇÃO] + [MOVIMENTO] + [AUDIO]
```

Primeiras 20-30 palavras = mais importantes. Total: 50-150 palavras. Sempre em inglês.
