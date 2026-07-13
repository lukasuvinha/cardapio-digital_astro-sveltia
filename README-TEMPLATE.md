# Como usar este template

Este é um template genérico derivado de um cardápio digital real (Astro + Sveltia CMS + Cloudflare Workers).
Dados de negócio (contato, preços, fotos e produtos reais) já foram removidos. Antes de publicar para um cliente:

1. `src/config/site.ts` — troque WHATSAPP_NUMBER, SITE_NAME, SITE_TAGLINE, INSTAGRAM_URL, DEV_*.
2. `astro.config.mjs` — troque SITE_URL pelo domínio real.
3. `public/admin/config.yml` — troque `repo:` e `base_url:` (worker de auth do Sveltia CMS) para o repositório/worker do novo cliente.
4. `src/content/produtos/` e `src/content/categorias/` — apague os arquivos de exemplo e cadastre os produtos reais (ou deixe a Nina/cliente cadastrar pelo painel).
5. `public/uploads/` — pasta vazia (só tem um .gitkeep), as fotos reais entram via CMS.
6. Busque por "Nina" e "Doçuras" no projeto (inclusive em `tests/`, `docs/` e componentes) e troque pela marca do novo cliente — isso NÃO foi feito automaticamente porque está espalhado no branding/testes e cada cliente muda para um nome diferente:
   `grep -rli "nina\|doçuras\|docuras" --include="*.ts" --include="*.astro" --include="*.md" --include="*.json" .`
7. Rode `npm install && npm test` depois das trocas — os testes que comparam texto literal da marca vão quebrar até você atualizá-los.
