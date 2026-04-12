# Erros Comuns e Fixes — Grok Imagine Video

## Erros Críticos

| Erro | Problema | Solução |
|------|----------|---------|
| **Close-up de mãos** | Dedos deformados, articulações extras | Enquadrar de longe ou ocultar mãos |
| **Close-up de rostos** | Artefatos, distorção facial | Medium shot ou mais distante |
| **Texto legível no vídeo** | Caracteres sem sentido, ilegível | NÃO incluir texto — adicionar em pós-produção |
| **Cenas com multidões** | Perda de coerência, figuras fantasma | Limitar a 1-3 sujeitos |
| **Múltiplos movimentos** | Confusão, artefatos de transição | 1 movimento de câmera por clip |

---

## Erros Moderados

| Erro | Problema | Solução |
|------|----------|---------|
| **Prompt muito longo** | Grok ignora instruções finais | 50-150 palavras, frontload o importante |
| **Keywords empilhadas** | Resultados genéricos | Usar frases naturais descritivas |
| **Sem especificar audio** | Grok adiciona música genérica | Sempre incluir `Audio:` no prompt |
| **Estender 3+ vezes** | Qualidade degrada visivelmente | Max 2 extensões por sequência |
| **Emoções genéricas** | Vídeo sem personalidade | Trocar "happy" por "radiant, sun-kissed" |
| **Verbos estáticos** | Cena parada, sem vida | Usar verbos dinâmicos: surges, unfurls, drifts |
| **Prompt em português** | Resultados inferiores | Escrever SEMPRE em inglês |

---

## Armadilhas de Plataforma

| Armadilha | Detalhe |
|-----------|---------|
| **URLs temporárias** | Vídeos gerados expiram — salvar IMEDIATAMENTE |
| **Soft caps não documentados** | SuperGrok: ~50-100 imagens ou ~10 vídeos/8h |
| **Free tier removido** | Desde mar/2026, vídeo requer assinatura paga |
| **Edit video max 8.7s** | Edição de vídeo existente limitada a 8.7 segundos de input |
| **480p é default na API** | Se não especificar `resolution: "720p"`, gera em 480p |

---

## Palavras/Conceitos que Produzem Artefatos

- **"Mãos segurando algo"** — IA ainda luta com mãos (melhorou em 2026, mas cuidado)
- **"Texto legível"** — texto gerado por IA é quase sempre ilegível
- **"Multidões de pessoas"** — rostos se fundem, corpos se confundem
- **"Reflexos perfeitos em espelho"** — inconsistências frequentes
- **"Dedos detalhados"** — especialmente em close-up
- **"Estilos contraditórios"** — "anime realista cyberpunk vintage" confunde o modelo

---

## Prompts Negativos

**IMPORTANTE:** Grok NÃO responde bem a descrições negativas.

| ERRADO | CERTO |
|--------|-------|
| `no blur` | `sharp focus` |
| `no shaky camera` | `steady tripod shot` |
| `no dark lighting` | `bright even lighting` |
| `don't show X` | Descrever positivamente o que QUER |

---

## Workflow de Iteração (Recomendação da Comunidade)

1. **Gerar com prompt simples primeiro** — ver o que Grok interpreta
2. **Iterar mudando UMA variável por vez** (iluminação, câmera, mood)
3. **Velocidade do Grok permite iteração rápida** (~15s por geração)
4. **Usar Prompt Assistant** do Grok para expandir prompts básicos
5. **Salvar prompts que funcionaram** — reutilizar como templates
6. **Testar em 480p primeiro** — finalizar em 720p (economiza quota)
7. **2-4 gerações tipicamente bastam** para resultado satisfatório

---

## Erros Específicos de Marketing

| Erro | Resultado | Correção |
|------|-----------|----------|
| Vídeo bonito sem hook | Ninguém assiste | Primeiros 2s precisam ser impactantes |
| Foco em estética, não emoção | Não converte | UGC "feio" converte mais que produção "bonita" |
| Prompt genérico para pessoa | Pessoa não-brasileira | Especificar "Brazilian" + características |
| Texto no vídeo gerado | Ilegível | SEMPRE adicionar texto em pós-produção |
| Vídeo longo de uma geração | Perde coerência | Gerar clips de 3-5s e editar juntos |
