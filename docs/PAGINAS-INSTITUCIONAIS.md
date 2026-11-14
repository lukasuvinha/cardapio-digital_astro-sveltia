# Páginas institucionais, rodapé e crédito do desenvolvedor

Duas páginas estáticas, **Sobre** (`/sobre`) e **Contato** (`/contato`), com
links no **rodapé** de todas as páginas e na **barra superior** no desktop.

## Rodapé

`src/components/Footer.astro`, presente em todas as páginas:

```
        Doceria Exemplo · Doceria Artesanal
              (WhatsApp)  (Instagram)
                Sobre  ·  Contato
     Pedidos de terça a sábado, das 9h às 18h
               Site feito por Lukas
```

| Linha | De onde vem | Some quando |
|---|---|---|
| Nome · slogan | `SITE_NAME`, `SITE_TAGLINE` em `src/config/site.ts` | — |
| Ícones de WhatsApp e Instagram | `WHATSAPP_NUMBER`, `INSTAGRAM_URL` | — |
| Sobre · Contato | fixo | — |
| Horário de pedidos | `ORDER_HOURS` | `ORDER_HOURS = ''` |
| Crédito do desenvolvedor | `DEV_NAME`, `DEV_URL` | `DEV_CREDIT_ENABLED = false` |

Os ícones são **desenhos de traço genéricos** (`src/components/SocialIcon.astro`),
não os logos das marcas; cada link tem `aria-label` ("WhatsApp da Doceria
Exemplo").

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

- **Botão principal "Chamar no WhatsApp"** (verde, a cor de envio) e o botão
  do **Instagram** — links de `src/config/site.ts`.
- **Como encomendar** — editado no painel em **Configurações → Página
  Contato** (`src/content/configuracoes/contato.json`): **Antecedência**,
  **Região de entrega**, **Retirada** e **Formas de pagamento**. Cada item em
  branco some; com todos em branco, a seção inteira some.

## Trocar o WhatsApp, o Instagram, o horário e o crédito

Tudo em [`src/config/site.ts`](../src/config/site.ts):

```ts
export const WHATSAPP_NUMBER = '5511999999999'; // só dígitos: 55 + DDD + número
export const INSTAGRAM_URL = 'https://instagram.com/doceriaexemplo';
export const ORDER_HOURS = 'Pedidos de terça a sábado, das 9h às 18h'; // '' esconde
export const DEV_CREDIT_ENABLED = true;
export const DEV_NAME = 'Lukas';
export const DEV_URL = 'https://github.com/lukasuvinha';
```

O `WHATSAPP_NUMBER` é o mesmo usado no envio dos pedidos — trocar lá atualiza
o botão do carrinho, o da página Contato e o ícone do rodapé.

## Onde fica cada coisa no código

| O quê | Arquivo |
|---|---|
| Rodapé (marca, ícones, links, horário, crédito) | `src/components/Footer.astro` |
| Ícones de traço (WhatsApp, Instagram, GitHub, LinkedIn) | `src/components/SocialIcon.astro` |
| Botão de link (ícone + rótulo) | `src/components/ContactButton.astro` |
| Página Sobre | `src/pages/sobre.astro` |
| Página Contato | `src/pages/contato.astro` |
| Conteúdo editável (schemas e leitura) | `src/content/paginas-schema.ts`, `src/data/paginas.ts` |
| Campos do painel | `public/admin/config.yml`, Configurações → "sobre" e "contato" |
| Página Desenvolvedor (desativada) | `src/pages/_desenvolvedor.astro` |
| Número, Instagram, horário, crédito | `src/config/site.ts` |

## Testes

`tests/paginas-institucionais.test.ts` cobre o rodapé (links, ícones com
`aria-label`, horário, crédito com `nofollow` e nova aba), a desativação da
página `/desenvolvedor`, as páginas Sobre e Contato sem conteúdo do CMS (nada
de seção vazia) e o conteúdo de exemplo dos JSON.
