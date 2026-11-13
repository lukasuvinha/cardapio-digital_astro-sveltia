# Como usar este template

Este é um template genérico de cardápio digital (Astro + Sveltia CMS + Cloudflare Workers),
derivado de um cardápio real. Ele vem configurado com uma loja fictícia, a **Doceria Exemplo**.
Antes de publicar para um cliente:

1. `src/config/site.ts` — **identidade da loja, num só lugar**: nome (`SITE_NAME`), slogan
   (`SITE_TAGLINE`), descrição para buscadores (`SITE_DESCRIPTION`), logo (`SITE_LOGO`),
   imagem de compartilhamento (`SITE_OG_IMAGE`), WhatsApp (`WHATSAPP_NUMBER`), Instagram
   (`INSTAGRAM_URL`), título da mensagem do pedido (`WHATSAPP_ORDER_TITLE`), prefixo do número
   do pedido (`ORDER_PREFIX`) e créditos do desenvolvedor (`DEV_*`).
2. `public/logo.svg`, `public/og-image.png` e `public/favicon.svg` — troque pelas imagens da
   loja (passo a passo em `docs/LOGO.md`).
3. `src/styles/theme.css` + `src/config/theme.ts` — cores, fontes, raios e sombras (tema
   "confeitaria"). Para criar um tema novo, siga o comentário no topo do `theme.css`.
4. `astro.config.mjs` — troque SITE_URL pelo domínio real.
5. `public/admin/config.yml` — troque `repo:` e `base_url:` (worker de auth do Sveltia CMS)
   para o repositório/worker do novo cliente.
6. `src/content/` — apague os produtos, categorias e o cupom de exemplo (`produtos/`,
   `categorias/`, `cupons/`) e cadastre os reais, ou deixe o cliente cadastrar pelo painel.
   As ilustrações de exemplo ficam em `public/img/produtos/` e podem ser apagadas junto.
7. `public/uploads/` — as fotos reais entram por aqui, via CMS.
8. Rode `npm install && npm test && npm run build` depois das trocas. Os testes leem os
   valores de `site.ts`, então não dependem do nome da loja.
