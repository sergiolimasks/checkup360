# Fundos e Cenarios no Gemini

## O Problema: Elementos Aleatorios no Fundo

O modelo "alucina" elementos baseado em associacoes estatisticas dos dados de treinamento. Se voce diz "pessoa no banco", ele pode colocar uma agencia da Caixa no fundo mesmo que nao faca sentido.

---

## Solucao #1: Enquadramento Afirmativo (A Mais Eficaz)

**Descreva o que QUER, nunca o que NAO quer.**

- **ERRADO:** `"pessoa na rua, sem lojas, sem carros"`
- **CERTO:** `"pessoa caminhando numa calcada residencial arborizada e tranquila, casas de dois andares com jardins, sem comercio, horario de manha com luz suave"`

O motivo: para processar "nao vermelho", o modelo precisa primeiro pensar em vermelho — o que contamina o output.

---

## Solucao #2: Descrever Cada Area da Imagem

```
"Foreground: woman sitting at wooden cafe table with coffee cup.
Middle ground: empty cobblestone street with warm afternoon light.
Background: old European stone buildings with green shutters, clear blue sky."
```

---

## Solucao #3: Simplificar o Fundo

Quanto mais simples, menos alucinacoes:
```
"solid dark background"
"plain gray backdrop"
"simple studio backdrop"
"clean white background"
```

---

## Solucao #4: Desfocar Intencionalmente

Fundo desfocado = menos detalhes alucinados visiveis:
```
"blurred background" / "bokeh background"
"shallow depth of field, subject in sharp focus, background completely out of focus"
"f/1.4 aperture"
```

---

## Fundos Escuros/Moody

```
"dark moody background"
"black background" / "dark gradient background"
"dimly lit room"
"dark atmospheric background with subtle bokeh lights"
"studio portrait with dark backdrop"
"low-key lighting with dark negative space"
```

---

## Cenas Coerentes — Como Especificar

1. **Nomear LOCAL + HORA + CLIMA**:
   ```
   "inside a modern Sao Paulo apartment at night, warm lamp light, rain visible through the window"
   ```

2. **Adicionar 2-3 objetos de contexto coerentes**:
   ```
   "a laptop on the desk, coffee cup beside it, papers scattered"
   ```

3. **Referenciar estilos fotograficos**:
   - `"environmental portrait"` (retrato com contexto ambiental)
   - `"editorial photograph"` (tende a gerar cenas mais coerentes)

4. **Meta-instrucoes**:
   - `"coherent scene"`, `"realistic environment"` — usuarios relatam que ajuda

---

## Dica de Ouro

> "O segredo para fundos limpos e ser redundante e especifico. Eu escrevo 'plain solid dark gray studio backdrop, no objects, no text, no distractions in the background, clean backdrop'. Parece excessivo mas funciona melhor do que simplesmente 'dark background' onde o modelo inventa coisas."

---

## Edicao de Fundo na Conversa

No Gemini Chat, voce pode iterar sobre o fundo:
- `"Keep the person exactly the same, but change the background to a dark office"`
- `"Blur the background more"`
- `"Remove the objects behind the person"`

**IMPORTANTE:** Faca UMA mudanca por turno de conversa. Multiplas mudancas simultaneas degradam ambos os resultados.

Adicionar `"keep the subject/person unchanged"` funciona ~80% das vezes.
