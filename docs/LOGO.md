# Como trocar o logo e a imagem de compartilhamento

O site usa três arquivos de imagem da marca, todos em `public/`. Os caminhos
do logo e da imagem de compartilhamento ficam em `src/config/site.ts`, junto
com o resto da identidade da loja.

| Arquivo (padrão) | Constante em `site.ts` | Onde aparece |
|---|---|---|
| `public/logo.svg` | `SITE_LOGO` | "Selo" redondo da página 404. (A confirmação do pedido mostra um check animado desde o redesign Material 3; a nota no `CartDrawer.astro` explica como voltar o logo para lá.) |
| `public/og-image.png` | `SITE_OG_IMAGE` | Preview do link ao compartilhar (WhatsApp, Instagram, Facebook): `og:image` / `twitter:image` no `BaseLayout.astro`. |
| `public/favicon.svg` | — (fixo no `BaseLayout.astro`) | Ícone da aba do navegador. |

O **nome da loja no cabeçalho** não é imagem: é o texto de `SITE_NAME`, com a
fonte de títulos do tema (`--font-head` em `src/styles/theme.css`). Ao lado dele
fica o **ícone da loja** (quadrado na cor de ação, `--cta`), desenhado em
`src/components/StoreIcon.astro` — troque o `<svg>` de lá por outro ícone de
linha, ou por `<img src={SITE_LOGO} />`.

Os arquivos que vêm no template são da loja fictícia "Doceria Exemplo".

## Trocar o logo

1. Coloque o logo da loja em `public/` — de preferência **SVG** (fica nítido
   em qualquer tamanho) ou **PNG quadrado** com pelo menos 320×320 px.
2. Em `src/config/site.ts`, aponte `SITE_LOGO` para ele:
   ```ts
   export const SITE_LOGO = '/logo-minha-loja.png';
   ```
3. Rode `npm test`: o `tests/logo-oficial.test.ts` confere se o arquivo existe
   e se o selo da 404 usa a imagem.

**Formato do selo.** O selo é um **círculo** de 112 px com uma sombra suave
(`--elev-2`). A imagem é
recortada em círculo (`object-fit: cover`), então:

- logos **quadrados** com a arte centralizada funcionam melhor;
- logos **retangulares/horizontais** terão as laterais cortadas — nesse caso,
  prefira uma versão "ícone" (só o símbolo) do logo;
- se a arte tem **fundo próprio** (ex.: verde sólido), deixe esse fundo
  preencher o quadrado inteiro: o círculo fica como um "medalhão". Se a arte
  é **transparente**, ela aparece sobre o fundo da página e acompanha o modo
  claro/escuro.

A arte do logo tem cores próprias e **não muda com o tema** claro/escuro. Isso
é intencional (como o ícone de um app): a adaptação ao tema fica por conta da
moldura (sombra), que usa os tokens do tema.

## Trocar a imagem de compartilhamento (og-image)

- Tamanho: **1200×630 px**, PNG ou JPG, idealmente com menos de 300 KB.
- Deixe o nome/logo da loja **centralizado** e com margem: alguns apps cortam
  as bordas ou mostram a imagem quadrada.
- Salve em `public/` e ajuste `SITE_OG_IMAGE` em `src/config/site.ts`.
- Depois do deploy, o WhatsApp pode levar um tempo para atualizar o preview
  de links que já foram compartilhados (ele guarda cache).

Um jeito rápido de gerar a imagem a partir de um logo, com o `sharp` (que já
vem instalado como dependência do Astro):

```js
// node gerar-og.mjs
import sharp from 'sharp';
const logo = await sharp('public/logo.png').resize(420, 420, { fit: 'contain', background: '#00000000' }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#FFD9DF' } })
  .composite([{ input: logo, left: 390, top: 105 }])
  .png({ compressionLevel: 9 })
  .toFile('public/og-image.png');
```

## Trocar o favicon

Substitua `public/favicon.svg` por um SVG quadrado simples (o desenho precisa
ser legível em 16×16 px — uma inicial ou um símbolo, não o logo completo). Se
preferir PNG, salve como `public/favicon.png` e troque a linha
`<link rel="icon" ...>` em `src/layouts/BaseLayout.astro`.

## Cores dos arquivos de imagem

Imagens não leem os tokens CSS do tema. Se você criar um tema novo com outra
paleta (ver o topo de `src/styles/theme.css`), lembre de trocar também o
logo, a og-image, o favicon e as ilustrações dos produtos de exemplo.
