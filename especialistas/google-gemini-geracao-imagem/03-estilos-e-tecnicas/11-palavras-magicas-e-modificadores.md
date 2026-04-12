# Palavras Magicas e Modificadores no Gemini

Termos que a comunidade descobriu que mudam drasticamente a qualidade do output.

---

## Modificadores de Qualidade

| Termo | Efeito | Impacto |
|---|---|---|
| `"cinematic"` | Depth of field, color grading, iluminacao dramatica | ★★★★★ O mais poderoso |
| `"editorial"` | Estilo limpo e profissional | ★★★★★ |
| `"8K"` / `"8K resolution"` | Aumenta nivel de detalhe | ★★★★ |
| `"award-winning photography"` | Melhora composicao e iluminacao | ★★★★ |
| `"hyper-detailed"` / `"ultra-detailed"` | Mais textura e nitidez | ★★★★ |
| `"masterfully composed"` | Composicao geral melhorada | ★★★ |
| `"National Geographic style"` | Pra natureza e retratos culturais | ★★★★ |

---

## Termos de Camera (Afetam Estilo de Cor e Contraste)

| Camera | Efeito na imagem |
|---|---|
| `"shot on Hasselblad"` | Clinico, sharp, detalhes extremos |
| `"shot on Canon EOS R5"` | Cores quentes, fotorrealismo |
| `"shot on Sony A7IV"` | Neutro, balanceado |
| `"shot on Fuji X-T5"` | Cores estilizadas, "film-like" |

### Lentes
| Lente | Efeito |
|---|---|
| `"85mm f/1.4"` | Bokeh bonito, retratos |
| `"35mm lens"` | Ligeiramente wide, bom pra contexto |
| `"50mm"` | Normal, visao humana |
| `"135mm"` | Compressao forte, sujeito destaca |
| `"macro lens"` | Detalhes extremos |
| `"wide angle"` | Paisagens, arquitetura |
| `"tilt-shift"` | Efeito miniatura |

---

## Termos de Filme Analogico (Anti-Visual-de-IA)

| Termo | Resultado |
|---|---|
| `"shot on Kodak Portra 400"` | Tons quentes, pele bonita, grain sutil |
| `"Kodak Portra 800"` | Similar, mais grain |
| `"Fujifilm Pro 400H"` | Tons frios/verdes, skin tones suaves |
| `"Kodachrome"` | Cores vibrantes vintage |
| `"35mm film"` | Grain e estetica analogica geral |
| `"Ilford HP5"` | Preto e branco com grain bonito |

---

## Termos de Iluminacao Mais Amados

| Termo | Resultado |
|---|---|
| `"golden hour lighting"` | Quase unanimemente a mais bonita |
| `"Rembrandt lighting"` | Retratos dramaticos |
| `"rim lighting"` / `"backlit"` | Silhuetas e profundidade |
| `"studio lighting with softbox"` | Product shots |
| `"volumetric lighting"` | Raios de luz, muito atmosferico |
| `"natural ambient light"` | Look casual e organico |
| `"chiaroscuro"` | Contraste extremo (Caravaggio) |

---

## Termos de Atmosfera/Mood

| Termo | Resultado |
|---|---|
| `"ethereal"` | Suave, sonhador, luminoso |
| `"moody"` | Escuro, contrastado, emocional |
| `"whimsical"` | Ludico, fantasioso |
| `"gritty"` | Texturizado, urbano, realista |
| `"serene"` | Calmo, balanceado, pacifico |
| `"noir"` | Preto e branco, sombras fortes, misterioso |
| `"intimate"` | Proximo, pessoal, acolhedor |

---

## Combinacoes Poderosas (Receitas Prontas)

### Retrato Cinematico
```
cinematic + 85mm f/1.4 + Rembrandt lighting + Kodak Portra 400 + shallow depth of field
```

### Product Shot Premium
```
commercial photography + studio lighting with softbox + 8K + clean white background + sharp focus
```

### Lifestyle Aspiracional
```
editorial + golden hour + Canon EOS R5 + natural ambient light + candid + warm tones
```

### Dark e Dramatico (ideal pra ads de credito)
```
moody + low-key lighting + dark background + dramatic side lighting + desaturated tones + cinematic
```

### Street Photography
```
candid + 35mm lens + natural ambient light + gritty + film grain + Kodak Tri-X
```

---

## O Que NAO Funciona

| Termo | Por que nao funciona |
|---|---|
| `"masterpiece, best quality"` | Jargao de Stable Diffusion, pouco efeito no Gemini |
| `"4K, HDR"` | Efeito minimo comparado a "8K" ou "cinematic" |
| `"beautiful, stunning"` | Vago demais, nao direciona o modelo |
| `"realistic"` sozinho | Precisa de detalhes tecnicos pra funcionar |
| Pesos (`word::2`) | Sintaxe do Midjourney/SD, nao funciona |
| `--ar`, `--v`, `--style` | Parametros do Midjourney, nao existem no Gemini |
