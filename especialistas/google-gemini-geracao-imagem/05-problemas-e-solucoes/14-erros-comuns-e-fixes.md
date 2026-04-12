# Erros Comuns e Fixes no Gemini

## Erros Tecnicos

### Erro 429 - RESOURCE_EXHAUSTED
4 causas distintas que parecem identicas:

| Causa | Solucao |
|---|---|
| Tier gratuito (RPM = 0 desde dez/2025) | Ativar billing no Google Cloud, mesmo com limite $0 |
| Limite de burst (15 req/min no Tier 1) | Exponential backoff (2s, 4s, 8s entre tentativas) |
| Cota diaria RPD esgotada | Aguardar reset ou usar interface diferente |
| "Ghost 429" bug (contas recentes) | Trocar modelo e aguardar 24-48h |

### Erro 503 - SERVICE_UNAVAILABLE
Servidores lotados (9h-17h horario do Pacifico). Taxa de falha ~45%.  
**Solucao**: Gerar fora do horario de pico ou retry automatico.

### Falha Silenciosa (descreve em vez de gerar)
O Gemini responde com texto descrevendo a imagem em vez de gera-la.

**Solucoes**:
1. Fazer logout/login
2. Iniciar novo chat
3. Na API: usar `responseModalities: ["TEXT", "IMAGE"]`
4. Usar frases imperativas: `"Generate an image of..."` em vez de substantivos soltos

---

## Problemas de Qualidade

### Imagens Genericas ("Stock Photo dos Anos 2010")
**Causa**: Prompts vagos fazem o modelo defaultar pra media.

**Solucao**: Detalhes especificos + imperfeicoes:
```
# ERRADO:
"um carro legal"

# CERTO:
"um Mustang Fastback 1967 derrapando numa pista de corrida, 
fotografia editorial, lente 85mm, iluminacao dramatica"
```

### Taxa de ~50% de Outputs Inutilizaveis
Normal. O modelo prioriza flexibilidade criativa sobre seguir instrucoes.  
**Solucao**: Sempre gere 3-5 variantes e selecione.

---

## Os 7 "Pecados Capitais" do Prompt

1. **Prompt muito curto** — "a woman in an office" → generico e flat
2. **Nao especificar iluminacao** — defaulta pra iluminacao uniforme e sem carater
3. **Nao especificar enquadramento** — camera tende a afastar
4. **Usar "realistic" sozinho** — nao e suficiente, precisa de detalhes tecnicos
5. **Especificar demais em areas sensiveis** — Gemini pode recusar
6. **Ignorar o fundo** — se nao descreve, o modelo inventa (e inventa mal)
7. **Dizer o que NAO quer** — modelo pode incluir exatamente o que voce negou

---

## Texto Aparecendo Sem Ser Solicitado

O Gemini frequentemente adiciona texto aleatorio, placas, letreiros fictícios.

**Solucoes**:
- Adicionar: `"no text, no logos, no watermarks, no signs, no writing, no letters"`
- Pedir: `"clean surfaces"`, `"minimalist environment"`
- Mesmo assim pode aparecer — tratar em pos-producao
- Usar o proprio Gemini pra editar a imagem depois (inpainting)

---

## Elementos que Nao Fazem Sentido no Cenario

**Causa**: Modelo preenche lacunas com padroes estatisticos.

**Solucoes (em ordem de eficacia)**:

1. **Enquadramento afirmativo** — descreva o que QUER, nunca o que NAO quer
2. **Descrever cenario completo positivamente** com 2-3 elementos especificos
3. **Especificar cada area**: foreground, middle ground, background
4. **Simplificar o fundo**: `"solid dark background"`, `"plain studio backdrop"`
5. **Desfocar intencionalmente**: menos detalhes = menos alucinacoes

---

## Diversidade e Representacao

**Problema**: Tendencia a gerar pessoas caucasianas a menos que especificado.

**Solucao**: Sempre especificar aparencia:
```
"diverse Brazilian people, mixed ethnicity"
"warm olive skin tone, dark brown wavy hair"
```

---

## Maos Deformadas

Melhorou no Imagen 3, mas ainda ocorre.

| Estrategia | Exemplo |
|---|---|
| Esconder maos | `"hands in pockets"`, `"arms crossed"` |
| Dar objeto pra segurar | `"holding a coffee cup"`, `"typing on laptop"` |
| Enquadrar acima | `"portrait from chest up"` |
| Forcar anatomia | `"correct hand anatomy, five fingers"` |
| Evitar angulos extremos | Usar lente 35-50mm |
