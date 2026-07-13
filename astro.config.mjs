// @ts-check
import { defineConfig } from 'astro/config';

// -----------------------------------------------------------------------------
// URL DE PRODUCAO DO SITE
// -----------------------------------------------------------------------------
// Usada para gerar URLs ABSOLUTAS nas meta tags de compartilhamento (og:url e
// og:image). Sem uma URL absoluta, o preview do link NAO aparece bonito no
// WhatsApp / redes sociais.
//
// >>> QUANDO COMPRAR O DOMINIO DA NINA, TROQUE A LINHA `SITE_URL` ABAIXO <<<
//   Ex.: const SITE_URL = 'https://seu-dominio-aqui.com.br';
//   (sem barra no final). Depois: `npm run build` e deploy.
//   Nao precisa mexer em mais nada — BaseLayout.astro usa Astro.site
//   automaticamente para montar og:url e og:image.
//
// Enquanto nao ha dominio, fica o padrao do Cloudflare Workers como placeholder.
// Ele pode nao ser o endereco exato (o subdominio da conta varia), entao o
// preview so vai funcionar 100% depois de apontar para a URL real.
const SITE_URL = 'https://seu-dominio-aqui.com.br';

// Site 100% estatico: nao ha SSR, portanto NAO usamos adapter.
// O build gera ./dist, que o Cloudflare serve como static assets (ver wrangler.jsonc).
export default defineConfig({
  site: SITE_URL,
  output: 'static',
});
