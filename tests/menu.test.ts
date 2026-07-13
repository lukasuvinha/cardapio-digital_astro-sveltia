import { describe, it, expect } from 'vitest';
import {
  groupByCategory,
  categoriasDe,
  produtoById,
  productHasPhoto,
  porDisponibilidade,
  produtosVisiveis,
  type Product,
} from '../src/data/menu-helpers';
import { slugify } from '../src/lib/slug';
import { produtoBaseSchema } from '../src/content/produto-schema';

const produtos: Product[] = [
  { id: 'p1', nome: 'Brownie A', preco: 14, categoria: 'Brownie', disponivel: true, foto: '/uploads/a.webp' },
  { id: 'p2', nome: 'Brownie B', preco: 15, categoria: 'Brownie', disponivel: true, foto: '/uploads/b.jpg' },
  { id: 'p3', nome: 'Brigadeiro', preco: 4.5, categoria: 'Brigadeiro', disponivel: true }, // sem foto
  { id: 'p4', nome: 'Cookie', preco: 12, categoria: 'Cookies', disponivel: false, foto: '/uploads/c.png' },
];

describe('helpers do cardapio', () => {
  it('productHasPhoto: true para foto em formato suportado', () => {
    expect(productHasPhoto(produtos[0])).toBe(true); // .webp
    expect(productHasPhoto(produtos[1])).toBe(true); // .jpg
  });

  it('productHasPhoto: false quando nao ha foto', () => {
    expect(productHasPhoto(produtos[2])).toBe(false);
    expect(productHasPhoto({ foto: undefined })).toBe(false);
    expect(productHasPhoto({ foto: '' })).toBe(false);
  });

  it('productHasPhoto: false para formato INCOMPATIVEL (protecao — ex.: .heic)', () => {
    expect(productHasPhoto({ foto: '/uploads/foto.heic' })).toBe(false);
    expect(productHasPhoto({ foto: '/uploads/arquivo.pdf' })).toBe(false);
  });

  it('categoriasDe retorna categorias unicas na ordem de aparicao', () => {
    expect(categoriasDe(produtos)).toEqual(['Brownie', 'Brigadeiro', 'Cookies']);
  });

  it('produtoById encontra e retorna undefined quando nao existe', () => {
    expect(produtoById(produtos, 'p3')?.nome).toBe('Brigadeiro');
    expect(produtoById(produtos, 'zzz')).toBeUndefined();
  });
});

describe('porDisponibilidade (ordem de exibicao do cardapio)', () => {
  it('esgotados vao para o FIM da lista, disponiveis mantem a ordem por id', () => {
    // embaralhado de proposito, incluindo um esgotado no meio
    const embaralhado: Product[] = [
      { id: 'p4', nome: 'Cookie', preco: 12, categoria: 'Cookies', disponivel: false },
      { id: 'p2', nome: 'Brownie B', preco: 15, categoria: 'Brownie', disponivel: true },
      { id: 'p1', nome: 'Brownie A', preco: 14, categoria: 'Brownie', disponivel: true },
      { id: 'p3', nome: 'Brigadeiro', preco: 4.5, categoria: 'Brigadeiro', disponivel: true },
    ];
    const ordenado = [...embaralhado].sort(porDisponibilidade);
    expect(ordenado.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(ordenado[ordenado.length - 1].disponivel).toBe(false);
  });

  it('varios esgotados ficam todos no fim, ordenados por id entre si', () => {
    const lista: Product[] = [
      { id: 'p5', nome: 'E1', preco: 1, categoria: 'X', disponivel: false },
      { id: 'p1', nome: 'D1', preco: 1, categoria: 'X', disponivel: true },
      { id: 'p2', nome: 'E2', preco: 1, categoria: 'X', disponivel: false },
      { id: 'p3', nome: 'D2', preco: 1, categoria: 'X', disponivel: true },
    ];
    const ordenado = [...lista].sort(porDisponibilidade).map((p) => p.id);
    expect(ordenado).toEqual(['p1', 'p3', 'p2', 'p5']);
  });

  it('sem nenhum esgotado, comporta-se igual a ordenacao por id', () => {
    const lista: Product[] = [
      { id: 'p3', nome: 'C', preco: 1, categoria: 'X', disponivel: true },
      { id: 'p1', nome: 'A', preco: 1, categoria: 'X', disponivel: true },
      { id: 'p2', nome: 'B', preco: 1, categoria: 'X', disponivel: true },
    ];
    expect([...lista].sort(porDisponibilidade).map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });
});

describe('produtosVisiveis (esconder do cardápio)', () => {
  it('remove produtos escondidos, mantem os demais', () => {
    const lista: Product[] = [
      { id: 'p1', nome: 'A', preco: 1, categoria: 'X', disponivel: true },
      { id: 'p2', nome: 'B', preco: 1, categoria: 'X', disponivel: true, escondido: true },
      { id: 'p3', nome: 'C', preco: 1, categoria: 'X', disponivel: false },
    ];
    const visiveis = produtosVisiveis(lista).map((p) => p.id);
    expect(visiveis).toEqual(['p1', 'p3']);
  });

  it('produto escondido E indisponivel tambem some (escondido tem prioridade)', () => {
    const lista: Product[] = [
      { id: 'p1', nome: 'A', preco: 1, categoria: 'X', disponivel: false, escondido: true },
    ];
    expect(produtosVisiveis(lista)).toEqual([]);
  });

  it('sem nenhum produto escondido, retorna a lista inteira (compatibilidade)', () => {
    const lista: Product[] = [
      { id: 'p1', nome: 'A', preco: 1, categoria: 'X', disponivel: true },
      { id: 'p2', nome: 'B', preco: 1, categoria: 'X', disponivel: false },
    ];
    // "escondido" ausente (undefined) em produtos existentes = visivel
    expect(produtosVisiveis(lista)).toHaveLength(2);
  });
});

describe('groupByCategory', () => {
  it('nao perde produtos e gera um grupo por categoria', () => {
    const grupos = groupByCategory(produtos);
    expect(grupos).toHaveLength(3);
    expect(grupos.reduce((a, g) => a + g.produtos.length, 0)).toBe(produtos.length);
  });

  it('cada grupo tem slug valido e apenas produtos da sua categoria', () => {
    for (const g of groupByCategory(produtos)) {
      expect(g.slug).toBe(slugify(g.categoria));
      expect(g.produtos.every((p) => p.categoria === g.categoria)).toBe(true);
    }
  });
});

describe('schema Zod do produto (validacao de tipos)', () => {
  const base = { nome: 'Teste', preco: 10, categoria: 'Brownie', disponivel: true };

  it('aceita um produto valido', () => {
    expect(produtoBaseSchema.parse(base)).toMatchObject(base);
  });

  it('assume disponivel=true quando omitido', () => {
    const { disponivel, ...semDisp } = base;
    expect(produtoBaseSchema.parse(semDisp).disponivel).toBe(true);
  });

  it('rejeita preco que nao e numero (ex.: string)', () => {
    expect(() => produtoBaseSchema.parse({ ...base, preco: '10' })).toThrow();
  });

  it('rejeita disponivel que nao e booleano', () => {
    expect(() => produtoBaseSchema.parse({ ...base, disponivel: 'sim' })).toThrow();
  });

  it('exige nome', () => {
    const { nome, ...semNome } = base;
    expect(() => produtoBaseSchema.parse(semNome)).toThrow();
  });

  it('foto e uma string opcional (URL publica)', () => {
    expect(produtoBaseSchema.parse(base).foto).toBeUndefined();
    expect(produtoBaseSchema.parse({ ...base, foto: '/uploads/x.webp' }).foto).toBe('/uploads/x.webp');
    expect(() => produtoBaseSchema.parse({ ...base, foto: 123 })).toThrow();
  });

  it('assume escondido=false quando omitido (produtos existentes continuam visiveis)', () => {
    expect(produtoBaseSchema.parse(base).escondido).toBe(false);
  });

  it('aceita escondido=true e rejeita valor nao booleano', () => {
    expect(produtoBaseSchema.parse({ ...base, escondido: true }).escondido).toBe(true);
    expect(() => produtoBaseSchema.parse({ ...base, escondido: 'sim' })).toThrow();
  });
});
