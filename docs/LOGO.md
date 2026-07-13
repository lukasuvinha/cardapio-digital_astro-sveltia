# Logo oficial — Doçuras da Nina

## O que mudou

Antes desta mudança, os "selos" circulares do site (tela de confirmação do
pedido e página 404) eram um monograma de **texto** desenhado à mão
("Doçuras da Nina" dentro de um anel dourado), criado como placeholder
enquanto não havia um logo oficial. A imagem de preview de compartilhamento
(`og-image.png`) também usava um emblema circular no mesmo estilo.

Agora todos esses lugares usam o **logo oficial** enviado pela Nina.

> O logo/nome no **cabeçalho** (topo de todas as páginas) **não foi alterado**
> — continua sendo o texto "Doçuras da Nina", conforme pedido. Ele não é um
> selo circular, é a marca-texto do site.

## Arquivos

| Arquivo | O que é | Onde é usado |
|---|---|---|
| `public/Logo-Nina.jpeg` | **Logo oficial**, enviado pela Nina (765×765, fundo verde sólido). Fonte da verdade — não editar/regerar a partir daqui sem necessidade. | Nenhum lugar direto (é a origem dos dois arquivos abaixo). |
| `public/logo-medalhao.png` | Recorte **circular** do logo oficial (com transparência fora do círculo), 320×320, gerado com `sharp`. | Selo da confirmação do pedido (`CartDrawer.astro`) e da página 404. |
| `public/og-image.png` | Imagem de preview de compartilhamento (1200×630), com o logo oficial centralizado sobre um fundo da **mesma cor verde do próprio logo** (não o `--brand` do site — ver "Sobre o tom de verde" abaixo). | `og:image` / `twitter:image` (via `BaseLayout.astro`). |

Os dois arquivos derivados (`logo-medalhao.png` e `og-image.png`) foram
gerados por um script Node com `sharp` (dependência já presente via Astro).
Não há um script salvo no repositório porque foi uma tarefa pontual — os
parâmetros usados estão documentados aqui para caso precise regenerar:

```js
// medalhão circular (320×320, alpha fora do círculo)
sharp('public/Logo-Nina.jpeg').resize(320, 320)
  .composite([{ input: svgCircleMask320, blend: 'dest-in' }])
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/logo-medalhao.png');

// imagem OG (1200×630, fundo = cor de fundo do próprio logo, logo centralizado a 520×520)
sharp({ create: { width: 1200, height: 630, channels: 3, background: { r:12, g:76, b:52 } } })
  .composite([{ input: logoResized520, left: 340, top: 55 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/og-image.png');
```

## Por que um recorte circular (e não o quadrado direto)

O selo (`.dn-confirm__ring` / `.dn-404__ring`) sempre foi um **círculo** com
borda dourada. O logo oficial é entregue num canvas **quadrado**, mas a arte
(a coroa de flores) já é desenhada para caber num círculo — checamos
programaticamente e **menos de 0,01% dos pixels da arte** ficam fora de um
círculo inscrito no quadrado. Ou seja, o recorte circular não corta nada
importante do desenho.

## Sobre o tom de verde (por que não foi "adaptado" recolorindo a arte)

O verde de fundo do logo oficial é `#0c4c34`. Comparado à paleta do site:

| Token do site | Cor | Diferença do logo |
|---|---|---|
| `--brand` (tema claro) | `#1F4D3A` | Muito próxima — quase imperceptível lado a lado. |
| `--brand` (tema escuro) | `#142a1f` | Perceptível — o logo fica visivelmente mais claro/saturado que o fundo escuro do app. |

**No tema claro**, o verde do logo já é tão parecido com o `--brand` do site
que praticamente não há "costura" visível.

**No tema escuro**, existe uma diferença de tom real. A forma prática de
adaptar isso **não foi recolorir a fotografia/arte** (o logo tem traços
dourados finos e sombreados — um ajuste automático de matiz/brilho por tema
arriscava degradar a legibilidade do desenho, e teria que ser refeito toda
vez que o logo mudasse). Em vez disso, a adaptação foi por **moldura**:

- O selo mantém a borda dourada (`var(--gold)`) que já existia no design.
- Foi adicionada uma sombra suave dourada (`box-shadow`) ao redor do círculo,
  para o selo ler como um **medalhão/selo de cera** — um elemento com cor
  própria e fixa, emoldurado de propósito — em vez de parecer um "retângulo
  errado" flutuando sobre o fundo escuro.

Isso é o mesmo princípio usado por qualquer marca com cor própria fixa
(ex.: o ícone de app de várias marcas mantém sua cor original mesmo em um
sistema com tema escuro): o contraste é intencional, não um bug.

Na **imagem de compartilhamento** (`og-image.png`) o problema de costura nem
se aplica: o fundo dos 1200×630 foi preenchido com a **mesma cor exata** do
fundo do logo, então não existe nenhuma borda/emenda visível — o logo parece
"nascer" do próprio fundo da imagem.

## O que falta / próximos passos possíveis

- **Favicon** (`public/favicon.svg`) **não foi alterado**. Ele hoje é um "N"
  estilizado simples (não é um selo com o nome completo "Doçuras da Nina"),
  então tecnicamente não se encaixava no pedido ("círculos com o nome
  Doçuras da Nina"). Se a Nina quiser, dá para gerar um favicon a partir do
  `logo-medalhao.png` (recorte quadrado/redondo em tamanhos pequenos —
  16/32/180px) para deixar o ícone da aba do navegador também com o logo
  oficial. Recomendo pedir para o autor do logo, se possível, uma versão em
  **alta resolução e/ou vetorial (SVG)** do logo — a atual é um JPEG de
  765×765, boa para os usos atuais (selos de até ~150px, imagem OG), mas com
  um vetor a marca escalaria com nitidez perfeita em qualquer tamanho futuro
  (favicon, materiais impressos, etc.).
- Se a Nina trocar o logo no futuro, é só substituir `public/Logo-Nina.jpeg`
  pelo novo arquivo (mesmo nome) e regenerar os dois arquivos derivados com
  os parâmetros acima.
