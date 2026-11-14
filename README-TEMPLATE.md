# Como usar este template

Este é um template genérico de cardápio digital (Astro + Sveltia CMS + Cloudflare Workers),
derivado de um cardápio real. Ele vem configurado com uma loja fictícia, a **Doceria Exemplo**.
Antes de publicar para um cliente:

1. `src/config/site.ts` — **identidade da loja, num só lugar**: nome (`SITE_NAME`), slogan
   (`SITE_TAGLINE`), descrição para buscadores (`SITE_DESCRIPTION`), logo (`SITE_LOGO`),
   imagem de compartilhamento (`SITE_OG_IMAGE`), WhatsApp (`WHATSAPP_NUMBER`), Instagram
   (`INSTAGRAM_URL`), título da mensagem do pedido (`WHATSAPP_ORDER_TITLE`), prefixo do número
   do pedido (`ORDER_PREFIX`), horário de pedidos no rodapé (`ORDER_HOURS`) e o crédito do
   desenvolvedor no rodapé (`DEV_CREDIT_ENABLED`, `DEV_NAME`, `DEV_URL` — combine com o cliente).
   Textos das páginas Sobre e Contato: no painel, em Configurações → Página Sobre / Página Contato.
2. `public/logo.svg`, `public/og-image.png` e `public/favicon.svg` — troque pelas imagens da
   loja (passo a passo em `docs/LOGO.md`).
3. `src/styles/theme.css` + `src/config/theme.ts` — cores, fontes, raios, sombras e movimento
   (tema padrão "material", Material You com paleta de confeitaria). Há um tema alternativo,
   "confeitaria" (`src/styles/theme-confeitaria.css`): troque `ACTIVE_THEME` em `theme.ts` para
   usá-lo. Para criar um tema novo, siga o comentário no topo do `theme.css`.
   As cores dos cards e chips vêm do campo **Cor** de cada categoria no painel.
4. `astro.config.mjs` — troque SITE_URL pelo domínio real.
5. `public/admin/config.yml` — troque `repo:` e `base_url:` (worker de auth do Sveltia CMS)
   para o repositório/worker do novo cliente.
6. `src/content/` — apague os produtos, categorias e o cupom de exemplo (`produtos/`,
   `categorias/`, `cupons/`) e cadastre os reais, ou deixe o cliente cadastrar pelo painel.
   As ilustrações de exemplo ficam em `public/img/produtos/` e podem ser apagadas junto.
   Em `src/content/configuracoes/` (ou no painel, em **Configurações**), revise também:
   `entrega.json` (entrega, retirada e taxa), `fornada.json` (o aviso de próxima fornada vem
   **ligado** no exemplo), `sobre.json` (texto e foto da página Sobre; a ilustração de exemplo
   fica em `public/img/sobre/`) e `contato.json` ("Como encomendar" da página Contato).
7. `public/uploads/` — as fotos reais entram por aqui, via CMS.
8. Rode `npm install && npm test && npm run build` depois das trocas. Os testes leem os
   valores de `site.ts`, então não dependem do nome da loja.
