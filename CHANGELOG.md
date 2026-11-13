# Changelog

Novidades do template de cardápio digital (Astro + Sveltia CMS + Cloudflare Workers).

## [Não lançado] — 2026-11-13

O template virou um produto genérico: a marca de origem saiu e entrou uma loja
fictícia, a **Doceria Exemplo**. O visual continua o mesmo.

### Novo
- **Identidade da loja num só lugar:** `src/config/site.ts` reúne nome, slogan,
  descrição para SEO, logo, imagem de compartilhamento, WhatsApp, Instagram,
  título da mensagem do pedido, prefixo do número do pedido e créditos do
  desenvolvedor. Layout, cabeçalho, rodapé, páginas e mensagem do WhatsApp
  leem esses valores.
- **Tema centralizado:** cores, fontes, raios de borda e sombras viraram tokens
  em `src/styles/theme.css` (tema "confeitaria", com modo claro e escuro), mais
  `src/config/theme.ts` para as fontes e o `theme-color`. O topo do arquivo
  explica como criar um tema novo.
- **Loja de demonstração:** 10 produtos em 4 categorias (um esgotado), com
  ilustrações próprias, e o cupom de exemplo `BEMVINDO10`.
- **Logo e imagem de compartilhamento genéricos** (`public/logo.svg` e
  `public/og-image.png`, 1200×630). O guia `docs/LOGO.md` agora explica como
  trocá-los.
- Novo teste `tests/theme.test.ts`, que barra cores, fontes, raios e sombras
  fixos fora do tema.

### Mudou
- Prefixo das classes CSS e das chaves do `localStorage` passou a ser `cd-`
  ("cardápio digital"), sem referência à marca de origem.
- Nome do pacote e do worker: `cardapio-digital`.
- Número do pedido usa o prefixo configurável (`DE1234` na loja de exemplo).
- Testes que dependiam da marca de origem agora leem os valores de `site.ts`.

### Corrigido
- O build não avisa mais que a collection de cupons está vazia.
- A página 404 e a confirmação do pedido apontavam para um logo que não
  existia; a og-image referenciada também não existia.

## 2026-10-30

### Novo
- **Banner "Próxima fornada"** no topo do cardápio, configurável pelo painel
  (**Configurações → Próxima Fornada**): liga/desliga geral, data e hora exatas
  ou um aviso genérico "Em preparação". Vem **desligado** por padrão; o arquivo
  `src/content/configuracoes/fornada.json` traz só um exemplo fictício.

### Corrigido
- O painel recusava salvar um cupom com o campo opcional **"Hora"** em branco.
- O painel podia deixar de abrir com o erro *"The `accept` option must be a
  string"*: o campo de foto agora usa `accept` como texto separado por vírgulas.

### Testes e documentação
- Novos testes para o banner (regras e renderização) e guardas no `config.yml`
  para as duas correções acima.
- Documentação atualizada em `docs/CUPONS-E-PEDIDOS.md`,
  `docs/BUGS-E-CORRECOES.md` (itens 8 e 9) e `docs/TESTES.md`.
