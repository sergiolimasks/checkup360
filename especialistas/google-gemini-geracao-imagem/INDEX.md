# Base de Conhecimento: Geracao de Imagem com Google Gemini

> Guia completo baseado em pesquisa de foruns, Reddit, YouTube, Medium e comunidades de IA.
> Focado em criacao de criativos para Meta Ads.

---

## Roteador Rapido

### "Quero criar um criativo pra ad"
→ Comece por [Criativos Meta Ads](04-ads-e-marketing/11-criativos-meta-ads.md)  
→ Depois [Copy Space e Layout](04-ads-e-marketing/13-copy-space-e-layout.md)  
→ Finalize com [Texto e Tipografia](04-ads-e-marketing/12-texto-e-tipografia.md)

### "Minha imagem ficou generica / com cara de IA"
→ [Fotorrealismo](03-estilos-e-tecnicas/09-fotorrealismo.md) — 7 palavras-chave anti-visual-de-IA  
→ [Cores e Paletas](02-composicao-visual/06-cores-e-paletas.md) — como dessaturar e parecer real

### "A camera ficou longe demais / angulo errado"
→ [Enquadramento e Camera](02-composicao-visual/04-enquadramento-e-camera.md) — vocabulario completo de distancia e angulos

### "Apareceu elemento aleatorio no fundo"
→ [Fundos e Cenarios](02-composicao-visual/08-fundos-e-cenarios.md) — enquadramento afirmativo  
→ [Erros Comuns](05-problemas-e-solucoes/14-erros-comuns-e-fixes.md)

### "O texto na imagem saiu errado"
→ [Texto e Tipografia](04-ads-e-marketing/12-texto-e-tipografia.md) — NUNCA confie no Gemini pra texto

### "A iluminacao ficou flat / sem graca"
→ [Iluminacao e Atmosfera](02-composicao-visual/05-iluminacao-e-atmosfera.md) — termos de iluminacao dramatica

### "Quero aprender a montar prompts"
→ [Estrutura de Prompt](01-fundamentos/01-estrutura-de-prompt.md) — templates e ordem dos elementos  
→ [Palavras Magicas](03-estilos-e-tecnicas/11-palavras-magicas-e-modificadores.md) — termos que mudam tudo

### "Deu erro / bloqueou / nao gerou"
→ [Erros Comuns e Fixes](05-problemas-e-solucoes/14-erros-comuns-e-fixes.md)  
→ [Limitacoes e Workarounds](05-problemas-e-solucoes/15-limitacoes-e-workarounds.md)

### "Qual modelo / versao / interface usar?"
→ [Modelos e Versoes](01-fundamentos/02-modelos-e-versoes.md) — ImageFX vs Gemini Chat vs API  
→ [Parametros e Configuracoes](01-fundamentos/03-parametros-e-configuracoes.md)

### "Quero gerar pessoas realistas"
→ [Pessoas e Expressoes](02-composicao-visual/07-pessoas-e-expressoes.md) — template confiavel pra retratos

---

## Estrutura das Pastas

```
google-gemini-geracao-imagem/
├── INDEX.md                          ← Voce esta aqui
├── 01-fundamentos/
│   ├── 01-estrutura-de-prompt.md     ← Templates, ordem, linguagem natural
│   ├── 02-modelos-e-versoes.md       ← ImageFX vs Gemini vs API, tiers
│   └── 03-parametros-e-configuracoes.md ← Aspect ratio, seeds, magic prompt
├── 02-composicao-visual/
│   ├── 04-enquadramento-e-camera.md  ← Distancia, angulos, lentes
│   ├── 05-iluminacao-e-atmosfera.md  ← Dramatica, suave, estudio, neon
│   ├── 06-cores-e-paletas.md         ← Paletas, mood, anti-supersaturacao
│   ├── 07-pessoas-e-expressoes.md    ← Realismo, etnia, expressoes, maos
│   └── 08-fundos-e-cenarios.md       ← Copy space, elementos aleatorios
├── 03-estilos-e-tecnicas/
│   ├── 09-fotorrealismo.md           ← 7 tecnicas anti-visual-de-IA
│   ├── 10-design-grafico-e-ads.md    ← Estilos visuais, mockups
│   └── 11-palavras-magicas-e-modificadores.md ← Receitas prontas
├── 04-ads-e-marketing/
│   ├── 11-criativos-meta-ads.md      ← Workflow completo, A/B testing
│   ├── 12-texto-e-tipografia.md      ← Por que NAO gerar texto no Gemini
│   └── 13-copy-space-e-layout.md     ← Espacos pra texto, resolucoes
└── 05-problemas-e-solucoes/
    ├── 14-erros-comuns-e-fixes.md    ← Erros tecnicos, 7 pecados capitais
    └── 15-limitacoes-e-workarounds.md ← O que o Gemini NAO faz, alternativas
```

---

## Regras de Ouro (Top 5)

1. **Enquadramento afirmativo**: Descreva o que QUER, nunca o que NAO quer
2. **Especificacoes de camera real**: Lente + abertura + modelo = foto crivel
3. **Imperfeicoes intencionais**: Poros, grao, assimetria = nao parece IA
4. **Narrativa > keywords**: Paragrafo descritivo >>> lista de palavras
5. **Iteracao progressiva**: Uma mudanca por turno, construa a imagem aos poucos

---

## Workflow Rapido pra Criativo de Ad

```
1. Montar prompt (ver 01-estrutura-de-prompt.md)
   ↓
2. Gerar 4-6 variacoes no Gemini (SEM texto)
   ↓
3. Selecionar a melhor
   ↓
4. Importar no Canva/Figma
   ↓
5. Adicionar: headline + subtext + logo + selo + CTA
   ↓
6. Exportar: PNG 1080x1350 (feed) ou 1080x1920 (stories)
   ↓
7. Subir no Meta Ads Manager
```
