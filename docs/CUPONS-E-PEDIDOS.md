# Cupons, entrega/retirada, número de pedido e texto do WhatsApp

Cupons e número de pedido são duas funcionalidades que dependem do
**navegador do cliente** (o site é 100% estático, sem servidor/banco); entrega
e retirada é sobre o que aparece pro cliente escolher no checkout; o texto do
WhatsApp é sobre como customizar a mensagem do pedido. Aqui ficam as regras e
os limites de cada um.

## Cupons de desconto

### Validade: dia inteiro OU hora exata (opcional)

No CMS, cada cupom tem:
- **Validade** (data): por padrão o cupom vale até o **fim desse dia** (23:59:59).
- **Hora de expiração (opcional)**: um campo de texto no formato `HH:MM`
  (ex.: `14:30`). Se preenchido, o cupom expira **naquele horário** do dia da
  validade. Se deixado em branco, vale o dia todo.

> **Por que a hora é um campo de texto** e não um seletor bonitinho? O painel
> (Sveltia) já foi derrubado **duas vezes** por causa de widgets de data. O
> widget `string` é o mais à prova de falhas do CMS, e um `pattern` valida o
> formato `HH:MM` na hora de salvar. É uma troca consciente de "beleza do
> seletor" por "não derrubar o painel". Ver [BUGS-E-CORRECOES.md](BUGS-E-CORRECOES.md).

A lógica está em `src/lib/coupon.ts` (`isExpired`) e o schema em
`src/content/cupom-schema.ts` (normaliza a hora para `HH:mm`).

### Uso único por navegador

Quando o cliente finaliza um pedido com um cupom aplicado, o código do cupom é
guardado no `localStorage` (`dn-cupons-usados`). Se ele tentar usar o **mesmo
cupom** de novo, recebe o aviso **"Você já usou este cupom."** e o pedido segue
sem o desconto (nunca trava).

**Limite importante:** como não há servidor, esse controle é **por navegador**.
Ele impede o mesmo aparelho de reaplicar o cupom, mas **não** impede a pessoa de:
- trocar de aparelho/navegador;
- usar aba anônima;
- limpar os dados do navegador.

Para um controle de uso **realmente único por pessoa** seria preciso um backend
(validar o cupom no servidor no momento do pedido) — fora do escopo do site
estático atual. O código fica em `src/lib/coupon-usage.ts`.

## Entrega e retirada

No checkout, o cliente escolhe entre **Retirada** e **Entrega** (com uma
**taxa de entrega** opcional somada ao total). A Nina controla os três pelo
painel do Sveltia (**`/admin`** → **Configurações** → **Entrega e Retirada**),
sem mexer em código:

- **Entrega disponível** (liga/desliga): desmarque para tirar a opção
  "Entrega" do carrinho do cliente — ele só vê "Retirada".
- **Retirada disponível** (liga/desliga): desmarque para tirar a opção
  "Retirada" — o cliente só vê "Entrega" (e o campo de endereço já aparece
  direto, sem precisar escolher).
- **Taxa de entrega (R$)**: valor somado ao total do pedido quando o cliente
  escolhe "Entrega". Use `0` para entrega grátis. A taxa aparece como uma
  linha separada ("Taxa de entrega: R$ X,XX") no carrinho e na mensagem do
  WhatsApp — nunca é somada quando o cliente escolhe "Retirada".
- **Taxa a combinar** (liga/desliga): para quando a Nina ainda não sabe o
  valor do frete (ex.: depende da distância/bairro). Ligado, o cliente vê
  **"Taxa de entrega: A combinar"** em vez de um valor — e esse aviso **não
  soma nada ao total** nem à mensagem do WhatsApp (o valor é combinado depois,
  direto com a Nina). O campo "Taxa de entrega (R$)" continua salvo, mas é
  **ignorado** enquanto esta opção estiver ligada.

### As duas nunca podem ficar desligadas ao mesmo tempo

Se a Nina desmarcar **Entrega disponível** e **Retirada disponível** juntas
(o cliente ficaria sem nenhuma forma de receber o pedido), o site **reativa a
Retirada sozinho** — automaticamente, sem quebrar o build nem precisar de
outra ação. Essa regra fica em `src/lib/checkout-config.ts`
(`normalizeCheckoutConfig`), testada em `tests/checkout-config.test.ts`.

> Por que não um aviso/erro que impede salvar as duas desligadas? O painel do
> CMS (Sveltia) não valida um campo com base em outro campo (só valida cada
> campo isoladamente). Em vez de arriscar um erro confuso ou — pior — deixar a
> configuração inválida ir para o ar e travar o checkout, o site sempre volta
> para um estado seguro (Retirada ligada) sozinho.

### Onde fica cada coisa

| O quê | Arquivo |
|---|---|
| Valores configurados pela Nina (CMS) | `src/content/configuracoes/entrega.json` |
| Campos do painel (liga/desliga + taxa) | `public/admin/config.yml`, collection "configuracoes" → arquivo "entrega" |
| Schema (validação dos valores) | `src/content/configuracoes-schema.ts` |
| Regra "nunca as duas desligadas" | `src/lib/checkout-config.ts` |
| Leitura em build time | `src/data/checkout-config.ts` |
| Seletor no carrinho + soma da taxa ao total | `src/components/CartDrawer.astro` |
| Linha da taxa na mensagem do WhatsApp | `src/lib/whatsapp.ts` |

## Número do pedido (ex.: DN4821)

Cada pedido recebe um número **aleatório** no formato `DN` + 4 dígitos (ex.:
`DN4821`), gerado por `generateOrderId()` em `src/lib/whatsapp.ts`. É só uma
referência para a Nina e o cliente se falarem sobre aquele pedido específico
**naquela conversa** do WhatsApp — a identificação real de qual pedido é qual
continua sendo pelo **nome do cliente e os itens** na mensagem, não pelo
número.

### Por que não é sequencial (DN0001, DN0002...)

Já existiu uma versão com numeração **sequencial e crescente**
(`DN0001`, `DN0002`...), mas foi **desativada a pedido do cliente**. O motivo:
como o site é 100% estático (sem servidor/banco), um contador sequencial só
pode viver no `localStorage` **de cada navegador**. Na prática isso significa
que **todo cliente novo (ou todo aparelho diferente) começaria sempre do zero
em `DN0001`** — não existe uma contagem única compartilhada por todos os
clientes da loja. Isso confundia mais do que ajudava, então o site voltou ao
número aleatório de sempre.

O código sequencial **continua no repositório**, testado e funcional, só que
**não é usado** — fica em `src/lib/order-number.ts`, com uma nota no topo do
arquivo explicando como reativar (é literalmente trocar uma importação e uma
chamada em `src/components/CartDrawer.astro`). Serve como ponto de partida
caso um dia o site ganhe um backend e um contador **global** de verdade faça
sentido (ver "Se um dia quiser controle global" abaixo).

## Texto da mensagem do WhatsApp

O texto que abre no WhatsApp (título, itens, total, dados do cliente etc.) é
montado por `buildOrderMessage()` em `src/lib/whatsapp.ts`. Já existiu uma
versão em que a Nina podia editar o **título** e uma **mensagem final**
(agradecimento) direto pelo painel do Sveltia — essa opção foi **desativada a
pedido do cliente** (a seção "Configurações" não aparece mais no `/admin`; o
bloco correspondente ficou comentado em `public/admin/config.yml` para
referência).

### Editar o texto do WhatsApp manualmente

Como a edição pelo CMS está desligada, para mudar o texto é preciso editar o
código-fonte. Duas constantes no topo de `src/lib/whatsapp.ts` controlam isso:

```ts
const TITULO = 'Novo pedido — Doçuras da Nina';
// mensagem extra no fim do pedido (ex.: um agradecimento). Deixe '' (vazio)
// para nao incluir nenhuma linha a mais.
const MENSAGEM_FINAL = '';
```

Passo a passo (pelo GitHub, sem precisar instalar nada):

1. Abra o arquivo `src/lib/whatsapp.ts` no repositório do GitHub
   (`https://github.com/lukasuvinha/Cardapio_Docuras-da-Nina/blob/main/src/lib/whatsapp.ts`).
2. Clique no ícone de **lápis** (✏️) para editar.
3. Troque o texto dentro das aspas de `TITULO` (aparece em negrito, como
   primeira linha da mensagem) e/ou de `MENSAGEM_FINAL` (aparece no fim da
   mensagem, só se não estiver vazio — ex.: `'Obrigada pela preferência! 💛'`).
4. Role até o final, escreva uma mensagem de commit curta (ex.: "Atualiza
   texto do WhatsApp") e clique em **"Commit changes..."** → confirme na
   branch `main`.
5. O deploy é automático; em 1–2 minutos a mudança está no ar. Para conferir,
   adicione um produto ao carrinho e finalize um pedido de teste.

> Se preferir não mexer direto no código, é só pedir para quem administra o
> projeto trocar essas duas linhas — é uma mudança pequena e rápida.

## Se um dia quiser controle global (backend)

O caminho natural, mantendo o site estático, seria uma pequena função serverless
(ex.: um Cloudflare Worker com KV/D1) que:
- valida e "queima" o cupom no momento do pedido (uso único de verdade);
- entrega o próximo número de pedido global (aí sim faria sentido reativar a
  numeração sequencial de `src/lib/order-number.ts`).

O carrinho chamaria essa função antes de abrir o WhatsApp. Nada do resto do site
precisaria mudar. Fica registrado aqui como evolução possível.
