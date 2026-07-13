// Guarda de regressao: o logo oficial (public/Logo-Nina.jpeg, recortado em
// circulo em public/logo-medalhao.png) deve aparecer nos "selos" circulares
// da confirmacao de pedido e da pagina 404 — nao mais o monograma de texto
// "Doçuras da Nina" desenhado a mao que existia antes. Ver docs/LOGO.md.
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CartDrawer from '../src/components/CartDrawer.astro';
import Page404 from '../src/pages/404.astro';

describe('Logo oficial — arquivos', () => {
  it('o logo oficial e o medalhao circular existem em public/', () => {
    expect(existsSync(join(process.cwd(), 'public/Logo-Nina.jpeg'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public/logo-medalhao.png'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public/og-image.png'))).toBe(true);
  });
});

describe('Selo de confirmação do pedido (CartDrawer)', () => {
  it('usa o logo oficial (imagem), não mais o monograma de texto', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CartDrawer, {});
    expect(html).toContain('/logo-medalhao.png');
    // o monograma de texto antigo nao deve mais estar ativo no markup
    expect(html).not.toMatch(/dn-confirm__ring-inner">Doçuras/);
  });
});

describe('Página 404', () => {
  it('usa o logo oficial (imagem), não mais o monograma de texto', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Page404, {});
    expect(html).toContain('/logo-medalhao.png');
    expect(html).not.toMatch(/dn-404__ring-inner">Doçuras/);
  });
});
