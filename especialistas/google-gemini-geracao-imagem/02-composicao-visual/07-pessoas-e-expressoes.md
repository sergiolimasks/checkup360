# Pessoas e Expressoes no Gemini

## Gerando Pessoas Realistas

### Termos que Aumentam Realismo
```
"photorealistic", "hyperrealistic photograph", "editorial portrait photography"
"natural skin texture", "visible pores", "skin imperfections"
"candid photograph" / "unposed"
```

### Mencionar Camera Adiciona "DNA" Fotografico
```
"shot on Sony A7III with 85mm f/1.8"
"shot on Canon EOS R5, 85mm lens"
```

---

## Aparencia e Etnia

**NOTA: O Gemini tem restricoes de seguranca sobre geracao de pessoas.** Pode recusar ou interpretar de formas inesperadas.

### O que funciona:
- Termos diretos: `"Brazilian woman"`, `"Latin American man"`, `"mixed-race Brazilian person"`
- Descrever caracteristicas: `"warm olive skin tone, dark brown wavy hair, brown eyes"`
- `"South American appearance"`, `"Mediterranean features"`
- Tons de pele: `"warm brown skin"`, `"light brown complexion"`, `"deep brown skin tone"`
- Cabelo: `"curly dark hair"`, `"wavy black hair"`, `"straight brown hair"`

**Dica**: Ser descritivo nas caracteristicas fisicas e mais confiavel que rotular etnia.

---

## Expressoes Faciais

| Expressao | Termos que funcionam |
|---|---|
| **Frustracao** | `"frustrated expression"`, `"look of frustration"` |
| **Preocupacao** | `"worried expression"`, `"anxious look"`, `"furrowed brow with concern"` |
| **Confianca** | `"confident expression"`, `"self-assured smile"`, `"confident gaze"` |
| **Sorriso sutil** | `"subtle smile"`, `"slight smirk"` |
| **Pensativo** | `"pensive expression"`, `"lost in thought"` |
| **Cansaco** | `"exhausted"`, `"tired eyes"` |
| **Raiva** | `"angry scowl"` |
| **Surpresa** | `"surprised"`, `"wide-eyed"` |
| **Determinacao** | `"determined look"`, `"intense focused gaze"` |

### Dica: Combine expressao com contexto
```
"a woman looking at her phone with a worried expression, biting her lower lip"
```
Contexto ajuda o modelo a acertar a emocao.

---

## Evitando "Tells" de IA

### Maos (o problema classico)
O Imagen 3 e melhor que versoes anteriores, mas ainda pode errar.

**Estrategias:**
1. **Esconder maos**: `"hands in pockets"`, `"arms crossed"`, `"hands behind back"`
2. **Dar algo pra segurar**: `"holding a coffee cup"`, `"typing on laptop"` — objetos ancoram as maos
3. **Enquadrar do peito pra cima** — elimina o problema completamente
4. **Adicionar ao prompt**: `"correct hand anatomy, five fingers, natural hand structure"`
5. **Usar lente 35-50mm** e evitar angulos extremos de maos

### Rosto Uncanny Valley
1. **Evitar simetria perfeita**: `"natural asymmetrical features"`
2. **Adicionar imperfeicoes**: `"natural skin texture, subtle freckles, slight under-eye circles"`
3. **Olhar desviado**: `"looking slightly off-camera"` — parece mais natural que encarar a camera
4. **Evitar iluminacao uniforme** no rosto (usar Rembrandt ou side lighting)
5. **Manter expressao neutra**: `"static expression, clinical neutrality, 0% smile"` (explora recency bias)

### Pele Plastica
```
"natural skin with visible pores and subtle imperfections"
"unairbrushed look with freckles and fine lines"
"visible pores, subtle under-eye fatigue, natural skin texture"
```

---

## Template Confiavel pra Retratos de Pessoas

```
Editorial portrait photograph of a [idade]-year-old [aparencia] [genero], 
[expressao facial], [acao/pose], from chest up, 
shot on 85mm f/1.4 lens, [tipo de iluminacao] from the [direcao], 
shallow depth of field, [referencia de filme/cor], 
natural skin texture with visible pores, [fundo]
```

### Exemplo completo:
```
Editorial portrait photograph of a 30-year-old Brazilian woman with warm olive 
skin and dark wavy hair, looking directly at camera with a confident but subtle 
expression, from chest up, Rembrandt lighting from the left with rim light, 
desaturated warm tones, shot on 85mm f/1.4 lens, shallow depth of field, 
dark moody out-of-focus background, Kodak Portra 400 film aesthetic, 
natural skin texture
```
