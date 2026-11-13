// Guarda de regressao: o logo configurado em src/config/site.ts (SITE_LOGO)
// e a imagem de compartilhamento (SITE_OG_IMAGE) precisam existir em public/,
// e os "selos" circulares da confirmacao de pedido e da pagina 404 precisam
// usar esse logo (imagem), nao um monograma de texto. Ver docs/LOGO.md.
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CartDrawer from '../src/components/CartDrawer.astro';
import Page404 from '../src/pages/404.astro';
import { SITE_LOGO, SITE_OG_IMAGE } from '../src/config/site';

describe('Logo configurado — arquivos', () => {
  it('o logo (SITE_LOGO) e a imagem de compartilhamento (SITE_OG_IMAGE) existem em public/', () => {
    expect(SITE_LOGO.startsWith('/'), 'SITE_LOGO deve ser um caminho publico, ex.: /logo.svg').toBe(true);
    expect(existsSync(join(process.cwd(), 'public', SITE_LOGO)), `public${SITE_LOGO} nao existe`).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', SITE_OG_IMAGE)), `public${SITE_OG_IMAGE} nao existe`).toBe(true);
  });
});

describe('Selo de confirmação do pedido (CartDrawer)', () => {
  it('usa o logo configurado (imagem), não um monograma de texto', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CartDrawer, {});
    expect(html).toContain(`src="${SITE_LOGO}"`);
    // o monograma de texto antigo nao deve estar ativo no markup
    expect(html).not.toMatch(/cd-confirm__ring-inner">/);
  });
});

describe('Página 404', () => {
  it('usa o logo configurado (imagem), não um monograma de texto', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Page404, {});
    expect(html).toContain(`src="${SITE_LOGO}"`);
    expect(html).not.toMatch(/cd-404__ring-inner">/);
  });
});
