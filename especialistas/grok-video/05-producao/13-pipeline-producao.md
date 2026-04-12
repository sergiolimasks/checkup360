# Pipeline de Produção — Workflow Completo

## Workflow para 1 Vídeo de Ad com IA

```
1. BRIEFING (5 min)
   - Escolher narrativa (ver 11-narrativas-10-segundos.md)
   - Definir hook e CTA
   - Escrever texto overlay

2. GERAÇÃO DE CENAS - Grok Imagine (15 min)
   - Gerar 3-4 cenas usando prompts adaptados
   - Para cada cena, gerar 2-3 variações
   - Selecionar as melhores
   - SEMPRE especificar aspect ratio (9:16 para mobile)

3. UPSCALE (5 min)
   - 720p → 1080p com Topaz Video AI, CapCut AI Upscale, ou similar
   
4. EDIÇÃO - CapCut (20 min)
   - Importar cenas na timeline
   - Cortar para duração exata (10s total)
   - Adicionar texto overlay (legendas queimadas)
   - Fonte: bold, grande (mín 48px), com sombra/fundo
   - Adicionar transições suaves entre cenas
   
5. AUDIO (10 min)
   - Música: tensa → positiva (biblioteca CapCut)
   - OU: voiceover gravado (celular mesmo)
   - Volume baixo se usar voiceover
   
6. CTA FINAL (5 min)
   - Card final com logo, CTA, preço
   - Criar no Canva, importar como imagem

7. EXPORTAR
   - 9:16, 1080x1920, H.264, 30fps
   - Manter abaixo de 30MB

8. TESTE A/B
   - Subir 3-5 variações (hooks diferentes)
   - Mesmo corpo, CTAs diferentes
   - Budget: R$20-50/dia por variação
   - Medir por 3-5 dias antes de decidir
```

**Tempo total por vídeo:** ~60 minutos
**Custo:** ~$0.50 por clip via API (ou incluso na assinatura)

---

## Estratégia de Teste A/B

### Testar em Camadas

```
Semana 1: Testar HOOKS (mesmo corpo e CTA)
- Hook A: "Seu cartão foi recusado?"
- Hook B: "Os bancos consultam 7 bases..."  
- Hook C: "3 em cada 5 brasileiros..."
→ Vencedor avança

Semana 2: Testar CTA (hook vencedor)
- CTA A: "Descubra agora por R$99"
- CTA B: "Consulte seu CPF"
- CTA C: "Veja o que os bancos veem"
→ Vencedor avança

Semana 3: Testar ESTILO (combinação vencedora)
- Estilo A: Cinematográfico (B-roll IA)
- Estilo B: UGC (pessoa falando para câmera)
- Estilo C: Texto animado sobre B-roll
→ Escalar vencedor
```

---

## Pipeline de Produção Avançado (Image-to-Video)

Para máxima consistência visual e de marca:

```
1. Gerar imagem base com Gemini Pro 3.1 (ou foto real)
2. Finalizar imagem no Canva (logo, cores, composição)
3. Image-to-Video no Grok para animar
4. Iterar mudando 1 variável por vez
5. Max 2 extensões se precisar mais duração
6. Pós-produção no CapCut (texto, áudio, CTA)
```

**Vantagem:** Grok é #1 em image-to-video. Manter os criativos do Gemini/Canva como base garante consistência de marca.

---

## Ferramentas do Pipeline

| Etapa | Ferramenta | Custo |
|-------|-----------|-------|
| Geração de imagem | Gemini Pro 3.1 | Grátis |
| Geração de vídeo | Grok Imagine | $0.05/s API ou assinatura |
| Upscale | CapCut / Topaz | Grátis / $199 |
| Edição | CapCut | Grátis / Pro |
| CTA/Overlay | Canva Pro | R$35/mês |
| Música | Biblioteca CapCut | Inclusa |

---

## Métricas e KPIs

| Métrica | Meta Aceitável | Meta Boa |
|---------|----------------|----------|
| Hook Rate (views 3s / impressões) | >15% | >25% |
| Hold Rate (assistiu até o fim / 3s views) | >30% | >50% |
| CTR (cliques / impressões) | >0.8% | >1.5% |
| CPC (custo por clique) | <R$3.00 | <R$1.50 |
| CPL (custo por lead no WA) | <R$25 | <R$12 |

---

## Specs Técnicas Meta Ads

| Parâmetro | Valor |
|-----------|-------|
| Aspecto | 9:16 (vertical) |
| Resolução | 1080x1920px (upscale do 720p) |
| Duração | 5-15 segundos (10s sweet spot) |
| Tamanho max | 4GB |
| Audio | Opcional mas +13% conversões com som |
| Legendas | OBRIGATÓRIAS queimadas |
| Codec | H.264 |
| FPS | 30 |
