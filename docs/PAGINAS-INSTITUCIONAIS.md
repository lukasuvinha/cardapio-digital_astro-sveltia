# Páginas institucionais, rodapé e crédito do desenvolvedor

Duas páginas estáticas, **Sobre** (`/sobre`) e **Contato** (`/contato`), com
links no **rodapé** de todas as páginas e na **barra superior** no desktop.

## Rodapé

`src/components/Footer.astro`, presente em todas as páginas.

No computador, uma faixa em três colunas e, abaixo de uma linha fina, a linha
de base:

```
Doceria Exemplo                        Sobre · Contato        (Instagram) (TikTok) (Facebook)
Doceria Artesanal
Pedidos de terça a sábado, das 9h às 18h
─────────────────────────────────────────────────────────────────────────────────────
© 2026 Doceria Exemplo                                              Site feito por lukasuvinha
```

No celular, a marca e os ícones dividem a primeira linha; links e horário
vêm logo abaixo (quebrando linha se não couberem); por fim a linha de base:

```
Doceria Exemplo           (Instagram) (TikTok) (Facebook)
Doceria Artesanal
Sobre · Contato
Pedidos de terça a sábado, das 9h às 18h
──────────────────────────────────────────────────────
© 2026 Doceria Exemplo            Site feito por lukasuvinha
```

O ano do © é o do build (o site é estático, então ele atualiza a cada
publicação).

| Linha | De onde vem | Some quando |
|---|---|---|
| Nome · slogan | `SITE_NAME`, `SITE_TAGLINE` em `src/config/site.ts` | — |
| Ícones das redes sociais | Painel: **Configurações → Rodapé → Redes sociais** | nenhuma rede ligada com link |
| Sobre · Contato | fixo | — |
| © ano e nome da loja | `SITE_NAME` | — |
| Horário de pedidos | Painel: **Configurações → Rodapé** | chave "Mostrar horário de pedidos" desligada, ou texto vazio |
| Crédito do desenvolvedor | `DEV_NAME`, `DEV_URL` | `DEV_CREDIT_ENABLED = false` |

Os ícones são **desenhos de traço genéricos** (`src/components/SocialIcon.astro`),
não os logos das marcas; cada link tem `aria-label` ("Instagram da Doceria
Exemplo"). O WhatsApp **não** fica no rodapé: ele tem o botão dedicado da
página Contato (o ícone antigo ficou comentado em `Footer.astro`, com nota de
como reativar).

### Horário e redes sociais (no painel)

Em **Configurações → Rodapé** (`src/content/configuracoes/rodape.json`):

- **Mostrar horário de pedidos** (liga/desliga) e quatro menus: **Pedidos a
  partir de (dia)**, **Até (dia)**, **Das (hora)** e **Às (hora)** (de meia em
  meia hora). O **texto é fixo**, montado a partir dessas escolhas:
  - "Pedidos de terça a sábado, das 9h às 18h";
  - mesmo dia no início e no fim: "Pedidos às terças, das 9h às 18h" (ou
    "aos sábados", "aos domingos");
  - de segunda a domingo: "Pedidos todos os dias, das 9h às 18h".

  Desligado, a linha some; os dias e horas continuam salvos para quando
  religar. A regra fica em `textoHorario` (`src/content/rodape-schema.ts`).
- **Redes sociais** — uma lista: em cada item, escolha a **rede** (Instagram,
  TikTok, Facebook, Pinterest, X, YouTube ou Threads), cole o **link do
  perfil** e use **Mostrar no site** para ligar ou esconder sem apagar.
  - O link é **obrigatório** e precisa ser completo, começando com
    `https://` (o painel não deixa salvar sem ele).
  - Mesmo assim, o site só mostra a rede que estiver **ligada e com link
    válido**; se a mesma rede for cadastrada duas vezes, vale a primeira.
  - A ordem da lista é a ordem dos ícones.
- As mesmas redes aparecem como botões na página **Contato**.
- No celular cabem 3 ícones por linha ao lado da marca; com mais redes, eles
  quebram para a linha de baixo.

### Crédito do desenvolvedor

Uma linha discreta, "Site feito por {DEV_NAME}", em texto pequeno e cor de
baixo contraste, com link para `DEV_URL` (`rel="nofollow noopener"`, abre em
nova aba). **Combine com o cliente** antes de publicar: o site é dele. Para
tirar, `DEV_CREDIT_ENABLED = false` em `src/config/site.ts`.

> A antiga página `/desenvolvedor` foi **desativada** (o crédito no rodapé a
> substitui). O código continua em `src/pages/_desenvolvedor.astro` — o `_` no
> nome faz o Astro não gerar a rota. Para reativar, renomeie de volta para
> `desenvolvedor.astro` e descomente o link em `src/pages/contato.astro`.

## Página Sobre

Conteúdo editado no painel: **Configurações → Página Sobre**
(`src/content/configuracoes/sobre.json`). Tudo é opcional:

- **Foto** — da pessoa, da equipe ou da loja (horizontal, 4:3, funciona
  melhor). No desktop fica ao lado do texto; no celular, acima.
- **Texto** — em tom pessoal. Uma **linha em branco** separa os parágrafos.
- **Texto do botão para o cardápio** — em branco, usa "Ver Cardápio".

Sem foto e sem texto, a página mostra só o título e o botão. O título usa
`SITE_NAME` ("Sobre a Doceria Exemplo"); se o nome pedir artigo masculino,
troque "a" por "o" em `src/pages/sobre.astro`.

O template vem com um texto e uma ilustração de exemplo
(`public/img/sobre/doceria-exemplo.webp`); troque pelos da loja.

## Página Contato

- **Botão principal "Chamar no WhatsApp"** (verde, a cor de envio), com o
  número de `src/config/site.ts`.
- Um botão para cada **rede social** ligada no painel (as mesmas do rodapé,
  em Configurações → Rodapé).
- **Como encomendar** — editado no painel em **Configurações → Página
  Contato** (`src/content/configuracoes/contato.json`): **Antecedência**,
  **Região de entrega**, **Retirada** e **Formas de pagamento**. Cada item em
  branco some; com todos em branco, a seção inteira some.

## Trocar o WhatsApp e o crédito

Em [`src/config/site.ts`](../src/config/site.ts):

```ts
export const WHATSAPP_NUMBER = '5511999999999'; // só dígitos: 55 + DDD + número
export const DEV_CREDIT_ENABLED = true;
export const DEV_NAME = 'lukasuvinha'; // nick do GitHub
export const DEV_URL = 'https://github.com/lukasuvinha';
```

O `WHATSAPP_NUMBER` é o mesmo usado no envio dos pedidos — trocar lá atualiza
o botão do carrinho e o da página Contato. Horário e redes sociais são
editados no painel (acima).

## Onde fica cada coisa no código

| O quê | Arquivo |
|---|---|
| Rodapé (marca, ícones, links, horário, crédito) | `src/components/Footer.astro` |
| Horário e redes (schema, regras e leitura) | `src/content/rodape-schema.ts`, `src/data/rodape.ts` |
| Ícones de traço (redes, WhatsApp, GitHub, LinkedIn) | `src/components/SocialIcon.astro` |
| Botão de link (ícone + rótulo) | `src/components/ContactButton.astro` |
| Página Sobre | `src/pages/sobre.astro` |
| Página Contato | `src/pages/contato.astro` |
| Conteúdo editável (schemas e leitura) | `src/content/paginas-schema.ts`, `src/data/paginas.ts` |
| Campos do painel | `public/admin/config.yml`, Configurações → "sobre", "contato" e "rodape" |
| Página Desenvolvedor (desativada) | `src/pages/_desenvolvedor.astro` |
| Número do WhatsApp e crédito | `src/config/site.ts` |

## Testes

`tests/rodape.test.ts` cobre as regras do horário e das redes (só ligadas e
com link válido, ordem, repetidas) e os campos do painel.
`tests/paginas-institucionais.test.ts` cobre o rodapé (links, layout,
crédito com `nofollow` e nova aba, sem atalho de WhatsApp), a desativação da
página `/desenvolvedor`, as páginas Sobre e Contato sem conteúdo do CMS (nada
de seção vazia) e o conteúdo de exemplo dos JSON.
