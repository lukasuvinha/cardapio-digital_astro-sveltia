// Store do carrinho no navegador: mantem o estado, persiste em localStorage e
// avisa assinantes quando muda. A logica pura vem de ./cart-core.
import type { Cart } from './cart-core';
import {
  addItem,
  incItem,
  decItem,
  removeItem,
  setQty,
  totalCount,
} from './cart-core';

const KEY = 'dn-cart';
type Listener = (cart: Cart) => void;

function read(): Cart {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const limpo: Cart = {};
      for (const [id, v] of Object.entries(parsed)) {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) limpo[id] = Math.floor(n);
      }
      return limpo;
    }
  } catch (e) {
    /* localStorage indisponivel ou JSON invalido: comeca vazio */
  }
  return {};
}

let cart: Cart = typeof localStorage !== 'undefined' ? read() : {};
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch (e) {
    /* ignora: modo privado / storage cheio */
  }
}

function emit() {
  for (const fn of listeners) fn(cart);
}

function update(next: Cart) {
  cart = next;
  persist();
  emit();
}

export const cartStore = {
  get: (): Cart => cart,
  count: (): number => totalCount(cart),
  add: (id: string, qty = 1) => update(addItem(cart, id, qty)),
  inc: (id: string) => update(incItem(cart, id)),
  dec: (id: string) => update(decItem(cart, id)),
  remove: (id: string) => update(removeItem(cart, id)),
  setQty: (id: string, qty: number) => update(setQty(cart, id, qty)),
  clear: () => update({}),
  /** Assina mudancas; chama fn imediatamente com o estado atual. Retorna unsub. */
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    fn(cart);
    return () => {
      listeners.delete(fn);
    };
  },
};

// Sincroniza entre abas abertas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      cart = read();
      emit();
    }
  });
}
