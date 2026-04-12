# Estrutura de Prompt no Google Gemini (Imagen 3)

## Ordem Ideal dos Elementos

A comunidade convergiu para uma formula amplamente aceita:

```
[Tipo de midia] + [Sujeito principal] + [Detalhes do sujeito] + [Ambiente/Cenario] + 
[Iluminacao] + [Composicao/Angulo] + [Estilo artistico] + [Qualidade/Modificadores]
```

**O que vem primeiro tem mais peso.** Diferente do Stable Diffusion onde a ordem dos tags e menos relevante, no Gemini o que vem primeiro no prompt tem mais "peso". Se a iluminacao e crucial, comece com "Dramatically backlit...". Se o sujeito e mais importante, comece com ele.

### Exemplo real funcional:
```
A cinematic photograph of a weathered fisherman, deep wrinkles on sun-tanned skin, 
standing on a wooden dock at golden hour, dramatic side lighting, shot from a low angle, 
in the style of Steve McCurry, 8K ultra-detailed
```

---

## Linguagem Natural vs Tags

**Linguagem natural e rei no Gemini.** A comunidade e quase unanime nisso.

- **ERRADO (estilo Stable Diffusion):** `masterpiece, best quality, 8k, portrait, woman, office, dramatic lighting`
- **CERTO (estilo Gemini):** `A dramatic editorial portrait photograph of a confident businesswoman in a modern corner office, shot on an 85mm lens with soft window light from the left`

> "Pare de pensar como se estivesse programando. O Gemini e um LLM primeiro e um gerador de imagens segundo. Fale com ele como falaria com um artista humano." — Comunidade Reddit

**Virgulas** funcionam para listar atributos, mas nao no estilo "tag dump".  
**Frases completas** descrevendo a cena funcionam melhor que listas de keywords.  
**Pesos de prompt** (word::2) e **parametros** (--ar, --v) **NAO funcionam** — isso e sintaxe do Midjourney.

---

## Comprimento do Prompt

### Sweet spot: 20-50 palavras

| Comprimento | Quando usar |
|---|---|
| **Curto (5-15 palavras)** | Exploracao rapida, brainstorming. A IA preenche as lacunas. |
| **Medio (20-50 palavras)** | Melhor equilíbrio controle/qualidade. Recomendado pela maioria. |
| **Longo (50-150 palavras)** | Maximo controle, mas risco de conflitos visuais. |

> "Se seu prompt tem mais de 4 frases, provavelmente esta longo demais para o Gemini."

---

## 4 Templates Prontos

### Template 1 — "O Fotografo" (fotorrealismo)
```
A [adjetivo] photograph of [sujeito], [detalhes do sujeito], [pose/acao], 
in [cenario], during [hora/iluminacao], shot on [camera], [lente], 
[estilo fotografico], [modificadores de qualidade]
```

### Template 2 — "O Artista Digital" 
```
A [meio artistico] of [sujeito] in the style of [artista/movimento], 
featuring [elementos visuais], [paleta de cores], [mood/atmosfera], 
[detalhes de composicao]
```

### Template 3 — "O Minimalista" (surpreendentemente efetivo)
```
[Meio]: [Sujeito], [um detalhe-chave], [mood]
```
Exemplo: `Editorial photograph: a single red umbrella on a rainy Tokyo street, neon reflections, melancholic`

### Template 4 — "Product Shot"
```
A professional product photograph of [produto], [material/cor], 
on [fundo/superficie], [setup de iluminacao], [angulo], 
commercial photography, studio lighting
```

---

## Descobertas Nao-Obvias

1. **"Mencionar o proposito ajuda"**: Dizer "for a magazine cover" ou "for an Instagram post" muda a composicao para se adequar ao formato.

2. **"captured in" vs "image of"**: Frases como "captured in a fleeting moment" produzem fotos mais naturais que "a photo of".

3. **Emocao no prompt gera emocao na imagem**: Nao diga "a sad woman". Diga "a woman overwhelmed by grief, tears streaming down her face, clutching a faded letter".

4. **O truque do "behind the scenes"**: Adicionar "behind the scenes photograph from a film set" gera iluminacao cinematografica com feel mais casual.

5. **NAO diga o que nao quer**: Dizer "no text" as vezes faz o modelo INCLUIR texto. Simplesmente nao mencione.

---

## Prompts Problematicos — O Que Evitar

- **Contradicoes**: "A bright dark room" confunde o modelo
- **Excesso de sujeitos**: Mais de 3-4 elementos principais degrada a qualidade
- **Instrucoes espaciais complexas**: "A esta a esquerda de B que esta atras de C" — o modelo perde controle
- **Estilos conflitantes**: "hyperrealistic anime" gera resultados confusos
- **Referencias obscuras**: Artistas ou estilos pouco conhecidos sao ignorados
