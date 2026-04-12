# Design Grafico e Estilo de Ads no Gemini

## O Gemini Consegue Gerar Imagens com Visual de Ad?

Sim, mas com limitacoes. O modelo entende conceitos de fotografia publicitaria e produz composicoes profissionais quando bem instruido.

---

## Termos Poderosos pra Visual de Ad

```
"professional advertisement"
"commercial design"
"marketing banner"
"promotional poster"
"social media ad"
"clean modern layout"
"high-end branding"
"commercial photography style"
"advertising campaign photograph"
"editorial layout"
```

---

## Template pra Criativo de Meta Ad

```
A professional social media advertisement for [PRODUTO/SERVICO], 
[descricao visual do cenario], 
[paleta de cores], clean modern layout, 
commercial photography, [tipo de iluminacao], 
designed for [placement: Instagram feed / stories]
```

**NAO inclua texto no prompt** — adicione depois no Canva.  
**INCLUA copy space** — `"with negative space at the top for text overlay"`

---

## Estilos Visuais que o Gemini Entende

| Estilo | Termo | Uso ideal |
|---|---|---|
| Fotografia comercial | `"commercial photography"` | Ads de produto, lifestyle |
| Editorial | `"editorial photograph"` | Moda, lifestyle premium |
| Flat design | `"flat design illustration"` | Infograficos, tech |
| 3D Render | `"3D render"` | Produto, tech |
| Minimalista | `"minimalist design"` | Marcas premium |
| Abstrato | `"abstract geometric"` | Backgrounds, fintech |

---

## Estilos Artisticos Mais Efetivos

| Estilo | Resultado |
|---|---|
| `"Studio Ghibli"` | Muito requisitado, funciona bem |
| `"Art Nouveau"` | Decorativo e elaborado |
| `"cyberpunk"` | Neons, futurista, consistente |
| `"Baroque"` | Dramatismo e riqueza |
| `"watercolor"` / `"gouache"` | Funciona particularmente bem |
| `"in the style of [artista]"` | Funciona com muitos (Google restringe alguns vivos) |

---

## Mockups e Layouts

O Gemini pode gerar:
- Mockups de produto (genericos)
- Composicoes de poster/banner
- Cenarios de estudio com produto
- Ambientes de lifestyle com produto

O Gemini NAO gera bem:
- Logos utilizaveis
- Layouts com multiplos blocos de texto
- Wireframes de UI
- Mockups de app/tela com dados

---

## Dica pra Estudios Profissionais

Usam multiplas ferramentas:
- **Gemini** pra velocidade e fotos base
- **Midjourney** pra imagens hero de campanha
- **Flux** pra fotografia de produto
- **DALL-E** pra iteracao com cliente
- **Canva/Figma** pra finalizacao

---

## Prompts de Produto Testados pela Comunidade

### Beverage/Comida
```
Commercial beverage photography of [drink]. Condensation on the glass, 
ice if appropriate, fresh garnish. The liquid should look refreshing 
and the colors vibrant but realistic. Dark background with colored accent lighting.
```

### Beauty/Fragrancia
```
High-end fragrance advertising photography, commercial beauty photography standards, 
single key light from camera-left at 45 degrees with warm color temperature 3200K, 
polished black marble surface with elongated vertical reflection beneath the bottle
```

### E-commerce
```
Clean white background. Soft, even lighting that shows the product's true colors 
and details without harsh shadows. Product positioned 30 degrees toward camera.
```

---

## Tecnicas Avancadas

### Imagens de Referencia (Nano Banana 2 / Gemini 3 Pro)
- **Nano Banana 2**: ate 14 imagens de referencia (10 objeto + 4 personagem)
- **Gemini 3 Pro**: ate 11 refs (6 objeto + 5 personagem)
- Forneca refs em alta definicao, de frente
- Atribua nomes distintos a cada personagem no prompt

### Inpainting (Edicao de Areas)
- Forneca imagem original + mascara da area a modificar
- Pode inserir OU remover objetos
- `"Change only the [elemento] to [novo]. Keep everything else exactly the same."`

### Outpainting (Expansao)
- Expande conteudo alem das bordas originais
- O modelo continua logicamente a cena existente

---

## Checklist pra Criativo de Ad no Gemini

1. [ ] Prompt com estilo fotografico especifico
2. [ ] Iluminacao explicita
3. [ ] Copy space solicitado
4. [ ] Aspect ratio correto pra placement
5. [ ] SEM texto no prompt
6. [ ] 4-6 variacoes geradas
7. [ ] Melhor selecionada pra pos-producao
8. [ ] Texto adicionado no Canva
9. [ ] Logo inserido
10. [ ] Exportado na resolucao correta
