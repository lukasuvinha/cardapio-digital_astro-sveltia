# src/content

**Content Collections do Astro** (ver `config.ts`).

## Collection `produtos`

Fonte da verdade dos produtos do cardápio, **editável pelo dono da loja** via Sveltia CMS
(painel em `/admin`, configurado em `public/admin/config.yml`).

- Cada produto é **um arquivo plano** `produtos/<id>.md` (frontmatter: `nome`,
  `descricao`, `preco`, `categoria`, `disponivel`, `escondido`, `foto`). Esse é o
  formato padrão de folder collection — o que o Sveltia CMS **lista** corretamente.
- O campo **`foto` é uma URL pública** (ex.: `/uploads/foo.webp`). As fotos
  enviadas pelo painel ficam em [`public/uploads/`](../../public/uploads/) e são
  servidas como estão; as ilustrações dos produtos de exemplo ficam em
  `public/img/produtos/`.

### Por que a foto NÃO usa o `image()` do Astro (3 incidentes)

O `image()`/`<Picture>` otimiza no build, mas **hard-faila o build inteiro** se
a imagem não resolver — e como as fotos vêm de uploads do dono da loja, isso quebrou o
deploy **três vezes**:

1. Fotos co-locadas com os `.md` (`media_folder: ""`) → excluir 1 produto apagou
   as fotos de **todos** e quebrou o build.
2. Subpasta por produto (`path: "{{slug}}/index"`) → o painel parou de **listar**
   os produtos.
3. Foto em `public/` referenciada por `image()` → o Sveltia sobe as fotos para
   `public/`, mas o `image()` só resolve em `src/` → **build quebrado**.

**Solução atual (robusta):** `foto` é uma string/URL de `/public`. O build
**nunca processa** a imagem, então nenhum upload consegue quebrar o deploy. A
**otimização acontece no upload** — o Sveltia converte para WebP e redimensiona
no navegador antes de commitar (ver `media_libraries.transformations` em
`public/admin/config.yml`). Formatos incompatíveis são bloqueados no upload
(`accept`) e, se algo escapar, o produto cai no placeholder (nunca imagem
quebrada). Há testes de regressão que barram o retorno de imagens para dentro de
`src/content/produtos/` e o uso de caminhos `/src/...`.

- O schema (tipos) fica em [`produto-schema.ts`](./produto-schema.ts) e é
  validado no build. Os testes cobrem esse schema.

Os componentes/páginas leem via `getProdutos()` em
[`src/data/menu.ts`](../data/menu.ts).

## Outras collections

- **`categorias/`** — categorias dos doces, editáveis pelo dono da loja no CMS (o campo
  `categoria` de cada produto é um `relation` para esta collection). Cada uma tem
  uma **cor** opcional (morango, caramelo, cacau, baunilha ou neutro) que pinta o
  card, o chip e o detalhe do produto; sem cor, ela é distribuída automaticamente.
  Schema em [`categoria-schema.ts`](./categoria-schema.ts).
- **`cupons/`** — cupons de desconto, schema em [`cupom-schema.ts`](./cupom-schema.ts).
  Lógica de validade/desconto em [`src/lib/coupon.ts`](../lib/coupon.ts). Ver
  [`docs/CUPONS-E-PEDIDOS.md`](../../docs/CUPONS-E-PEDIDOS.md).
- **`configuracoes/`** — arquivos singulares editados no painel em
  **Configurações**. Cada um é uma collection própria em `config.ts` (cada
  collection do Astro só aceita um schema):

  | Arquivo | Collection | Schema | O que configura |
  |---|---|---|---|
  | `entrega.json` | `configuracoes` | [`configuracoes-schema.ts`](./configuracoes-schema.ts) | Entrega, retirada e taxa |
  | `fornada.json` | `fornada` | [`fornada-schema.ts`](./fornada-schema.ts) | Aviso de próxima fornada |
  | `sobre.json` | `sobre` | [`paginas-schema.ts`](./paginas-schema.ts) | Foto, texto e botão da página Sobre |
  | `contato.json` | `contato` | [`paginas-schema.ts`](./paginas-schema.ts) | "Como encomendar" da página Contato |

  A pasta também guarda `whatsapp.json`, que **não é lido**: era usado para
  editar o texto do WhatsApp pelo painel, opção desativada a pedido do cliente.
  Fica no repositório para referência/reativação — ver
  `docs/CUPONS-E-PEDIDOS.md`.

## Histórico

- Antes do CMS, os produtos vinham de `src/data/products.json` (mantido no repo,
  com o caminho comentado em `menu.ts` para reativação, se necessário).
- Na Fase 1 havia aqui um `menu.ts` com outro schema; foi migrado para
  `src/data/` e depois para esta collection. Tudo permanece no histórico do git.
