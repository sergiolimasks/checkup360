# Fotorrealismo no Gemini

## O Ponto Forte do Imagen 3

Fotorrealismo e onde o Gemini mais se destaca — consistentemente elogiado como o melhor ou empatado com Midjourney v6.

---

## 7 Palavras-Chave Anti-Visual-de-IA

### 1. Especificacoes de Camera Real
```
"shot on Canon EOS R5, 85mm lens, f/1.8 aperture"
"shot on Sony A7R IV, 85mm f/1.4"
"shot on Hasselblad X2D, 80mm lens"
```

**Cada camera tem "personalidade":**
- **Hasselblad** → look clinico e sharp
- **Canon** → cores mais quentes
- **Sony** → mais neutro
- **Fuji** → cores mais estilizadas

### 2. Imperfeicoes Naturais
```
"natural skin with visible pores and subtle imperfections"
"weathered face", "slight asymmetry", "chipped paint"
"visible pores, subtle under-eye fatigue, natural skin texture"
"unairbrushed look with freckles and fine lines"
```

### 3. Momentos Candidos
```
"caught mid-stride"
"genuine laughter"
"looking away from camera"
"candid photograph, not posed, natural imperfections, authentic moment"
```

### 4. Referencia a Filme Analogico
```
"shot on Kodak Portra 400"
"35mm film grain at ISO 200"
"subtle film grain sized to 24MP equivalent"
"teal shadows and warm highlights, film-like tone split"
"Fujifilm Pro 400H color science"
```

### 5. Contexto Ambiental Integrado
Nao deixar o sujeito "colado" num fundo generico. Descrever ambiente completo com iluminacao, props e atmosfera coerentes.

### 6. Textura e Material
```
"full-grain leather with visible grain texture"
"brushed stainless steel with fingerprints"
"worn denim with faded creases"
```

### 7. Prompts Negativos Semanticos (afirmar, nao negar)
```
# ERRADO:
"no plastic skin, no oversaturation"

# CERTO:
"natural skin with visible pores and subtle imperfections, muted color palette"
```

---

## Modificadores de Qualidade que Funcionam

| Termo | Efeito |
|---|---|
| `"hyper-detailed"` / `"ultra-detailed"` | Mais textura e nitidez |
| `"8K"` / `"8K resolution"` | Aumenta nivel de detalhe perceptivelmente |
| `"award-winning photography"` | Melhora composicao e iluminacao automaticamente |
| `"masterfully composed"` | Afeta composicao positivamente |
| `"cinematic"` | Um dos mais poderosos — depth of field, color grading, iluminacao dramatica |
| `"editorial"` | Estilo mais limpo e profissional |
| `"National Geographic style"` | Pra natureza e retratos culturais |

---

## Termos de Camera que Fazem Diferenca

| Termo | Resultado |
|---|---|
| `"shot on Hasselblad"` | Qualidade extrema, detalhes |
| `"shot on Canon EOS R5"` | Fotorrealismo convincente |
| `"35mm film"` | Grain e color grading vintage |
| `"macro lens"` | Close-ups detalhados |
| `"tilt-shift lens"` | Efeito miniatura |
| `"85mm f/1.4"` | Bokeh bonito pra retratos |
| `"wide angle lens"` | Paisagens e arquitetura |

---

## Formula Completa Anti-IA

Combine todos os elementos:

```
[descricao especifica do sujeito] + 
[iluminacao real precisa] + 
[detalhes de textura/imperfeicao] + 
[especificacoes de camera/lente] + 
[referencia de filme/cor] + 
[aspect ratio]
```

### Exemplo:
```
A candid photograph of an elderly Japanese potter, deeply focused, 
hands covered in wet clay, working at a traditional wheel in a dimly 
lit workshop, late afternoon light streaming through a single window, 
shot on Hasselblad X2D, 80mm lens, documentary photography style, 
Kodak Portra 400 film, natural skin texture with wrinkles and age spots, 
incredibly detailed, 8K resolution
```

---

## Controle de Intensidade

SEMPRE especifique `"subtle"`, `"natural"` ou `"dramatic"` — sem isso, o Gemini aplica efeito maximo, resultando em imagens artificiais.

---

## Prompt Fotorrealista Completo (6 Elementos)

Combine nesta ordem:
1. **Descricao do sujeito**
2. **Cena/ambiente**
3. **Iluminacao** ("soft natural lighting", "golden hour", "three-point softbox")
4. **Camera** ("shot on Canon EOS R5, 85mm f/1.4, ISO 100")
5. **Angulo** ("45-degree elevated", "eye level", "Dutch angle")
6. **Atmosfera** ("intimate", "dramatic", "serene")

### Exemplo profissional testado:
```
Environmental portrait, documentary style, [descricao do sujeito] paused mid-task, 
natural available light only, Kodak Portra film stock, foreground interest with 
winding path, golden hour lighting with long shadows
```

---

## Descobertas Nao-Obvias

1. **"captured in" > "image of"**: `"captured in a fleeting moment"` produz fotos mais naturais
2. **"behind the scenes"**: Adicionar `"behind the scenes photograph from a film set"` gera iluminacao cinematografica com feel casual
3. **"editorial photograph"**: Tende a gerar composicoes mais coerentes que "professional photograph"
4. **Emocao no prompt**: Descrever emotivamente gera mais emocao na imagem
5. **"RAW photo"**: Reduz o over-smoothing que faz imagens parecerem plasticas
6. **Pele plastica — fix direto**: `"Retouch skin: remove temporary blemishes like acne, but strictly preserve pore texture and freckles. Do not smooth to a plastic finish."`
