# Grok AI (xAI) Video Generation - Pesquisa Completa

**Data:** 2026-04-09
**Foco:** Video generation para marketing/advertising
**Modelo:** Grok Imagine Video (Aurora Engine)
**Confianca geral:** MEDIUM-HIGH (documentacao oficial + comunidade ativa)

---

## 1. ESPECIFICACOES TECNICAS

### Modelo e Infraestrutura

- **Engine:** Aurora — arquitetura autorregressiva proprietaria da xAI
- **Treinamento:** 110.000 GPUs NVIDIA GB200 (uma das maiores infras de AI video)
- **Modelo API:** `grok-imagine-video`
- **Abordagem:** Gera frames sequencialmente (nao tudo de uma vez), permitindo controle fino sobre coerencia temporal e sincronizacao audio-video

### Resolucao e Formato

| Spec | Valor |
|------|-------|
| **Resolucao** | 720p (HD) ou 480p (SD, mais rapido) |
| **FPS** | 24 frames por segundo |
| **Duracao** | 1-15 segundos por clip |
| **Aspect Ratios** | 16:9, 9:16, 4:3, 3:4, 2:3, 3:2, 1:1 |
| **Audio** | Nativo — dialogos, SFX, musica sincronizados |
| **Tempo de geracao** | ~15 segundos para clip padrao |

### Roadmap

- **Imagine 2.0 (previsto final abril 2026):** Resolucao nativa 1080p, modo Pro (requer SuperGrok)

### Modos de Geracao

| Modo | Input | Descricao |
|------|-------|-----------|
| **Text-to-Video** | prompt | Gera video do zero a partir de descricao |
| **Image-to-Video** | prompt + imagem | Anima imagem estatica com movimento |
| **Reference-to-Video** | prompt + imagens referencia | Usa imagens como guia visual |
| **Edit-Video** | video_url + prompt | Modifica video existente |
| **Extend-Video** | video_url + prompt | Continua a partir do ultimo frame |
| **Multi-Image-to-Video** | ate 7 imagens | Combina multiplas imagens em sequencia (lancado 13/mar/2026) |

### API Endpoints

```
POST https://api.x.ai/v1/videos/generations     (gerar)
GET  https://api.x.ai/v1/videos/{request_id}     (checar status)
POST https://api.x.ai/v1/videos/edits             (editar)
POST https://api.x.ai/v1/videos/extensions         (estender)
```

**Response:** Status `pending` → `done` | `expired` | `failed`
**URLs geradas sao temporarias** — salvar imediatamente.

### Pricing

| Tier | Preco/mes | Video/dia | Resolucao | Notas |
|------|-----------|-----------|-----------|-------|
| **Free** | $0 | 0 (cortado mar/2026) | — | Sem acesso a video |
| **SuperGrok Lite** | $10 | Limitado | 480p, 6s max | Lancado 25/mar/2026 |
| **X Premium** | $8 | ~50 | 720p | Bundled com X |
| **X Premium+** | $40 | ~100 | 720p | Sem ads no X |
| **SuperGrok** | $30 | ~50-100 (soft cap) | 720p | Full suite AI |
| **SuperGrok Heavy** | $300 | ~500 | 720p | Grok 4 Heavy, multi-agent |
| **API** | Pay-per-use | Ilimitado | 720p | $0.05/segundo (~$0.50/clip de 10s) |

**API e a melhor opcao para uso comercial:** ~$4.20 por minuto de video gerado.

Fontes:
- [xAI Official Docs - Video Generation](https://docs.x.ai/developers/model-capabilities/video/generation)
- [GenAIntel - Grok Capabilities 2026](https://www.genaintel.com/guides/grok-xai-video-generation-capabilities-2026)
- [AIVeed - SuperGrok Worth It](https://aiveed.io/blog/supergrok-30-month-still-worth-it-2026)
- [AI Business Weekly - Grok Pricing](https://aibusinessweekly.net/p/grok-ai-pricing)

---

## 2. PROMPT ENGINEERING — ESTRUTURA E TECNICAS

### Formula Principal: 5 Camadas

A comunidade e documentacao convergem nesta estrutura:

```
[CENA/SUJEITO] + [CAMERA/ENQUADRAMENTO] + [ESTILO/ILUMINACAO] + [MOVIMENTO] + [AUDIO]
```

**Regra de ouro:** As primeiras 20-30 palavras sao as mais importantes. Grok prioriza o inicio do prompt.

### Tamanho Ideal de Prompt

- **Videos:** 50-150 palavras (mais curto = mais estavel)
- **Imagens:** 600-700 caracteres
- **Foco:** 1 sujeito + 1 acao + 1 movimento de camera

### Linguagem Natural vs Keywords

Grok responde MUITO melhor a descricoes naturais do que listas de keywords:

**RUIM:** `woman, rain, neon, cinematic, 4K, bokeh, moody`

**BOM:** `Cinematic shot of a woman walking alone on a rainy Paris street at night, neon reflections on wet pavement, moody atmosphere, shallow depth of field, 35mm film look.`

### Verbos Dinamicos vs Estaticos

**EVITAR:** "standing", "sitting", "looking"
**USAR:** "surges", "unfurls", "rushes", "drifts", "emerges", "dissolves"

### Template Universal para Video Marketing

```
[Tipo de shot] of [sujeito] [acao dinamica] in [cenario],
[movimento de camera], [iluminacao/hora do dia],
[estilo visual], [aspecto emocional].
Audio: [descricao sonora]. [aspect ratio].
```

### Dica Crucial: Prompt Assistant

Se voce pedir ao Grok para "criar um prompt detalhado" antes de gerar, ele expande com parametros cinematograficos profissionais (direcao de luz, temperatura de cor, composicao). Use isso para aprender a estrutura ideal.

Fontes:
- [Travis Nicholson - Complete Guide to Prompting Grok](https://travisnicholson.medium.com/the-complete-guide-to-prompting-grok-for-ai-videos-917ed6af1758)
- [GenAIntel - Prompt Guide](https://www.genaintel.com/guides/how-to-prompt-grok-imagine)
- [GrokvVideo - Top Prompts 2026](https://grokvideo.ai/blog/top-grok-video-prompts-2026)

---

## 3. MOVIMENTOS DE CAMERA — REFERENCIA COMPLETA

Grok foi treinado em databases de cinema e responde a terminologia profissional de filmagem.

### 29 Movimentos Testados e Funcionais

#### Movimentos Fisicos (Dolly)
| Movimento | Duracao Ideal | Efeito | Prompt Keyword |
|-----------|---------------|--------|----------------|
| **Dolly In (Push)** | 5s | Tensao, foco crescente | "slow push toward subject" |
| **Dolly Out (Pull)** | 5s | Revela escala/contexto | "camera pulls back revealing..." |
| **Fast Dolly/Rush** | 5s | Choque visual, motion blur | "aggressive push, motion blur" |
| **Dolly Left** | 5s | Parallax forte, 3D space | "side tracking left" |
| **Dolly Right** | 5s | Parallax lateral | "lateral slide right" |

#### Rotacoes
| Movimento | Duracao Ideal | Efeito | Prompt Keyword |
|-----------|---------------|--------|----------------|
| **Pan Left** | 5s | Scan da cena | "pan left revealing..." |
| **Pan Right** | 5s | Seguir acao | "pan right following..." |
| **Tilt Up** | 5s | Escala vertical, grandeza | "tilt up from floor to face" |
| **Tilt Down** | 5s | Descobre sujeito de cima | "camera tilts down through..." |

#### Orbitas
| Movimento | Duracao Ideal | Efeito | Prompt Keyword |
|-----------|---------------|--------|----------------|
| **Orbit 180** | 10s | Luz muda no rosto | "half circle orbit around subject" |
| **Full 360 Spin** | 10s | Cena completa de todos lados | "full 360 rotation around..." |
| **Slow Cinematic Arc** | 10s | Elegante, transicao angular | "slow cinematic arc, wide elegant sweep" |

#### Crane/Jib
| Movimento | Duracao Ideal | Efeito | Prompt Keyword |
|-----------|---------------|--------|----------------|
| **Jib Up** | 10s | Camera sobe, padrao do alto | "camera rises revealing..." |
| **Jib Down** | 10s | Desce do teto, efeito pouso | "camera descends from above" |
| **Crane Over Head** | 10s | Sweep sobre sujeito | "crane shot sweeping over..." |

#### Zoom
| Movimento | Duracao Ideal | Efeito | Prompt Keyword |
|-----------|---------------|--------|----------------|
| **Smooth Zoom In** | 5s | Detalhe limpo, sem parallax | "smooth zoom into..." |
| **Smooth Zoom Out** | 5s | Expande detalhe pra cena completa | "lens widens revealing..." |
| **Crash Zoom** | 5s | Choque instantaneo | "crash zoom, instant violent zoom" |

#### Foco
| Movimento | Duracao Ideal | Efeito | Prompt Keyword |
|-----------|---------------|--------|----------------|
| **Rack Focus** | 10s | Muda foco frente/fundo | "focus shifts from foreground to background" |
| **Fisheye** | 5s | Estetica surreal, bordas curvas | "fisheye 15mm lens, edges curve" |

#### Drone/Aereo
| Movimento | Duracao Ideal | Efeito | Prompt Keyword |
|-----------|---------------|--------|----------------|
| **Drone Flyover** | 10s | Voo sobre locacao | "drone flyover above..." |
| **FPV Drone** | 5s | Voo caotico, primeira pessoa | "FPV drone perspective through..." |
| **Aerial Pullback** | 10s | Revela bloco inteiro | "aerial pullback revealing city" |

#### Macro/Tracking
| Movimento | Duracao Ideal | Efeito | Prompt Keyword |
|-----------|---------------|--------|----------------|
| **Extreme Macro** | 10s | Entra na textura, mundo dentro do mundo | "extreme macro entering surface texture" |
| **Leading Shot** | 10s | Camera recua na velocidade do sujeito | "camera retreats at subject's pace" |
| **Following Shot** | 10s | Segue atras do sujeito | "camera follows behind subject" |
| **Side Tracking** | 10s | Perfil, foreground passa rapido | "side tracking profile shot" |
| **POV Walk** | 5s | Primeira pessoa, handheld | "POV first person handheld walk" |
| **Through Shot** | 5s | Voa por abertura/gap | "camera flies through gap revealing..." |

### Regra para Videos de Marketing

**1 sujeito + 1 acao + 1 movimento de camera por clip.** Nao tente combinar 3+ movimentos no mesmo prompt de 10 segundos.

Fonte: [WP AI LAB - 29 Camera Moves](https://medium.com/@techcriterion/29-camera-moves-that-make-ai-video-look-cinematic-and-how-to-use-them-in-grok-43afbe4548b3)

---

## 4. CONTROLE DE ESTILO E ESTETICA

### Keywords de Iluminacao que Funcionam

| Iluminacao | Efeito | Uso Marketing |
|------------|--------|---------------|
| "soft morning light" | Caloroso, acolhedor | Lifestyle, wellness |
| "golden hour sunlight" | Dourado, romantico | Moda, beleza |
| "harsh noon sun" | Contraste forte | Outdoor, aventura |
| "neon-lit" | Futurista, vibrante | Tech, jovem |
| "candlelight" | Intimo, premium | Luxo, gastronomia |
| "overcast diffused light" | Suave, uniforme | Produto clean |
| "volumetric lighting" | Raios visiveis, dramatico | Hero shots |
| "studio lighting, clean background" | Profissional | Produto e-commerce |
| "backlit silhouette" | Misterioso, artistico | Branding emocional |

### Keywords de Estilo Visual

| Estilo | Keywords | Quando Usar |
|--------|----------|-------------|
| **Cinematico** | "volumetric lighting, film grain, dynamic shadows, anamorphic lens" | Videos premium, branding |
| **Documental** | "photoreal detail, natural lighting, documentary feel" | Depoimentos, bastidores |
| **Anime** | "vibrant cel-shading, expressive linework, bright palette" | Publico jovem, games |
| **Painterly** | "oil-painting texture, impressionist glow, lush brushstrokes" | Arte, premium |
| **Retro** | "1970s color film, VHS grain, faded Polaroid tones" | Nostalgia, vintage |
| **Surreal** | "dreamlike distortion, ethereal glow, otherworldly hues" | Criativo, artistico |
| **Graphic Novel** | "inked outlines, bold contrasts, neon-charged lines" | Jovem, urbano |

### Controle de Camera/Lente

| Referencia | Efeito no Grok |
|------------|----------------|
| "shot on Fujifilm XT4" | Mais direcao que "high quality photo" |
| "35mm film look" | Granulacao cinematica, profundidade |
| "50mm lens feel" | Perspectiva natural, retratos |
| "anamorphic look" | Widescreen cinematico, lens flares |
| "shallow depth of field" | Fundo desfocado, sujeito isolado |
| "deep depth of field" | Tudo em foco, paisagens |
| "high shutter speed" | Acao congelada, nitido |
| "motion blur" | Velocidade, energia |

### Controle Emocional/Atmosferico

**Substituir palavras genericas por atmosfericas:**

| EVITAR | USAR |
|--------|------|
| "happy" | "joyful, radiant, sun-kissed" |
| "sad" | "melancholic, wistful, rain-soaked" |
| "cool" | "electric, neon-charged, pulsing" |
| "scary" | "tense, foreboding, shadow-drenched" |
| "beautiful" | "ethereal, luminous, breathtaking" |

Detalhes como "autumn leaves", "dust motes dancing in light", "steam rising slowly" melhoram drasticamente a qualidade.

Fontes:
- [GenAIntel - Prompt Guide](https://www.genaintel.com/guides/how-to-prompt-grok-imagine)
- [GrokImagineAI - Prompt Guide](https://www.grokimagineai.net/prompt-guide)
- [Filmora - Grok Prompts 2026](https://filmora.wondershare.com/ai-prompt/grok-prompts.html)

---

## 5. PROMPTS PRONTOS — EXEMPLOS REAIS DA COMUNIDADE

### Dialogos Cinematicos

```
Over-the-shoulder shot inside a spaceship. Live-action film. Rich blacks.
Handheld camera. She says calmly: "So let me get this straight. Grok videos
are now 10 seconds, and the audio is improved?" He replies: "Yeah, pretty much."
Audio: quiet engine hum, LED beeps. No music.
```

### Acao Intensa

```
Hyper-fast action sequence. Handheld shaky camera follows a samurai sprinting
forward. Motion blur. Purple lightning effects. Debris flying toward the camera.
High shutter speed. Audio: sword clashes, arcane energy crackle.
```

### Danca Estilizada

```
Dynamic camera movement flying toward a woman performing slow traditional
Japanese dance. Cinematic lighting. Glossy clothing textures. Smooth,
controlled motion throughout. No dialogue. Soft ambient wind sound.
```

### Arquitetonico/Produto

```
Camera rapidly zooms into a small window of the Chrysler Building. Inside
stands an old bearded man in a suit, looking down at the city. Serious tone.
Audio: distant city ambience, no music.
```

### Produto E-Commerce

```
Close-up of smartphone rotating 360 degrees against gradient background,
camera slowly pulls back to reveal context, studio lighting, clean background,
product showcase with dynamic lighting. 16:9.
```

### Brand/Logo

```
Brand logo emerging from particle explosion, dramatic camera zoom from wide
to close-up, brand colors glowing, particles settling into final logo form.
Audio: deep bass hit, shimmer. 16:9.
```

### Lifestyle/Emocional

```
Intimate cinematic close-up of a couple in a tender embrace, soft golden hour
sunlight, dust motes dancing in light, shallow depth of field, warm romantic
mood. Audio: soft piano melody. 16:9.
```

### Simples e Efetivo

```
a woman singing a slow song while playing acoustic guitar, warm lighting,
emotional feel
```

### Natureza/Time-lapse

```
A single flower blooming into a magnificent garden, time-lapse style, soft
morning sunlight, butterflies emerging, gentle camera pull-back. 16:9.
```

### Cyberpunk/Tech

```
A lone figure walking through a rainy cyberpunk alley at night, neon signs
reflecting off wet pavement, holographic interfaces floating around,
slow tracking shot. Audio: rain, distant synth bass. 9:16.
```

### Para Marketing Financeiro (Checkup360)

Baseado nos patterns acima, prompts sugeridos para o nicho financeiro:

```
Close-up of a professional man in his 40s checking his phone, relief washing
over his face as he reads good news. Warm office lighting, shallow depth of
field, slow dolly in. Audio: subtle uplifting ambient music. 9:16.
```

```
Split-screen effect: left side shows messy papers and worried expression,
right side shows organized digital dashboard with green indicators. Camera
slowly pushes in on the right side. Clean studio lighting. 16:9.
```

```
Overhead drone shot slowly descending toward a family celebrating at a dinner
table, warm golden hour light streaming through windows, genuine smiles.
Audio: soft acoustic guitar, laughter. 16:9.
```

Fontes:
- [Travis Nicholson - Complete Guide](https://travisnicholson.medium.com/the-complete-guide-to-prompting-grok-for-ai-videos-917ed6af1758)
- [GrokvVideo - Top Prompts](https://grokvideo.ai/blog/top-grok-video-prompts-2026)
- [PixPretty - 30 Grok Prompts](https://pixpretty.tenorshare.ai/ai-generator/grok-prompts-for-video.html)

---

## 6. ERROS COMUNS E COMO EVITAR

### CRITICOS

| Erro | Problema | Solucao |
|------|----------|---------|
| **Close-up de maos** | Dedos deformados, articulacoes extras | Enquadrar de longe ou ocultar maos |
| **Close-up de rostos** | Artefatos, distorcao facial | Medium shot ou mais distante |
| **Texto legivel no video** | Caracteres sem sentido, ilegivel | NAO incluir texto — adicionar em pos-producao |
| **Cenas com multidoes** | Perda de coerencia, figuras fantasma | Limitar a 1-3 sujeitos |
| **Multiplos movimentos** | Confusao, artefatos de transicao | 1 movimento de camera por clip |

### MODERADOS

| Erro | Problema | Solucao |
|------|----------|---------|
| **Prompt muito longo** | Grok ignora instrucoes finais | 50-150 palavras, frontload o importante |
| **Keywords empilhadas** | Resultados genericos, sem personalidade | Usar frases naturais descritivas |
| **Sem especificar audio** | Grok adiciona musica generica | Sempre incluir `Audio:` no prompt |
| **Estender 3+ vezes** | Qualidade degrada visivelmente | Max 2 extensoes por sequencia |
| **Emocoes genericas** | Video sem personalidade | Trocar "happy" por "radiant, sun-kissed" |
| **Verbos estaticos** | Cena parada, sem vida | Usar verbos dinamicos: surges, unfurls, drifts |

### ARMADILHAS DE PLATAFORMA

| Armadilha | Detalhe |
|-----------|---------|
| **URLs temporarias** | Videos gerados expiram — salvar IMEDIATAMENTE |
| **Soft caps nao documentados** | SuperGrok anuncia "20x mais" mas cap real e ~50-100 imagens ou ~10 videos/8h |
| **Free tier removido** | Desde mar/2026, video requer assinatura paga |
| **Edit video max 8.7s** | Edicao de video existente limitada a 8.7 segundos de input |
| **480p e default na API** | Se nao especificar `resolution: "720p"`, gera em 480p |

### Workflow de Iteracao (Recomendacao da Comunidade)

1. Gerar com prompt simples primeiro
2. Iterar mudando UMA variavel por vez (iluminacao, camera, mood)
3. Velocidade do Grok permite iteracao rapida (~15s por geracao)
4. Usar "Prompt Assistant" do Grok para expandir prompts basicos
5. Salvar prompts que funcionaram — reutilizar como templates

Fontes:
- [Arsturn - Troubleshooting Grok Imagine](https://www.arsturn.com/blog/grok-imagine-how-to-troubleshoot-common-problems-and-errors)
- [Arsturn - Fix Gibberish Output](https://www.arsturn.com/blog/how-to-fix-grok-imagine-gibberish-output)
- [Jack Righteous - Grok 2026 Changes](https://jackrighteous.com/en-us/blogs/ai-art-visuals-creatives/grok-ai-image-video-generation-2026)

---

## 7. COMPARACAO COM CONCORRENTES

### Ranking Geral (abril 2026)

| Ferramenta | Resolucao | Duracao | Audio Nativo | Preco Aprox | Destaque |
|------------|-----------|---------|--------------|-------------|----------|
| **Kling 3.0** | 1080p nativo | 3-15s | Sim | ~$0.10/s | #1 text-to-video, consistencia temporal |
| **Sora 2** | 1080p | Ate 60s | Sim | $200/mes (Plus) | Melhor coerencia narrativa, multi-shot |
| **Grok Imagine** | 720p | 1-15s | Sim | $0.05/s API | #1 image-to-video (ELO 1336), mais rapido |
| **Veo 3.1** | 1080p | Ate 8s | Sim | Via Vertex AI | Audio excelente, Google ecosystem |
| **Runway Gen-4.5** | Ate 4K upscale | 5-16s | Parcial | $12-76/mes | UI mais flexivel, experimentacao |
| **Pika** | 720p-1080p | 3-10s | Parcial | $8-58/mes | Efeitos especiais unicos |

### Onde Grok Ganha

- **Image-to-Video:** #1 no Artificial Analysis Arena (ELO 1336)
- **Velocidade:** ~15 segundos por geracao (mais rapido do mercado)
- **Custo API:** $0.05/segundo e competitivo
- **Audio nativo:** Dialogos + SFX + musica sincronizados
- **Aspect ratios:** 7 opcoes (16:9, 9:16, 1:1, 4:3, 3:4, 2:3, 3:2)
- **Iteracao rapida:** Ideal para social media managers

### Onde Grok Perde

- **Resolucao:** 720p vs 1080p dos concorrentes (1080p previsto abr/2026)
- **Duracao:** Max 15s vs 60s do Sora
- **Consistencia multi-shot:** Kling 3.0 mantem personagem entre angulos
- **Producao profissional:** 720p insuficiente para broadcast/TV
- **Faces/maos em close:** Ainda com artefatos

### Recomendacao por Caso de Uso

| Caso de Uso | Melhor Opcao | Por que |
|-------------|-------------|---------|
| **Social media (9:16)** | **Grok Imagine** | Rapido, barato, 720p suficiente para mobile |
| **Video comercial premium** | Kling 3.0 | 1080p, consistencia entre frames |
| **Narrativa/storytelling** | Sora 2 | Coerencia narrativa, ate 60s |
| **Experimentacao criativa** | Runway | UI flexivel, 4K upscale |
| **Animar imagem existente** | **Grok Imagine** | #1 em image-to-video |
| **Producao com Google** | Veo 3.1 | Integrado com Vertex AI |

Fontes:
- [VO3 AI - Kling vs Sora vs Grok vs Veo3](https://www.vo3ai.com/blog/kling-30-vs-sora-2-vs-grok-imagine-vs-veo3-best-ai-text-to-video-model-for-comme-2026-03-06)
- [WaveSpeedAI - Complete Comparison](https://wavespeed.ai/blog/posts/grok-imagine-video-vs-sora-2-veo-3-seedance-wan-vidu-comparison-2026/)
- [Arsturn - Grok vs Sora vs Veo Reddit Perspective](https://www.arsturn.com/blog/grok-imagine-vs-other-ai-video-tools-a-redditors-perspective)
- [TeamDay - Best AI Video Models 2026](https://www.teamday.ai/blog/best-ai-video-models-2026)

---

## 8. BEST PRACTICES PARA MARKETING/ADVERTISING

### Tipos de Video e Prompts Recomendados

#### Product Showcase (E-Commerce)
```
Close-up of [produto] rotating slowly on a minimalist white surface,
soft studio lighting with subtle reflections, camera slowly orbits 180 degrees,
shallow depth of field. Audio: ambient soft tone, no music. 1:1.
```
**Dica:** Usar image-to-video com foto real do produto para manter fidelidade visual.

#### Lifestyle Scene (Emocional)
```
Cinematic medium shot of a [persona] smiling as they [acao cotidiana positiva],
golden hour sunlight streaming through window, warm color palette, slow dolly in.
Audio: soft acoustic guitar melody. 9:16.
```

#### Testimonial-Style (Depoimento)
```
Over-the-shoulder shot of a professional sitting at a modern desk,
speaking directly to camera with confident expression. Natural office lighting,
shallow depth of field, static tripod. Documentary feel.
Audio: clear voice, subtle room ambience. 16:9.
```

#### Hook Emocional (Primeiros 3 Segundos)
```
Extreme close-up of worried eyes looking at phone screen, harsh cool lighting.
Quick cut to: Same person, relieved smile, warm golden light.
Fast dolly out revealing comfortable living room. 9:16.
```

#### Before/After (Transformacao)
```
Split composition: left half dark and chaotic, right half organized and bright.
Camera slowly tracks from left to right, transitioning from cold blue tones
to warm golden tones. Audio: tension resolving into calm piano. 16:9.
```

### Workflow Recomendado para Producao

1. **Gerar imagem base** com Grok Imagine (ou usar foto real do produto)
2. **Image-to-Video** para animar mantendo fidelidade visual
3. **Iterar** mudando 1 variavel por vez (luz, camera, mood)
4. **Estender** se precisar de mais duracao (max 2 extensoes)
5. **Pos-producao:** Adicionar texto/CTA/logo em editor externo (CapCut, DaVinci)

### Metricas de Performance

- Product demos em video: **80% mais conversao** vs imagens estaticas
- Videos 9:16 para Stories/Reels: formato ideal para mobile
- Primeiros 3 segundos: CRITICOS — usar hook visual forte (crash zoom, contraste emocional)
- Duracao ideal para ads: 6-10 segundos (exatamente o sweet spot do Grok)

### Limitacoes para Marketing Profissional

- **720p nao serve para TV/broadcast** — apenas digital/social
- **Nao confiar em texto no video** — sempre adicionar em pos-producao
- **Rostos podem distorcer** — evitar close-ups extremos de pessoas
- **Sem consistencia de personagem** — cada geracao cria pessoa diferente (usar image-to-video para contornar)
- **Audio generado nao substitui locucao profissional** — usar para ambient/SFX apenas

### Para Checkup360 Especificamente

**Formato ideal:** 9:16 (WhatsApp Status, Instagram Stories/Reels)

**Tipos de video sugeridos:**

1. **Hook de dor:** Close-up de pessoa preocupada olhando contas → transicao para alivio
2. **Transformacao:** Numeros vermelhos no papel → dashboard verde no celular
3. **Lifestyle aspiracional:** Familia feliz em casa confortavel, golden hour
4. **Autoridade/credibilidade:** Profissional em escritorio moderno, iluminacao natural
5. **Urgencia:** Relogio, papeis voando, zoom rapido em tela de celular com solucao

**Aspect ratio:** 9:16 para WA/IG, 1:1 para feed, 16:9 para YouTube

Fontes:
- [TechNomiPro - 100+ Grok Video Prompts](https://www.technomipro.com/grok-ai-video-prompts-2026/)
- [Scenario - Grok Imagine Examples](https://www.scenario.com/blog/grok-imagine-video-examples-90430d1)
- [Filmora - Grok Prompts 2026](https://filmora.wondershare.com/ai-prompt/grok-prompts.html)

---

## 9. TIPS DA COMUNIDADE (Reddit, X, Forums)

### r/grok (45.000+ membros)

- **Iteracao rapida e a chave:** Mudar uma palavra, trocar ordem, adicionar detalhe. Grok gera em ~15s, entao itere sem medo.
- **Aurora para imagens ficou generico:** Comunidade critica Aurora para imagens como "safe-looking" e generico, mas para VIDEO a recepcao e positiva.
- **Image-to-video e o ponto forte:** Consenso de que Grok domina image-to-video, superior a Sora e Kling nesse modo especifico.
- **Extensao de video:** Funcional ate 2 extensoes, depois qualidade cai visivelmente — "don't plan a 60-second sequence on Extend".
- **Multi-image (ate 7 imagens):** Lancado 13/mar/2026, permite criar sequencia coesa a partir de multiplas imagens com controle de consistencia de personagem.

### Dicas Praticas da Comunidade

1. **Especificar "no music" se nao quiser musica** — Grok adiciona musica generica por padrao
2. **"Shot on [camera model]"** funciona melhor que descricoes genericas de qualidade
3. **Descricoes de clima/hora** melhoram drasticamente: "at dusk", "heavy rain", "fog drifting"
4. **Para audio:** especificar tom de voz: "calm, tired voice" — Grok gera dialogos com emocao
5. **Manter cena simples para video:** Cenas complexas com multidoes perdem coerencia
6. **Usar aspect ratio adequado ao destino:** 9:16 para mobile, 16:9 para desktop/YouTube

### Volume de Uso (indicador de adocao)

- **1.245 bilhoes de videos** gerados nos ultimos 30 dias (marco 2026)
- Plataforma massivamente adotada para conteudo social

Fontes:
- [AI Tool Discovery - Grok Reddit Analysis](https://www.aitooldiscovery.com/guides/grok-reddit)
- [Basenor - Grok Extend Videos](https://www.basenor.com/blogs/news/grok-can-now-extend-ai-videos-what-it-means-for-you)
- [Basenor - Multi-Image to Video](https://www.basenor.com/blogs/news/grok-imagine-now-lets-you-build-videos-from-7-images)

---

## 10. CHEAT SHEET RAPIDO

### Prompt Template Marketing (Copiar e Adaptar)

```
[SHOT TYPE] of [SUBJECT doing ACTION] in [SETTING],
[CAMERA MOVEMENT], [LIGHTING/TIME],
[VISUAL STYLE], [EMOTIONAL TONE].
Audio: [SOUND DESCRIPTION]. [ASPECT RATIO].
```

### Keywords que Sempre Melhoram Resultado

**Camera:** cinematic shot, slow dolly in, tracking shot, shallow depth of field
**Luz:** golden hour, soft morning light, volumetric lighting, studio lighting
**Estilo:** film grain, 35mm film look, documentary feel, photoreal detail
**Emocao:** nostalgic, electric, serene, tense, dreamlike
**Audio:** soft piano melody, ambient hum, no music, distant city ambience

### Keywords a EVITAR

- Adjetivos vagos: "beautiful", "amazing", "cool", "nice"
- Verbos estaticos: "standing", "sitting", "looking"
- Listas de tags separadas por virgula (usar frases naturais)
- Pedidos de texto legivel no video
- Descricoes de cenas extremamente complexas

### Aspect Ratios por Destino

| Destino | Ratio | Resolucao |
|---------|-------|-----------|
| WhatsApp Status | 9:16 | 720p |
| Instagram Reels | 9:16 | 720p |
| Instagram Feed | 1:1 | 720p |
| YouTube | 16:9 | 720p |
| TikTok | 9:16 | 720p |
| Facebook Feed | 16:9 ou 1:1 | 720p |
| Apresentacao | 16:9 | 720p |
| E-commerce thumbnail | 1:1 | 720p |
