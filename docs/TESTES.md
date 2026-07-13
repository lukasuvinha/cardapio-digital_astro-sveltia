# Testes — Doçuras da Nina

`npm test` roda a suíte completa (Vitest). **123 testes, 15 arquivos — todos
passando.**

## O que é coberto

| Arquivo | Testes | Cobre |
|---|---|---|
| `cart-core.test.ts` | 11 | Lógica pura do carrinho: adicionar/incrementar/remover, imutabilidade, linhas e total, ignora itens inválidos/esgotados. |
| `coupon.test.ts` | 20 | Cupom: percentual/valor fixo, expirado, inexistente, vazio, **já usado**, limite do desconto, case-insensitive, validade por dia e por **hora exata**. |
| `cupom-schema.test.ts` | 6 | Schema do cupom: normaliza `validade` (string/`Date`/ISO) e a **hora** opcional (`HH:mm`); rejeita tipo inválido. |
| `whatsapp.test.ts` | 16 | Mensagem do pedido (itens, cliente, entrega, pagamento, observações), **total com desconto**, **taxa de entrega** (linha própria, ordem cupom→taxa→total) e **taxa "a combinar"** (não soma ao total, tem prioridade sobre um valor numérico), título fixo (edição pelo CMS desativada), e o link `wa.me`. |
| `order-number.test.ts` | 3 | Formatação do número sequencial (`DN0001`) — código mantido mas **não usado** (ver `docs/CUPONS-E-PEDIDOS.md`). |
| `menu.test.ts` | 21 | Helpers (foto suportada, categorias, agrupamento), schema Zod do produto, **ordem de exibição** (`porDisponibilidade`: esgotados vão para o fim), e **esconder do cardápio** (`produtosVisiveis`: produtos escondidos somem da lista). |
| `format.test.ts` | 3 | Formatação de preço em R$. |
| `product-card.test.ts` | 4 | Render (Container API): `<img>` com foto, placeholder sem foto, formato incompatível cai no placeholder, contagem de cards. |
| `ui-fase-final.test.ts` | 5 | Estado vazio do cardápio, link do cabeçalho para a home, meta tags de compartilhamento. |
| `logo-oficial.test.ts` | 3 | Selos de confirmação e 404 usam o logo oficial (imagem), não o monograma antigo. |
| `cms-config.test.ts` | 11 | **Guarda do `config.yml`**: parse do YAML, collections presentes, sem widget `date` depreciado, `validade` = datetime+`type: date`, `hora` = string opcional, opções do cupom, categoria = relation, campo `escondido` do produto, arquivo **"entrega"** (entrega/retirada/taxa/**taxa a combinar**) presente, e que o arquivo **"whatsapp" (edição do texto do WhatsApp) permanece desativado**. |
| `produtos-structure.test.ts` | 3 | **Guarda de conteúdo**: fotos são URLs públicas válidas, entradas planas, fotos referenciadas existem. |
| `paginas-institucionais.test.ts` | 8 | Render (Container API) das páginas `/sobre`, `/contato`, `/desenvolvedor` e do rodapé: links do rodapé, `ContactButton` (href/rótulo/nova aba), texto do Sobre, botões de Contato usando as constantes de `site.ts` (não hardcoded), link discreto para `/desenvolvedor`, card do desenvolvedor com nome/GitHub/LinkedIn configurados. |
| `checkout-config.test.ts` | 8 | Regras puras de `normalizeCheckoutConfig`: valores padrão, cada opção desligada isoladamente, **as duas desligadas ao mesmo tempo reativam a Retirada**, a taxa de entrega é repassada (ou `0` por padrão), e a flag "a combinar" é repassada (ou `false` por padrão). |
| `cart-drawer.test.ts` | 1 | Render (Container API) do `CartDrawer` com a config padrão (ambas habilitadas): confere que o seletor Retirada/Entrega chega até o HTML — guarda de fiação entre `checkout-config.ts` e o template. |

Os arquivos em **negrito** são guardas de regressão criadas a partir de
incidentes reais de produção (ver [BUGS-E-CORRECOES.md](BUGS-E-CORRECOES.md)).

## Testes frágeis (atenção)

- **`produtos-structure.test.ts`** e **`cms-config.test.ts`** leem os arquivos
  **reais** de `src/content/` e `public/admin/config.yml`. Isso é proposital (são
  guardas), mas os torna **sensíveis ao conteúdo**: se a Nina cadastrar algo com
  formato inesperado — ainda que válido — ou remover um upload referenciado, o
  teste pode falhar no CI sem haver bug de código. É o preço de pegar problemas
  reais de conteúdo cedo. `produtos-structure` também exige **≥ 6 produtos**; se o
  catálogo encolher abaixo disso, revisar o limite.
- Os testes de render (`product-card`, `ui-fase-final`) comparam **trechos de
  HTML/classes**. Renomear uma classe ou atributo pode exigir ajuste no teste.

## Cobertura que ainda falta

1. **Fluxo do carrinho no navegador (E2E)** — a maior lacuna. O script client-side
   do `CartDrawer` (aplicar cupom, recalcular totais, montar a mensagem e abrir o
   WhatsApp) só é validado **manualmente** hoje. A lógica pura por trás
   (`coupon.ts`, `whatsapp.ts`, `cart-core.ts`) está bem testada, mas a **fiação
   com o DOM** não tem teste automatizado. Um teste Playwright/E2E no CI cobriria
   isso (não está montado no repo por causa do acesso a browsers/CDN no ambiente).
2. **Script da página de detalhe** (`produto/[id].astro`): seletor de quantidade,
   "adicionar ao carrinho" e a **foto ampliável (lightbox)** — sem teste
   automatizado (mesma razão do item 1).
3. **Componente `CartDrawer`** tem só um teste de render "de fiação" (config
   padrão → seletor aparece no HTML — ver `cart-drawer.test.ts`); a interação de
   verdade (cliques, recalcular totais ao trocar Entrega/Retirada, aplicar
   cupom) continua sem teste automatizado — é o componente mais complexo do
   projeto.
4. **Casos de fuso/DST** em `isExpired` — cobertos em datas fixas, não de forma
   exaustiva.

## Sugestão de próximo passo (se quiser fechar a lacuna E2E)

Adicionar Playwright ao projeto e um teste que: adiciona um produto, aplica um
cupom válido e um inválido, e confere que a URL do WhatsApp contém o **total com
desconto**. Isso cobriria de ponta a ponta o caminho que hoje só é conferido à mão.
