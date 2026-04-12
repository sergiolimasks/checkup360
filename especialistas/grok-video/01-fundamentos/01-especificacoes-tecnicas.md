# Especificações Técnicas — Grok Imagine Video

## Motor e Infraestrutura

- **Engine:** Aurora — arquitetura autorregressiva proprietária da xAI
- **Treinamento:** 110.000 GPUs NVIDIA GB200
- **Abordagem:** Gera frames sequencialmente (não tudo de uma vez), permitindo controle fino sobre coerência temporal e sincronização audio-video
- **Volume:** 1.245 bilhões de vídeos gerados nos últimos 30 dias (março 2026)

---

## Resolução e Formato

| Spec | Valor |
|------|-------|
| **Resolução** | 720p (HD) ou 480p (SD, mais rápido) |
| **FPS** | 24 frames por segundo |
| **Duração** | 1-15 segundos por clip |
| **Aspect Ratios** | 16:9, 9:16, 4:3, 3:4, 2:3, 3:2, 1:1 |
| **Audio** | Nativo — diálogos, SFX, música sincronizados |
| **Tempo de geração** | ~15 segundos para clip padrão |

### Roadmap
- **Imagine 2.0 (previsto final abril 2026):** Resolução nativa 1080p, modo Pro (requer SuperGrok)

---

## Modos de Geração

| Modo | Input | Descrição |
|------|-------|-----------|
| **Text-to-Video** | prompt | Gera vídeo do zero a partir de descrição |
| **Image-to-Video** | prompt + imagem | Anima imagem estática com movimento |
| **Reference-to-Video** | prompt + imagens referência | Usa imagens como guia visual |
| **Edit-Video** | video_url + prompt | Modifica vídeo existente (max 8.7s input) |
| **Extend-Video** | video_url + prompt | Continua a partir do último frame |
| **Multi-Image-to-Video** | até 7 imagens | Combina múltiplas imagens em sequência (lançado 13/mar/2026) |

### Image-to-Video — O Ponto Forte
Grok é **#1 no Artificial Analysis Video Arena** para image-to-video (ELO 1336), superando Sora 2 Pro, Runway Gen-4.5 e Veo 3.1 nesse modo específico.

**Uso estratégico:** Gerar imagem no Gemini/Canva → animar com Grok para manter consistência visual e de marca.

---

## API

### Endpoints

```
POST https://api.x.ai/v1/videos/generations     (gerar)
GET  https://api.x.ai/v1/videos/{request_id}     (checar status)
POST https://api.x.ai/v1/videos/edits             (editar)
POST https://api.x.ai/v1/videos/extensions         (estender)
```

**Response:** Status `pending` → `done` | `expired` | `failed`

**IMPORTANTE:** URLs geradas são temporárias — salvar imediatamente.

### Parâmetros da API

```json
{
  "model": "grok-imagine-video",
  "prompt": "seu prompt aqui",
  "resolution": "720p",
  "aspect_ratio": "9:16",
  "duration": 10
}
```

**CUIDADO:** Se não especificar `resolution: "720p"`, gera em 480p por padrão.

---

## Pricing

| Tier | Preço/mês | Vídeo/dia | Resolução | Notas |
|------|-----------|-----------|-----------|-------|
| **Free** | $0 | 0 (cortado mar/2026) | — | Sem acesso a vídeo |
| **SuperGrok Lite** | $10 | Limitado | 480p, 6s max | Lançado 25/mar/2026 |
| **X Premium** | $8 | ~50 | 720p | Bundled com X |
| **X Premium+** | $40 | ~100 | 720p | Sem ads no X |
| **SuperGrok** | $30 | ~50-100 (soft cap) | 720p | Full suite AI |
| **SuperGrok Heavy** | $300 | ~500 | 720p | Grok 4 Heavy, multi-agent |
| **API** | Pay-per-use | Ilimitado | 720p | $0.05/segundo (~$0.50/clip de 10s) |

**Para uso comercial:** API é a melhor opção — ~$4.20 por minuto de vídeo gerado (~R$25/minuto).

**Soft caps:** SuperGrok anuncia "20x mais" mas o cap real é ~50-100 imagens ou ~10 vídeos por janela de 8h.

---

## Onde Grok Ganha vs Perde

### Ganha
- **Image-to-Video:** #1 no ranking global
- **Velocidade:** ~15s por geração (mais rápido do mercado)
- **Custo API:** $0.05/segundo é competitivo
- **Audio nativo:** Diálogos + SFX + música sincronizados
- **7 aspect ratios:** Cobre todas as plataformas
- **Iteração rápida:** Ideal para produção social media

### Perde
- **Resolução:** 720p vs 1080p dos concorrentes
- **Duração:** Max 15s vs 60s do Sora
- **Consistência multi-shot:** Kling 3.0 mantém personagem entre ângulos
- **Faces/mãos em close:** Ainda com artefatos
- **Texto no vídeo:** Ilegível (adicionar em pós-produção)
- **Extensão:** Qualidade degrada após 2 extensões
