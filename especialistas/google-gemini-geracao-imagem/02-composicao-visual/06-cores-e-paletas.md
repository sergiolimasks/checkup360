# Cores e Paletas no Gemini

## Especificando Cores

**Codigos hex (como #FF5733) NAO funcionam de forma confiavel** — resultados inconsistentes.

### O que funciona:
- Descrever cores com adjetivos: `"deep crimson red"`, `"muted teal"`, `"warm amber tones"`
- Referencias a paletas conhecidas: `"Wes Anderson color palette"`, `"teal and orange color grading"`
- Referencias de filme: `"muted Kodak Portra film colors"`, `"Fujifilm Pro 400H color science"`

---

## Controlando Humor Atraves de Cor

| Termo | Efeito |
|---|---|
| `warm color palette` / `cool color palette` | Temperatura geral |
| `monochromatic blue tones` | Monocromatico |
| `analogous color scheme` | Cores harmonicas |
| `complementary colors` | Contraste forte |
| `desaturated` / `muted colors` | Mais realistas |
| `vibrant` / `saturated` | Vibrantes (CUIDADO: pode ficar "AI-like") |

---

## O Problema: Visual de IA com Cores Supersaturadas

O Imagen 3 tende a produzir cores muito vibrantes e "perfeitas demais". 

### 7 Solucoes:

1. **Adicionar**: `"muted colors"`, `"desaturated"`, `"subdued palette"`

2. **Referenciar filmes analogicos**:
   ```
   "shot on Kodak Portra 400"
   "Fujifilm Pro 400H color science"
   "Kodachrome colors"
   ```

3. **Usar**: `"natural colors"`, `"realistic color grading"`

4. **Pedir desvio de cor**: `"slight color cast"` (como fotos reais tem)

5. **Adicionar grao**: `"film grain"` junto com a paleta quebra a perfeicao digital

6. **Termos editoriais**: `"editorial photography color grading"`

7. **Pretos levantados**: `"lifted blacks"` (nao totalmente escuros, como em filme)

**EVITAR**: `"vibrant"`, `"colorful"`, `"vivid"` a menos que realmente queira isso.

---

## Paletas Escuras/Moody

```
"dark and moody color palette"
"low-key"
"noir aesthetic"
"deep shadows with rich blacks"
"dark teal and amber"  ← popular pra mood cinematico
"desaturated dark tones"
"color grading: shadows pushed to blue, highlights warm"  ← funciona surpreendentemente bem
```

---

## Paletas Claras/Limpas

```
"bright and airy"
"high-key lighting"
"clean white background"
"minimalist"
"light pastel colors"
"bright natural daylight colors"
```

---

## Truque dos Diretores de Cinema

Referenciar diretores funciona melhor que descrever paletas manualmente:

| Referencia | Resultado |
|---|---|
| `"color graded like a Christopher Nolan film"` | Cinematico, tons frios/neutros |
| `"color graded like a David Fincher film"` | Dessaturado, verde/amarelo frio |
| `"Wes Anderson color palette"` | Pasteis simetricos |
| `"Blade Runner 2049 color grading"` | Laranja/teal dramatico |
| `"Amelie color grading"` | Quente, dourado, saturacao seletiva |

> "Cada diretor tem uma estetica de cor reconhecivel que o modelo parece entender."
