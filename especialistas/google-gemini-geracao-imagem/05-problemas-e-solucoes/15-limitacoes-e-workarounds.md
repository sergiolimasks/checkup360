# Limitacoes e Workarounds do Gemini

## O Que o Gemini NAO Faz Bem

| Limitacao | Workaround |
|---|---|
| **Texto confiavel em imagens** | Gerar sem texto + adicionar externamente (Canva/Figma) |
| **Consistencia de personagem** | Upload de 2+ refs (rosto + pose). Ate 14 refs suportadas |
| **Maos e dedos** | Esconder, dar objeto, enquadrar acima, forcar anatomia |
| **Seguir instrucoes negativas** | Enquadramento afirmativo (descrever o que QUER) |
| **Expressao neutra** | `"static expression, clinical neutrality, 0% smile"` |
| **Resolucao pra impressao** | Gerar max resolucao + upscaling (Photoshop/Real-ESRGAN) |
| **Aspect ratios corretos** | SEMPRE especificar no prompt ou interface |
| **Logos fieis** | Sempre inserir logo em pos-producao |
| **Numeros e dados** | Quase sempre erram — adicionar externamente |
| **Texto em portugues com acentos** | Gerar em ingles ou sem texto e traduzir depois |

---

## Filtros de Conteudo — 8 Categorias de Bloqueio

| Categoria | Contornavel? |
|---|---|
| NSFW/Pornografico | NAO |
| Remocao de marca d'agua | NAO |
| IP Protegido (Mickey, anime famoso) | Criar personagens originais similares |
| Protecao de menores | NAO (bloqueio absoluto) |
| Figuras publicas | Pedir "pessoa similar" sem identificar |
| Informacao financeira | Usar cenarios hipoteticos |
| Deepfakes | Focar em personagens originais |
| Conteudo sugestivo | Usar descritores claros e nao-sugestivos |

### Falsos Positivos Comuns e Solucoes

- **Ilustracoes medicas**: Adicionar `"Educational medical diagram for anatomy textbook"`
- **Conteudo financeiro legitimo**: `"Example mockup for a UX design portfolio"`
- **Moda com corpo**: `"studio ecommerce photo on white background, catalog lighting, no model"`

### Estrategias pra Conteudo Legitimo

1. **Contexto explicito**: Diga pra que serve (e-commerce, catalogo, educacao)
2. **Separar tarefas**: Prompt de analise + geracao = mais bloqueio. Separe.
3. **Sessao limpa**: Contexto acumulado contamina classificacao. Novo chat.
4. **Trocar modelo**: Se flash bloqueia, tente pro ou vice-versa
5. **Trocar interface**: AI Studio, Gemini App e API usam pools independentes

---

## Quando Usar Outra Ferramenta

| Necessidade | Melhor Ferramenta |
|---|---|
| Texto legivel e preciso | **Ideogram** (90-95% precisao) |
| Imagens artisticas de alto impacto | **Midjourney** |
| Iteracao rapida com cliente | **DALL-E 3 via ChatGPT** |
| Fotografia de produto | **Flux** ou **Gemini** |
| Velocidade e escala | **Gemini Flash** (3-5s) |
| Controle total com pesos/seeds | **Stable Diffusion** (local) |
| Consistencia de personagem | **Midjourney** (--cref/--sref) |

---

## Tecnicas de Iteracao (A Maior Forca do Gemini)

O Gemini permite refinamento multi-turno onde cada edicao constroi sobre a anterior.

### Workflow Recomendado
1. Comece com conceito basico
2. Refine iluminacao: `"faca a iluminacao mais quente, com luz lateral"`
3. Ajuste expressao: `"mude pra mais confiante, com leve sorriso"`
4. Corrija detalhes: `"mude a cor do blazer pra azul marinho"`

### Edicao de Partes (Inpainting)
```
"Replace the blue sofa with a vintage brown leather chesterfield"
"Blur the background behind the subject"
"Remove the object on the table"
"Add a warm sunset glow to the sky only"
```

### UMA Mudanca por Turno
Pedidos compostos ("mude o fundo E a cor da camisa") produzem resultados ruins em ambos.

### Combate ao Drift
Apos muitas edicoes, caracteristicas podem mudar.  
**Solucao**: Reiniciar conversa com descricao detalhada desde o inicio.

---

## As 5 Tecnicas Mais Impactantes (Resumo)

1. **Enquadramento afirmativo**: Descreva o que quer, nunca o que nao quer (~70% dos problemas resolvidos)
2. **Especificacoes de camera real**: Lente, abertura, ISO, modelo — transforma generico em crivel
3. **Imperfeicoes intencionais**: Poros, grao de filme, assimetria — separa "foto" de "IA"
4. **Narrativa em vez de keywords**: Paragrafo descritivo >>> lista de palavras-chave
5. **Iteracao com uma mudanca por turno**: Construa progressivamente

---

## Guia Oficial do Google DeepMind — 5 Componentes

1. **Estilo**: "fotografia editorial", "aquarela", "ilustracao flat"
2. **Sujeito**: Detalhes de aparencia, roupa, idade
3. **Cenario**: Local e ambiente completo
4. **Acao**: O que esta acontecendo
5. **Composicao**: Enquadramento, angulo, perspectiva
