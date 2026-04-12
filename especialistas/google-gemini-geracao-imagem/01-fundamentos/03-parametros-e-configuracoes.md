# Parametros e Configuracoes do Gemini/Imagen 3

## Controles Disponiveis

O Gemini e **significativamente mais limitado** em parametros que o Stable Diffusion ou Midjourney. Nao existe sintaxe inline como `--ar 16:9` ou `--stylize`.

---

## Aspect Ratio (Proporcao)

### No ImageFX
Opcoes na interface: 1:1, 16:9, 9:16, 4:3, 3:4

### No Gemini Chat
Especificar no prompt (nem sempre e respeitado):
- `"wide cinematic frame"` → landscape
- `"tall portrait format"` → retrato vertical
- `"square format composition"` → 1:1
- `"in 16:9 aspect ratio"` → widescreen

### Via API (Vertex AI)
Parametro `aspectRatio` — valores: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`

### Para Meta Ads
| Placement | Proporcao | Resolucao |
|---|---|---|
| Feed Facebook | 1:1 | 1080 x 1080 px |
| Feed Instagram (recomendado) | 4:5 | 1080 x 1350 px |
| Stories/Reels | 9:16 | 1080 x 1920 px |
| Facebook landscape | 1.91:1 | 1200 x 628 px |

---

## Seeds / Reprodutibilidade

- **ImageFX**: Oferece seed values
- **Gemini Chat**: Sem controle direto
- **Mesmo com seed, resultados NAO sao identicos** — sao "sugestoes", nao "coordenadas"

---

## Negative Prompts

**NAO existe** campo de negative prompt separado no Gemini.

### Workaround: Enquadramento Afirmativo
A pesquisa mostra que "para entender 'nao vermelho', o modelo precisa primeiro pensar em vermelho", o que contamina o output.

- **ERRADO:** `"no text, no logos, no red, not cartoonish"`
- **CERTO:** `"clean surfaces without signage, blue and white color palette, photorealistic style"`

Testes em multiplos modelos confirmaram que enquadramento afirmativo venceu ou empatou em TODOS os tipos de restricao.

### Frases que funcionam parcialmente
- `"without any text or watermarks"`
- `"no people in the scene"`
- `"avoid cartoonish style"`
- **Efetividade: inconsistente.** As vezes o modelo faz exatamente o oposto.

---

## Style Presets (ImageFX)

O ImageFX apresenta chips de estilo clicaveis:
- Photorealistic, Sketch, Watercolor, 3D Render, Anime, Oil Painting, etc.

> "Os chips de estilo do ImageFX sao surpreendentemente bons. As vezes transformam um prompt mediocre em algo incrivel com um clique."

---

## Magic Prompt

Funcionalidade que expande/melhora automaticamente seu prompt.

- **Ligado**: O modelo "melhora" seu prompt (pode desviar da intencao original)
- **Desligado**: Seu prompt e usado mais literalmente

**Para ads onde voce quer controle preciso: considere desligar o Magic Prompt.**

---

## Geracao Multipla

- Sempre gere **3-5 imagens** do mesmo prompt e selecione a melhor
- Na API: use o parametro `number_of_images`
- A taxa de outputs utilizaveis e de ~50% — gerar em volume e selecionar e a norma

---

## Parametros via API (Vertex AI)

Para quem usa a API programaticamente:

- `numberOfImages` — quantas imagens gerar
- `aspectRatio` — proporcao
- `safetyFilterLevel` — nivel de filtragem (pode ser ajustado para menos restritivo via API)
- `personGeneration` — controle de geracao de pessoas
- `responseModalities: ["TEXT", "IMAGE"]` — garantir que o modelo gere imagem e nao apenas texto

---

## Dica: Safety Filter Level via API

O parametro `safetyFilterLevel` pode ser ajustado via API para ser **menos restritivo** que a interface web. Util para conteudo legitimamente profissional que e bloqueado falsamente na interface.
