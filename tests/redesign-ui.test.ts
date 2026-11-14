// Estrutura do redesign Material 3: o que o HTML precisa ter para os
// comportamentos descritos (botao "+", esgotado, chips, carrinho acessivel,
// detalhe compartilhado). A aparencia em si e conferida no navegador.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductCard from '../src/components/ProductCard.astro';
import ProductDetail from '../src/components/ProductDetail.astro';
import CategoryNav from '../src/components/CategoryNav.astro';
import Header from '../src/components/Header.astro';
import CartDrawer from '../src/components/CartDrawer.astro';
import PageHero from '../src/components/PageHero.astro';
import type { Product } from '../src/data/menu-helpers';

const disponivel: Product = { id: 'b1', nome: 'Brownie', preco: 12, categoria: 'Brownie', disponivel: true, foto: '/img/b.webp' };
const esgotado: Product = { ...disponivel, id: 'b2', nome: 'Cookie', disponivel: false };

async function render(c: any, props: Record<string, unknown> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(c, { props });
}

describe('ProductCard', () => {
  it('card disponivel: link para o detalhe, cor da categoria e botao "+" fora do link', async () => {
    const html = await render(ProductCard, { product: disponivel, cor: 'cacau', index: 3 });
    expect(html).toContain('data-cor="cacau"');
    expect(html).toContain('href="/produto/b1"');
    expect(html).toContain('data-open-detail="b1"');
    expect(html).toContain('data-add-to-cart="b1"');
    expect(html).toContain('aria-label="Adicionar Brownie ao carrinho"');
    expect(html).toContain('--i: 3');
    // o botao nao fica dentro do <a> (HTML invalido)
    const link = html.slice(html.indexOf('<a'), html.indexOf('</a>'));
    expect(link).not.toContain('<button');
  });

  it('esgotado: selo "Esgotado" e sem botao "+"', async () => {
    const html = await render(ProductCard, { product: esgotado });
    expect(html).toContain('Esgotado');
    expect(html).toContain('data-available="false"');
    expect(html).not.toContain('data-add-to-cart');
  });
});

describe('ProductDetail (pagina e sheet)', () => {
  it('disponivel: stepper e botao "Adicionar · R$ X"', async () => {
    const html = await render(ProductDetail, { product: disponivel });
    expect(html).toContain('data-qty');
    expect(html).toContain('data-add-detail="b1"');
    expect(html).toMatch(/Adicionar[\s\S]*R\$\s12,00/);
    expect(html).toMatch(/<h1[^>]*>Brownie<\/h1>/);
  });

  it('dentro da sheet o titulo e h2 com id para o aria-labelledby', async () => {
    const html = await render(ProductDetail, { product: disponivel, headingLevel: 2, headingId: 'x-title' });
    expect(html).toMatch(/<h2[^>]*id="x-title"[^>]*>Brownie<\/h2>/);
  });

  it('esgotado: sem stepper nem botao de adicionar', async () => {
    const html = await render(ProductDetail, { product: esgotado });
    expect(html).not.toContain('data-add-detail');
    expect(html).toContain('esgotado no momento');
  });
});

describe('CategoryNav (chips)', () => {
  it('"Todos" vem primeiro, neutro e selecionado; cada chip tem a cor da categoria', async () => {
    const html = await render(CategoryNav, {
      items: [
        { label: 'Brownie', slug: 'brownie', cor: 'cacau' },
        { label: 'Cookies', slug: 'cookies', cor: 'baunilha' },
      ],
    });
    expect(html).toMatch(/data-filter="all"[^>]*data-cor="neutro"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/data-filter="brownie"[^>]*data-cor="cacau"[^>]*aria-pressed="false"/);
    expect(html.indexOf('Todos')).toBeLessThan(html.indexOf('Brownie'));
  });
});

describe('Header', () => {
  it('tem o botao "carrinho" (desktop) com contador e subtotal, e o botao de tema', async () => {
    const html = await render(Header);
    expect(html).toMatch(/cd-header__cart[^>]*data-open-cart/);
    expect(html).toContain('data-cart-count');
    expect(html).toContain('data-cart-subtotal-text');
    expect(html).toContain('cd-theme-toggle');
    expect(html).toMatch(/<a[^>]*href="\/sobre"[^>]*>Sobre<\/a>/);
  });
});

describe('PageHero', () => {
  it('titleMobile=false marca o bloco para esconder o titulo no celular', async () => {
    expect(await render(PageHero, { title: 'Cardápio', titleMobile: false })).toContain('cd-hero--desk-title');
    expect(await render(PageHero, { title: 'Sobre' })).not.toContain('cd-hero--desk-title');
  });
});

describe('CartDrawer (sheet/drawer)', () => {
  it('e um dialogo modal com titulo', async () => {
    const html = await render(CartDrawer);
    expect(html).toMatch(/role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="cd-cart-title"/);
    expect(html).toContain('id="cd-cart-title"');
  });

  it('tem as tres etapas, FAB e snackbar', async () => {
    const html = await render(CartDrawer);
    for (const etapa of ['cart', 'checkout', 'confirmed']) expect(html).toContain(`data-pane="${etapa}"`);
    expect(html).toContain('data-fab');
    expect(html).toContain('data-snackbar');
  });

  it('botoes de avancar comecam desabilitados via aria-disabled', async () => {
    const html = await render(CartDrawer);
    expect(html).toMatch(/data-go-checkout[^>]*aria-disabled="true"/);
    expect(html).toMatch(/data-send-whatsapp[^>]*aria-disabled="true"/);
  });

  it('Entrega/Retirada fica na etapa do carrinho; pagamento na etapa de dados', async () => {
    const html = await render(CartDrawer);
    const cart = html.slice(html.indexOf('data-pane="cart"'), html.indexOf('data-pane="checkout"'));
    const dados = html.slice(html.indexOf('data-pane="checkout"'), html.indexOf('data-pane="confirmed"'));
    expect(cart).toContain('data-seg="fulfillment"');
    expect(dados).toContain('data-seg="payment"');
    expect(dados).toContain('Enviar pedido pelo WhatsApp');
  });

  it('cupom: campo + "Aplicar" e bloco de cupom aplicado com botao de remover', async () => {
    const html = await render(CartDrawer);
    expect(html).toContain('data-cupom-apply');
    expect(html).toContain('data-coupon-applied');
    expect(html).toContain('data-cupom-remove');
  });
});

describe('CSS global', () => {
  it('o reset de botao usa :where() (especificidade zero), para nao apagar o fundo de .cd-btn', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/:where\(button\)\s*{[^}]*background:\s*none/);
    // nenhum seletor "button {" solto com especificidade normal
    expect(css).not.toMatch(/(^|[\s,}])button\s*{/);
  });

  it('respeita prefers-reduced-motion', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(readFileSync(join(process.cwd(), 'src/styles/theme.css'), 'utf8')).toMatch(/prefers-reduced-motion[\s\S]*--stagger:\s*0ms/);
  });
});
