# Texto e Tipografia em Imagens no Gemini

## Realidade: Texto no Gemini e Bom, Mas NAO Perfeito

O Imagen 3 e considerado **o melhor da industria em renderizacao de texto** — precisao reportada de **94-96%** para palavras curtas em ingles. Superior ao Midjourney e DALL-E nesse aspecto.

**O que renderiza bem:**
- Palavras curtas (2-4 palavras) em ingles
- Labels, sinais, placas dentro de cenas
- Infograficos, menus, diagramas simples
- Logos simples

**O que ainda falha:**
- Textos longos (letras no meio "derivam", espacamento inconsistente)
- Erros de ortografia persistem mesmo com instrucoes explicitas
- Texto em posicao errada
- **Portugues com acentos: problematico** (ç, ã, é, õ podem falhar)

### Por Que Acontece
Os modelos "pintam formas que parecem letras" sem entender linguagem. Foram treinados com milhoes de imagens com fontes estilizadas, memes com erros, e logos aleatorios. Mesmo `"NO SPELLING MISTAKES!!!"` no prompt nao garante nada — o modelo nao "le".

---

## Quando o Texto no Gemini FUNCIONA

- Palavras **curtas** (1-3 palavras)
- Texto em **CAPS LOCK** (melhor taxa de acerto)
- Palavras em **ingles** (melhor que portugues)
- Texto entre **aspas no prompt**: `"A sign that reads 'OPEN'"`

---

## Tecnicas pra Melhorar Texto

### 1. Colocar entre aspas
```
"A neon sign that reads 'NEGADO' in bright red bold font"
```

### 2. Descrever tipografia
```
"bold sans-serif font"
"neon cursive signage"
"clean helvetica-style typeface"
"large block uppercase letters"
```

### 3. Especificar posicao
```
"text at the top center of the image"
"headline across the upper third"
"small text at the bottom"
```

### 4. Gerar texto primeiro no chat
No Gemini conversacional, peca primeiro para gerar o texto correto, depois peca a imagem contendo aquele texto.

### 5. Alto contraste entre texto e fundo
Garanta que exista contraste forte — texto claro em fundo escuro ou vice-versa.

### 6. Limite de caracteres
O Imagen 3 renderiza legivelmente ate **~18-25 caracteres**. Quanto mais curto, mais preciso.

### 7. Usar Nano Banana Pro pra texto complexo
Esse modelo usa raciocinio (thinking) pra melhorar precisao em cenas com texto.

### 8. Iteracao conversacional pra corrigir
Use o chat pra pedir correcoes: `"Fix the spelling of 'PROMOCAO' in the sign"`

---

## Abordagem Recomendada: Hibrida

**Gerar imagem SEM texto no Gemini → Adicionar texto externamente**

Ferramentas pra adicionar texto depois:
- **Canva** (mais facil, templates prontos)
- **Figma** (mais controle, colaborativo)
- **Photoshop** (maximo controle)
- **Python PIL/Pillow** (automatizacao em escala)

---

## Workflow pra Criativos com Texto

1. Gere a imagem base no Gemini pedindo **copy space** (ver arquivo 13)
2. Exporte a imagem
3. Importe no Canva/Figma
4. Adicione:
   - Headline (fonte bold, tamanho grande)
   - Subtext (fonte regular, menor)
   - CTA (se necessario)
   - Logo
   - Selos de credibilidade
5. Ajuste cores e contraste pra manter coerencia

---

## Fontes Recomendadas pra Ads (adicionar no Canva)

| Uso | Fonte | Estilo |
|---|---|---|
| Headlines | Montserrat Black | Bold, impactante |
| Headlines (alternativa) | DM Sans Bold | Moderno, tech |
| Headlines (alternativa) | Inter ExtraBold | Clean, versátil |
| Subtext | Inter Regular | Legivel |
| Subtext | DM Sans Regular | Moderno |
| Dados/numeros | IBM Plex Mono | Monospacada, tecnica |

---

## Regra de Ouro

> "Para texto critico (logos, sinalizacao profissional, headlines de ad), NAO dependa do Gemini. Use-o para o visual e adicione texto externamente." — Consenso da comunidade
