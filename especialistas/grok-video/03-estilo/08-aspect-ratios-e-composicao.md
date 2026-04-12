# Aspect Ratios e Composição

## 7 Ratios Suportados pelo Grok

| Ratio | Orientação | Melhor Para | Composição |
|-------|-----------|-------------|-----------|
| **9:16** | Vertical | Instagram Reels, TikTok, Stories, WA Status | Sujeito centralizado, espaço vertical |
| **16:9** | Horizontal | YouTube, Websites, Apresentações | Composição cinematica ampla |
| **1:1** | Quadrado | Instagram Feed, Facebook | Centralizado, simétrico |
| **4:3** | Larg. sutil | Apresentações, TV clássica | Balanceado |
| **3:4** | Vert. sutil | Pinterest, retratos | Vertical com menos espaço |
| **3:2** | Fotográfico | Blog headers, portfólios | Composição fotográfica |
| **2:3** | Portrait sutil | Pinterest, retratos | Vertical equilibrado |

---

## Aspect Ratio por Destino (CC360)

| Destino | Ratio | Resolução |
|---------|-------|-----------|
| WhatsApp Status | 9:16 | 720p |
| Instagram Reels | 9:16 | 720p (upscale para 1080p) |
| Instagram Feed | 1:1 | 720p |
| YouTube | 16:9 | 720p |
| TikTok | 9:16 | 720p |
| Facebook Feed | 16:9 ou 1:1 | 720p |
| Apresentação | 16:9 | 720p |

---

## Como o Ratio Afeta o Prompt

### Portrait 9:16 (Mobile-First) — O PRINCIPAL para CC360

- Foco em composição VERTICAL
- Sujeito centralizado ou no terço inferior
- Movimentos verticais funcionam melhor (tilt, crane, pedestal)
- Espaço superior para texto overlay em Stories
- Close-ups e retratos funcionam muito bem
- **EVITAR:** paisagens muito largas ficam comprimidas

**Exemplo de prompt 9:16:**
```
Close-up portrait of a Brazilian woman looking at her phone, 
composed with clean negative space in the upper third for text overlay,
subject positioned in lower two-thirds, vertical framing, 9:16
```

### Landscape 16:9 (YouTube/Desktop)

- Composição cinematica tradicional
- Movimentos horizontais (pan, tracking, orbit)
- Paisagens e ambientes funcionam bem
- Regra dos terços horizontal

### Square 1:1 (Feed)

- Sujeito centralizado
- Composição simétrica
- Funciona para produto e retrato
- Menos espaço narrativo

---

## Reservar Espaço para Texto

Como vídeo IA não gera texto legível, SEMPRE planejar espaço para overlay:

```
[Seu prompt normal], composed with clean negative space in the upper 
third of frame for text overlay, minimal elements in caption area, 
subject positioned in lower two-thirds following rule of thirds
```

---

## Timing por Plataforma

| Plataforma | Duração Ideal | Hook Time |
|------------|--------------|-----------|
| Instagram Reels | 15-30s (gerar 3-6 clips de 5s) | 1.5s |
| TikTok | 15-60s (gerar clips e editar) | 1s |
| YouTube Shorts | 30-60s | 2s |
| Stories | 15s máximo | 1s |
| Facebook Feed | 15s | 3s |
| WhatsApp Status | 30s máximo | 2s |
