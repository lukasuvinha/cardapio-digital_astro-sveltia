# Doçuras da Nina — Cardápio Digital

Cardápio digital estático da **Doçuras da Nina** (doceria artesanal: brownies,
brigadeiros, bolos de pote e cookies gourmet). O cliente navega pelos produtos,
monta o carrinho no próprio navegador e, ao finalizar, o site abre o WhatsApp da
Nina com a mensagem do pedido pronta. **Sem banco de dados e sem cadastro** — é
um site 100% estático.

A Nina gerencia produtos, categorias e cupons sozinha por um painel visual
(Sveltia CMS), sem mexer em código.

## Stack

- **[Astro](https://astro.build)** com saída estática (`output: 'static'`, sem adapter — não há SSR).
- **Cloudflare Worker com static assets** (não Cloudflare Pages), configurado em `wrangler.jsonc`.
- **[Sveltia CMS](https://github.com/sveltia/sveltia-cms)** (compatível com Decap/Netlify CMS) para a Nina editar o conteúdo.
- **[Vitest](https://vitest.dev)** para os testes (139 no total — ver [docs/TESTES.md](docs/TESTES.md)).

## Scripts

```bash
npm install       # instala as dependências
npm run dev       # servidor de desenvolvimento (http://localhost:4321)
npm run build     # gera o site estático em ./dist
npm run preview   # pré-visualiza o build local
npm test          # roda a suíte de testes (Vitest)
```

## Funcionalidades

- **Cardápio** com grade de produtos e filtro por categoria (client-side, sem recarregar).
  Produtos **esgotados vão para o final da lista** (ainda visíveis ao rolar a
  página até o fim, só não ficam à vista assim que o cliente entra no site).
- **Esconder do Cardápio**: a Nina pode esconder um produto do site inteiro (grade e
  página de detalhe) sem apagar nada — nome, descrição, preço e foto continuam
  no CMS, prontos para reativar quando quiser.
- **Página de detalhe** por produto (`/produto/:id`), com seletor de quantidade e
  **foto ampliável** (toque/clique na foto abre em tela cheia).
- **Carrinho no navegador** (localStorage) com passos carrinho → checkout → confirmação.
- **Cupons de desconto**: percentual ou valor fixo, com validade por dia ou até uma
  **hora exata**. Cupom inválido/expirado/**já usado** dá aviso claro e **não trava**
  o pedido. Uso único por navegador (ver [docs/CUPONS-E-PEDIDOS.md](docs/CUPONS-E-PEDIDOS.md)).
- **Entrega e retirada configuráveis**: a Nina liga/desliga cada opção pelo CMS e
  define a **taxa de entrega** (somada ao total só quando o cliente escolhe
  Entrega) — ou marca **"Taxa a combinar"** quando ainda não sabe o valor do
  frete. As duas opções nunca ficam desligadas ao mesmo tempo — ver
  [docs/CUPONS-E-PEDIDOS.md](docs/CUPONS-E-PEDIDOS.md#entrega-e-retirada).
- **Banner "Próxima fornada"** (opcional) no topo do cardápio: liga/desliga
  pelo CMS, escolhe entre uma **data e hora exatas** ou um aviso genérico
  **"Em preparação"** para quando ainda não há data definida — ver
  [docs/CUPONS-E-PEDIDOS.md](docs/CUPONS-E-PEDIDOS.md#próxima-fornada).
- **Número de pedido aleatório** (ex.: `DN4821`) — existe uma versão sequencial
  no código (desativada de propósito; ver [docs/CUPONS-E-PEDIDOS.md](docs/CUPONS-E-PEDIDOS.md)).
- **Pedido via WhatsApp**: abre o WhatsApp da Nina com itens, subtotal, desconto,
  total, dados do cliente, forma de entrega e pagamento. O texto (título e
  mensagem final) é fixo no código — editável manualmente
  (ver [docs/CUPONS-E-PEDIDOS.md](docs/CUPONS-E-PEDIDOS.md)); o número de
  destino é trocável em minutos (ver [Pedido via WhatsApp](#pedido-via-whatsapp) abaixo).
- **Tema claro/escuro** com persistência e respeito à preferência do sistema.
- **Estados de erro/vazio**: imagem quebrada e produto sem foto caem num
  placeholder; cardápio sem produtos mostra "Cardápio em atualização"; rota
  inexistente mostra a página 404 na identidade da marca.
- **Meta tags de compartilhamento** (Open Graph + Twitter) para o preview do link
  ficar bonito no WhatsApp e redes.
- **Páginas institucionais** (`/sobre`, `/contato`, `/desenvolvedor`), alcançadas
  por links discretos no rodapé — ver [Páginas institucionais](#páginas-institucionais) abaixo.

## Estrutura

```
src/
  pages/
    index.astro          # cardápio (home)
    produto/[id].astro   # página de detalhe de cada produto (estática)
    404.astro            # página de rota não encontrada
    sobre.astro          # página institucional "Sobre" (texto editável)
    contato.astro        # página institucional "Contato" (WhatsApp/Instagram)
    desenvolvedor.astro  # página "Desenvolvedor" (link discreto em /contato)
    admin/index.astro    # painel do CMS (carrega o Sveltia)
  components/            # Header, Footer, ThemeToggle, ProductCard, ProductGrid,
                         # ProductImage, CategoryNav, CartDrawer, ContactButton,
                         # FornadaBanner
  config/
    site.ts              # WHATSAPP_NUMBER, INSTAGRAM_URL, dados do dev, nome do site
  layouts/
    BaseLayout.astro     # <head>, fontes, tema, meta tags de compartilhamento
  content/
    config.ts            # Content Collections (produtos, categorias, cupons, configuracoes)
    produto-schema.ts    # schema Zod dos produtos (testável)
    cupom-schema.ts      # schema Zod dos cupons (testável)
    configuracoes-schema.ts # schema Zod da config de entrega/retirada (testável)
    fornada-schema.ts    # schema Zod do banner "Próxima fornada" (testável)
    produtos/*.md        # 1 arquivo por produto (editado pela Nina)
    categorias/*.md      # categorias (editadas pela Nina)
    cupons/*.md          # cupons de desconto (editados pela Nina)
    configuracoes/
      entrega.json        # entrega/retirada + taxa (editado pela Nina no CMS)
      fornada.json         # banner "Próxima fornada" (editado no CMS)
      whatsapp.json        # NÃO usado atualmente (edição pelo CMS desativada;
                           # ver docs/CUPONS-E-PEDIDOS.md)
  data/
    menu.ts              # leitura dos produtos (build time)
    menu-helpers.ts      # helpers puros e testáveis (agrupar/filtrar/ordenar)
    cupons.ts            # leitura dos cupons (build time)
    checkout-config.ts   # leitura da config de entrega/retirada (build time)
    fornada.ts            # leitura do banner "Próxima fornada" (build time)
    products.json        # fonte de dados ANTIGA (pré-CMS), mantida para referência
  lib/
    cart-core.ts         # lógica pura do carrinho
    cart-store.ts        # store do carrinho (localStorage)
    coupon.ts            # lógica pura dos cupons (validação/desconto)
    coupon-usage.ts      # uso único de cupom por navegador (localStorage)
    checkout-config.ts   # regras puras de entrega/retirada (nunca as duas desligadas)
    fornada-banner.ts    # regras puras do banner (texto/visibilidade, formata a data)
    order-number.ts      # numeração sequencial — NÃO usada atualmente (ver
                         # docs/CUPONS-E-PEDIDOS.md)
    whatsapp.ts          # montagem da mensagem e do link do WhatsApp
    format.ts            # formatação de preço (R$)
    slug.ts              # slug de categorias
  styles/global.css      # paleta e tokens de tema claro/escuro
public/
  admin/config.yml       # configuração do Sveltia CMS
  favicon.svg            # ícone da aba do navegador (não é o logo oficial)
  Logo-Nina.jpeg         # logo oficial da marca (fonte da verdade)
  logo-medalhao.png      # logo recortado em círculo (selos do site)
  og-image.png           # imagem de preview de compartilhamento (1200×630)
  uploads/               # fotos enviadas pela Nina (otimizadas no upload)
docs/                    # documentação técnica (ver seções abaixo)
tests/                   # testes Vitest
```

## Como a Nina edita o conteúdo (Sveltia CMS)

O painel fica em **`/admin`** (ex.: `https://SEU-SITE/admin`). A Nina entra com a
conta do GitHub autorizada e pode:

- **Produtos** — nome, descrição, preço, categoria, disponibilidade, **esconder do
  cardápio** (esconde do site sem apagar — diferente de "indisponível", que ainda
  mostra o produto com o selo "Esgotado") e foto.
- **Categorias** — criar novas categorias conforme começar a vender outros doces.
- **Cupons** — código, tipo de desconto (percentual/valor fixo), valor, validade e
  uma **hora de expiração opcional** (`HH:MM`).
- **Configurações → Entrega e Retirada** — liga/desliga cada opção do checkout e
  define a taxa de entrega (ver [docs/CUPONS-E-PEDIDOS.md](docs/CUPONS-E-PEDIDOS.md#entrega-e-retirada)).
- **Configurações → Próxima Fornada** — liga/desliga o banner do topo do
  cardápio e escolhe entre data/hora exatas ou o aviso genérico "em
  preparação" (ver [docs/CUPONS-E-PEDIDOS.md](docs/CUPONS-E-PEDIDOS.md#próxima-fornada)).

A configuração do painel está em [`public/admin/config.yml`](public/admin/config.yml)
e corresponde 1:1 aos schemas das Content Collections em `src/content/`.

> O texto da mensagem do WhatsApp **não** é editável pelo painel (foi
> desativado de propósito). Para mudá-lo, é preciso editar o código — ver
> [docs/CUPONS-E-PEDIDOS.md](docs/CUPONS-E-PEDIDOS.md), seção "Editar o texto
> do WhatsApp manualmente".

> A foto tem uma **dica de proporção** (4:3, ~1200×900) no próprio campo do CMS —
> não é obrigatória, só ajuda a foto a cair certinha no molde do cardápio.

### Fotos: por que o build nunca quebra por causa de uma foto

As fotos vão para `public/uploads/` e são referenciadas por **URL pública** (ex.:
`/uploads/foto.webp`). Como ficam em `/public`, são servidas como estão e o
**build nunca as processa** — um upload ruim não tem como derrubar o deploy.
A otimização (converter para WebP + redimensionar) acontece **no navegador, no
momento do upload**, pelo próprio Sveltia (ver `media_libraries` no `config.yml`).

> Isso é uma decisão deliberada: usar o `image()` do Astro (que otimiza no build)
> já quebrou o deploy 3 vezes, porque ele falha o build inteiro se uma imagem não
> resolver. Ver [docs/BUGS-E-CORRECOES.md](docs/BUGS-E-CORRECOES.md).

## Tema claro/escuro

Os tokens de cor ficam em `src/styles/global.css` como CSS custom properties.
O `BaseLayout` define `data-theme` antes da pintura (lê `localStorage` ou a
preferência do sistema) para não piscar, e o `ThemeToggle` alterna e persiste a
escolha. Todo componente herda a compatibilidade com os dois temas via as
variáveis — **evite cores fixas fora da paleta**.

## Compartilhamento do link e configuração do domínio

As meta tags de Open Graph/Twitter (em `BaseLayout.astro`) usam **URLs absolutas**
montadas a partir de `Astro.site`, definido em **`astro.config.mjs`**. A imagem de
preview é `public/og-image.png` (1200×630).

### ⚠️ O que fazer quando comprar o domínio da Nina

1. Abra **`astro.config.mjs`** e troque a linha `const SITE_URL = ...` pela URL
   real, **sem barra no final**. Ex.:
   ```js
   const SITE_URL = 'https://docurasdanina.com.br';
   ```
2. `npm run build` e faça o deploy (push na `main`).
3. No painel da Cloudflare, aponte o domínio para o Worker (Workers & Pages →
   este Worker → *Custom Domains*).

Não é preciso mexer em mais nada: `BaseLayout` passa a gerar `og:url`, `canonical`
e `og:image` com o endereço novo automaticamente. **Enquanto o domínio não é
definido, o preview do link pode não aparecer** — é só isso que falta.

> Se a Nina também for usar o painel `/admin` num domínio próprio, confirme que o
> Worker de login OAuth (`base_url` no `config.yml`) continua acessível — ele já
> está deployado e não muda com o domínio do site.

## Acessibilidade e performance

- Contraste ajustado para AA (ex.: preço/total usam um dourado mais escuro
  legível em fundo claro — `--gold-text`).
- Foco de teclado visível e consistente em todo o site.
- `prefers-reduced-motion` respeitado.
- Estados de `:hover` só se aplicam em dispositivos com cursor real
  (`@media (hover: hover)`) — no toque (mobile), o hover não "gruda" no botão
  depois de tocar (ver [docs/BUGS-E-CORRECOES.md](docs/BUGS-E-CORRECOES.md), item 7).
- Fontes carregadas de forma **não bloqueante** (a página pinta na hora com a
  serifada de fallback e troca quando as fontes da marca chegam).
- Lighthouse (mobile): **Acessibilidade 100, SEO 100**, Performance ~80–100.

## Deploy (Cloudflare Workers Builds)

O deploy é disparado por **`git push` na branch `main`** via integração Git
nativa da Cloudflare (Workers Builds). Configuração feita **uma vez** no painel:

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`
- **Assets:** `./dist` (definido em `wrangler.jsonc`; `not_found_handling` usa a `404.html`)

Nenhum token de API fica no repositório — as credenciais ficam guardadas na
Cloudflare.

## Pedido via WhatsApp

O número da Nina fica em [`src/config/site.ts`](src/config/site.ts) na constante
`WHATSAPP_NUMBER`, no formato internacional e **só dígitos** (`55` + DDD + número).
O número do WhatsApp **não é segredo** — é público por natureza — então pode ficar
no código do build. (Isso vale só para o número; chaves/tokens de serviços
externos nunca podem ir hardcoded no build.)

### Como trocar o número (se a Nina mudar de telefone)

O número **não** está no painel do Sveltia (`/admin`) — é um arquivo de código,
então a troca é direto no GitHub. Passo a passo:

1. No navegador, abra o arquivo `src/config/site.ts` no repositório do GitHub
   (`https://github.com/lukasuvinha/Cardapio_Docuras-da-Nina/blob/main/src/config/site.ts`).
2. Clique no ícone de **lápis** (✏️) no canto superior direito para editar.
3. Troque o número dentro das aspas em `WHATSAPP_NUMBER`, sempre no formato
   `55` + DDD + número, **só dígitos, sem espaço, traço ou parênteses**.
   Exemplo: `(11) 91234-5678` vira `'5511912345678'`.
4. Role até o final da página, escreva uma mensagem curta (ex.: "Atualiza número
   do WhatsApp") e clique em **"Commit changes..."** → confirme direto na branch
   `main`.
5. O deploy é automático (Cloudflare Workers Builds já está configurado — ver
   seção "Deploy" abaixo). Em 1–2 minutos o site novo está no ar.
6. Para confirmar: abra o site, adicione um produto ao carrinho, finalize o
   pedido e veja se o WhatsApp abre com o número novo.

> Se preferir não mexer direto no GitHub, é só pedir para quem administra o
> projeto trocar essa linha — é uma mudança de uma linha só.

## Páginas institucionais

Três páginas estáticas — **`/sobre`**, **`/contato`** e **`/desenvolvedor`** —
alcançadas por links discretos no **rodapé** (presente no cardápio, na página
de detalhe de produto e na 404):

- **Sobre**: texto sobre a doceria (hoje é um texto **genérico**, para o site
  já ir ao ar — a Nina deve trocar por um texto próprio quando quiser).
- **Contato**: estilo "linktree" simples, com botões para **WhatsApp** e
  **Instagram** da Nina. No fim da página tem um link discreto
  "Desenvolvedor".
- **Desenvolvedor**: só alcançada pelo link acima (não aparece no rodapé);
  card com o nome de quem fez o site e botões para **GitHub** e **LinkedIn**.

Nenhuma dessas páginas depende do CMS — são conteúdo estático no código, então
as edições são feitas direto no GitHub, do mesmo jeito que a troca do número
do WhatsApp acima. Passo a passo completo (trocar o texto do Sobre, o link do
Instagram, o número do WhatsApp e os dados do card Desenvolvedor) está em
[**docs/PAGINAS-INSTITUCIONAIS.md**](docs/PAGINAS-INSTITUCIONAIS.md).

> ⚠️ **Antes de divulgar o site**: o link do Instagram (`INSTAGRAM_URL`) e o
> do LinkedIn do desenvolvedor (`DEV_LINKEDIN_URL`), ambos em
> [`src/config/site.ts`](src/config/site.ts), estão com **valores de
> exemplo (placeholder)** — troque pelos links reais.

## Testes

`npm test` roda a suíte (Vitest). Cobre a lógica pura (carrinho, cupons,
formatação, WhatsApp, schemas), a estrutura dos produtos (guarda de regressão
contra os incidentes de CMS) e a renderização de componentes (Container API do
Astro). Ver [docs/TESTES.md](docs/TESTES.md) para o detalhamento e os pontos de
cobertura ainda em aberto.

## Logo oficial

O logo oficial da marca é `public/Logo-Nina.jpeg`. Os selos circulares do site
(confirmação de pedido e página 404) e a imagem de compartilhamento usam
versões derivadas dele. Detalhes de onde cada arquivo é usado, por que o
recorte é circular, e como o tom de verde do logo foi conciliado com a
paleta do site (sem recolorir a arte) estão em
[**docs/LOGO.md**](docs/LOGO.md).

## Bugs e correções

O histórico dos incidentes (principalmente com o CMS em produção) e como cada um
foi resolvido — e blindado contra repetição — está em
[**docs/BUGS-E-CORRECOES.md**](docs/BUGS-E-CORRECOES.md).

## Convenções do projeto

- **Nunca apagar** código de funcionalidade removida: comentar no lugar,
  indicando onde estava e como reativar.
- Preferir **componentes reutilizáveis** a código específico de uma página.
- **Sempre** preservar compatibilidade com os temas claro e escuro.
- **Nunca** hardcodar credenciais/chaves/tokens no código do build.
- Rodar um **scan de segredos** no diff e no histórico antes de cada PR.
- Alterações mínimas, mantendo o estilo visual existente.
- Documentação de commits e PRs em **português**.
# cardapio-digital_astro-sveltia
# cardapio-digital_astro-sveltia
