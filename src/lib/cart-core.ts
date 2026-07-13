// Logica pura do carrinho (sem navegador/DOM), para ser facilmente testavel.
// O carrinho e um mapa simples: id do produto -> quantidade.
//
// Este modulo roda tambem no navegador (carrinho client-side), por isso NAO
// depende do tipo Product da Content Collection (que carrega ImageMetadata do
// build). Ele opera sobre um "catalogo" leve, com a foto ja resolvida em URL.

export type Cart = Record<string, number>;

/** Item de catalogo enxuto usado pelo carrinho (foto como URL string ou null). */
export interface CatalogItem {
  id: string;
  nome: string;
  preco: number;
  foto: string | null;
  disponivel: boolean;
}

export interface CartLine {
  id: string;
  nome: string;
  preco: number;
  qty: number;
  foto: string | null;
  lineTotal: number;
}

/** Adiciona `qty` unidades de um produto (default 1). Ignora qty <= 0. */
export function addItem(cart: Cart, id: string, qty = 1): Cart {
  if (qty <= 0) return { ...cart };
  return { ...cart, [id]: (cart[id] ?? 0) + qty };
}

/** Define a quantidade exata de um item; qty <= 0 remove o item. */
export function setQty(cart: Cart, id: string, qty: number): Cart {
  const next = { ...cart };
  if (qty <= 0) delete next[id];
  else next[id] = qty;
  return next;
}

/** Incrementa 1 unidade. */
export function incItem(cart: Cart, id: string): Cart {
  return setQty(cart, id, (cart[id] ?? 0) + 1);
}

/** Decrementa 1 unidade (remove ao chegar a zero). */
export function decItem(cart: Cart, id: string): Cart {
  return setQty(cart, id, (cart[id] ?? 0) - 1);
}

/** Remove o item por completo. */
export function removeItem(cart: Cart, id: string): Cart {
  const next = { ...cart };
  delete next[id];
  return next;
}

/** Soma total de unidades (para o badge do carrinho). */
export function totalCount(cart: Cart): number {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

/**
 * Converte o carrinho em linhas com dados do produto (nome, preco, foto) e o
 * total de cada linha. Ignora ids que nao existem mais no catalogo e produtos
 * indisponiveis (nao devem ser pedidos).
 */
export function cartLines(cart: Cart, products: CatalogItem[]): CartLine[] {
  const lines: CartLine[] = [];
  for (const id of Object.keys(cart)) {
    const p = products.find((pp) => pp.id === id);
    if (!p || !p.disponivel) continue;
    const qty = cart[id];
    lines.push({
      id,
      nome: p.nome,
      preco: p.preco,
      qty,
      foto: p.foto,
      lineTotal: p.preco * qty,
    });
  }
  return lines;
}

/** Total em reais (numero) considerando apenas itens validos/disponiveis. */
export function cartTotal(cart: Cart, products: CatalogItem[]): number {
  return cartLines(cart, products).reduce((a, l) => a + l.lineTotal, 0);
}
