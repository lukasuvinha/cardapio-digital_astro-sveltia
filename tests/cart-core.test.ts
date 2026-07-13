import { describe, it, expect } from 'vitest';
import {
  addItem,
  setQty,
  incItem,
  decItem,
  removeItem,
  totalCount,
  cartLines,
  cartTotal,
  type Cart,
  type CatalogItem,
} from '../src/lib/cart-core';

// catalogo de teste (mesmo formato do catalogo embutido no carrinho client-side)
const products: CatalogItem[] = [
  { id: 'p1', nome: 'Brownie Trufado', preco: 14, foto: '/img/p1.webp', disponivel: true },
  { id: 'p2', nome: 'Cookie', preco: 12, foto: null, disponivel: true },
  { id: 'p6', nome: 'Bolo Esgotado', preco: 18, foto: '/img/p6.webp', disponivel: false },
];

describe('operacoes do carrinho', () => {
  it('adiciona e acumula quantidades', () => {
    let cart: Cart = {};
    cart = addItem(cart, 'p1');
    cart = addItem(cart, 'p1', 2);
    expect(cart).toEqual({ p1: 3 });
  });

  it('ignora adicao de quantidade <= 0', () => {
    expect(addItem({}, 'p1', 0)).toEqual({});
    expect(addItem({ p1: 2 }, 'p1', -5)).toEqual({ p1: 2 });
  });

  it('incrementa e decrementa, removendo ao zerar', () => {
    let cart: Cart = { p1: 1 };
    cart = incItem(cart, 'p1');
    expect(cart).toEqual({ p1: 2 });
    cart = decItem(cart, 'p1');
    cart = decItem(cart, 'p1');
    expect(cart).toEqual({});
  });

  it('setQty define quantidade exata e remove com <= 0', () => {
    expect(setQty({ p1: 1 }, 'p1', 5)).toEqual({ p1: 5 });
    expect(setQty({ p1: 5 }, 'p1', 0)).toEqual({});
  });

  it('removeItem apaga o item', () => {
    expect(removeItem({ p1: 2, p2: 1 }, 'p1')).toEqual({ p2: 1 });
  });

  it('totalCount soma todas as unidades', () => {
    expect(totalCount({ p1: 2, p2: 3 })).toBe(5);
    expect(totalCount({})).toBe(0);
  });

  it('nao muta o carrinho original (imutabilidade)', () => {
    const original: Cart = { p1: 1 };
    addItem(original, 'p1');
    incItem(original, 'p1');
    removeItem(original, 'p1');
    expect(original).toEqual({ p1: 1 });
  });
});

describe('linhas e total do carrinho', () => {
  it('monta linhas com dados do produto e total por linha', () => {
    const linhas = cartLines({ p1: 2 }, products);
    expect(linhas).toHaveLength(1);
    const [l] = linhas;
    const p1 = products.find((p) => p.id === 'p1')!;
    expect(l.nome).toBe(p1.nome);
    expect(l.qty).toBe(2);
    expect(l.lineTotal).toBe(p1.preco * 2);
  });

  it('ignora ids inexistentes no catalogo', () => {
    expect(cartLines({ zzz: 3 }, products)).toEqual([]);
  });

  it('ignora produtos indisponiveis (p6 esta esgotado)', () => {
    const p6 = products.find((p) => p.id === 'p6')!;
    expect(p6.disponivel).toBe(false);
    expect(cartLines({ p6: 1 }, products)).toEqual([]);
  });

  it('cartTotal soma apenas itens validos', () => {
    const p1 = products.find((p) => p.id === 'p1')!;
    const p2 = products.find((p) => p.id === 'p2')!;
    const total = cartTotal({ p1: 2, p2: 1, p6: 5, zzz: 9 }, products);
    expect(total).toBe(p1.preco * 2 + p2.preco * 1);
  });
});
