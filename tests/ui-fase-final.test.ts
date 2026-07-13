// Testes da fase final: estado vazio do cardapio, link do cabecalho para a
// home, meta tags de compartilhamento e a pagina 404. Usam a Container API do
// Astro (render em memoria, sem navegador).
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductGrid from '../src/components/ProductGrid.astro';
import Header from '../src/components/Header.astro';
import BaseLayout from '../src/layouts/BaseLayout.astro';
import type { Product } from '../src/data/menu-helpers';

const produto: Product = {
  id: 'p1', nome: 'Brownie', preco: 14, categoria: 'Brownie', disponivel: true,
  foto: '/uploads/brownie.webp',
};

describe('ProductGrid — estado vazio (robustez / CMS sem produtos)', () => {
  it('mostra mensagem amigavel quando NAO ha produtos (sem cards)', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductGrid, { props: { products: [] } });
    expect(html).toContain('Cardápio em atualização');
    expect(html).not.toContain('data-testid="product-card"');
  });

  it('mostra os cards normalmente quando HA produtos (sem o estado vazio)', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductGrid, { props: { products: [produto] } });
    expect(html).toContain('data-testid="product-card"');
    expect(html).not.toContain('Cardápio em atualização');
  });
});

describe('Header — marca leva para a home', () => {
  it('o nome/logo e um link para "/"', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Header, {});
    // o link da marca aponta para a raiz do site
    expect(html).toMatch(/<a[^>]*class="dn-header__brand"[^>]*href="\/"/);
    expect(html).toContain('Doçuras da Nina');
  });
});

describe('BaseLayout — meta tags de compartilhamento', () => {
  it('inclui og:title, og:image e twitter:card', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: 'Teste', description: 'Descricao de teste' },
    });
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('/og-image.png');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('rel="canonical"');
  });

  it('permite trocar a imagem de preview por pagina (prop image)', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: 'X', image: '/uploads/produto-x.webp' },
    });
    expect(html).toContain('/uploads/produto-x.webp');
  });
});
