# Páginas institucionais: Sobre, Contato e Desenvolvedor

Três páginas estáticas, alcançadas por links discretos no **rodapé** do site
(`src/components/Footer.astro`), presente em todas as páginas (cardápio,
detalhe de produto e 404):

```
Doçuras da Nina · Doceria Artesanal
        Sobre  ·  Contato
```

- **`/sobre`** — um texto sobre a doceria.
- **`/contato`** — botões para falar com a Nina (WhatsApp e Instagram) e, no
  fim da página, um link **discreto** "Desenvolvedor".
- **`/desenvolvedor`** — só alcançada pelo link acima; card com o nome de
  quem fez o site e botões para GitHub e LinkedIn. Não aparece no rodapé.

Nenhuma dessas páginas depende do CMS/Content Collections — são conteúdo
estático no código, então as edições abaixo são sempre feitas **direto no
GitHub**, do mesmo jeito que a troca do número do WhatsApp (ver
[`docs/CUPONS-E-PEDIDOS.md`](CUPONS-E-PEDIDOS.md)).

## Editar o texto da página "Sobre"

O texto é **genérico de propósito** — foi escrito para o site ir ao ar, mas a
Nina deve trocar por um texto próprio quando quiser.

1. Abra `src/pages/sobre.astro` no repositório do GitHub
   (`https://github.com/lukasuvinha/Cardapio_Docuras-da-Nina/blob/main/src/pages/sobre.astro`).
2. Clique no ícone de **lápis** (✏️) para editar.
3. O texto fica dentro da `<div class="dn-sobre__body">`, em parágrafos
   `<p>...</p>`. Pode:
   - Editar o texto de cada parágrafo (o que está entre `<p>` e `</p>`);
   - Apagar ou adicionar parágrafos inteiros (copie o padrão `<p>...</p>`);
   - Trocar o título, que fica em `<h1 class="dn-sobre__title">...</h1>`.
   - **Não precisa mexer em nada fora dessas tags** — o `<div class="dn-sobre__rule">`,
     o `<Header />`, o `<Footer />` etc. são o layout da página, deixe como
     estão.
4. Role até o final, escreva uma mensagem de commit curta (ex.: "Atualiza
   texto da página Sobre") e clique em **"Commit changes..."** → confirme na
   branch `main`.
5. Em 1–2 minutos o deploy sobe automaticamente.

## Editar os links de Contato (WhatsApp e Instagram)

Os dois links da página `/contato` vêm de constantes em
[`src/config/site.ts`](../src/config/site.ts) — o mesmo arquivo onde já fica
o número do WhatsApp usado nos pedidos.

- **WhatsApp**: a página de Contato reaproveita a constante `WHATSAPP_NUMBER`
  (a mesma usada para o botão "Enviar pedido"). Trocar o número lá já
  atualiza os dois lugares — passo a passo completo em
  [`docs/CUPONS-E-PEDIDOS.md`](CUPONS-E-PEDIDOS.md) / no
  [`README`](../README.md#pedido-via-whatsapp).
- **Instagram**: constante própria, `INSTAGRAM_URL`. **Hoje está com um link
  de exemplo (placeholder)** — precisa trocar antes de divulgar o site.

Passo a passo para o Instagram:

1. Abra `src/config/site.ts` no GitHub
   (`https://github.com/lukasuvinha/Cardapio_Docuras-da-Nina/blob/main/src/config/site.ts`).
2. Clique no ícone de **lápis** (✏️) para editar.
3. Troque o valor de `INSTAGRAM_URL` pelo link completo do perfil, por
   exemplo:
   ```ts
   export const INSTAGRAM_URL = 'https://instagram.com/docurasdanina';
   ```
4. Commit (ex.: "Atualiza link do Instagram") → confirme na `main`. Deploy
   automático em 1–2 minutos.
5. Para conferir: abra `/contato` no site e clique no botão do Instagram.

## Editar o card "Desenvolvedor" (nome, GitHub, LinkedIn)

Também em [`src/config/site.ts`](../src/config/site.ts), três constantes:

```ts
export const DEV_NAME = 'Lukas Uvinha';
export const DEV_GITHUB_URL = 'https://github.com/lukasuvinha';
export const DEV_LINKEDIN_URL = 'https://linkedin.com/in/SEU_USUARIO_AQUI'; // placeholder
```

`DEV_LINKEDIN_URL` está com um **link de exemplo** — troque pela URL real do
perfil do LinkedIn seguindo os mesmos passos do Instagram acima (editar o
arquivo, trocar o valor entre aspas, commit na `main`).

## Onde fica cada coisa no código

| O quê | Arquivo |
|---|---|
| Rodapé com os links Sobre/Contato | `src/components/Footer.astro` |
| Botão reutilizável (ícone + rótulo) usado em Contato e Desenvolvedor | `src/components/ContactButton.astro` |
| Página Sobre | `src/pages/sobre.astro` |
| Página Contato | `src/pages/contato.astro` |
| Página Desenvolvedor | `src/pages/desenvolvedor.astro` |
| Número do WhatsApp, link do Instagram, dados do desenvolvedor | `src/config/site.ts` |

## Sobre os ícones dos botões

Os ícones de WhatsApp, Instagram, GitHub e LinkedIn são **desenhos simples
próprios** (linha fina, no mesmo estilo do resto do site — como o ícone do
carrinho no cabeçalho), não os logos oficiais das marcas. O nome ao lado de
cada ícone (ex.: "WhatsApp", "Instagram") já deixa claro para onde o botão
leva.

## Testes

`tests/paginas-institucionais.test.ts` cobre: os links do rodapé, o
`ContactButton` (href, rótulo, abre em nova aba quando `external`), e que
cada página usa os valores configurados em `site.ts` (então, se alguém trocar
o número do WhatsApp ou os links, os testes continuam validando os valores
atuais — não há valor "hardcoded" duplicado nos testes).
