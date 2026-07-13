import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductCard from '../src/components/ProductCard.astro';
import ProductGrid from '../src/components/ProductGrid.astro';
import ProductImage from '../src/components/ProductImage.astro';
import type { Product } from '../src/data/menu-helpers';

const comFoto: Product = {
  id: 'p1', nome: 'Brownie', preco: 14, categoria: 'Brownie', disponivel: true,
  foto: '/uploads/brownie.webp',
};
const semFoto: Product = {
  id: 'p4', nome: 'Brigadeiro de Pistache', preco: 6, categoria: 'Brigadeiro', disponivel: true,
};
const fotoIncompativel: Product = {
  id: 'p9', nome: 'Foto HEIC', preco: 9, categoria: 'Cookies', disponivel: true,
  foto: '/uploads/foto.heic',
};

describe('ProductImage / ProductCard (renderizacao)', () => {
  it('renderiza <img> com a URL publica quando ha foto suportada', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductCard, { props: { product: comFoto } });
    expect(html).toContain('data-photo="image"');
    expect(html).toContain('<img');
    expect(html).toContain('/uploads/brownie.webp');
  });

  it('usa o placeholder quando NAO ha foto', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductCard, { props: { product: semFoto } });
    expect(html).toContain('data-photo="placeholder"');
    expect(html).not.toContain('<img');
  });

  it('PROTECAO: foto em formato incompativel cai no placeholder (sem <img>)', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductImage, {
      props: { foto: fotoIncompativel.foto, alt: 'x' },
    });
    expect(html).toContain('data-photo="placeholder"');
    expect(html).not.toContain('<img');
  });
});

describe('ProductGrid (renderizacao)', () => {
  it('renderiza a quantidade certa de cards a partir da lista de produtos', async () => {
    const container = await AstroContainer.create();
    const produtos = [comFoto, semFoto, fotoIncompativel];
    const html = await container.renderToString(ProductGrid, { props: { products: produtos } });
    const qtd = (html.match(/data-testid="product-card"/g) || []).length;
    expect(qtd).toBe(produtos.length);
  });
});
