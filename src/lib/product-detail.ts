// Comportamento do detalhe do produto (stepper de quantidade e botao
// "Adicionar · R$ X"), o mesmo na pagina /produto/:id e na sheet/dialog do
// cardapio. So roda no navegador.
import { cartStore } from './cart-store';
import { formatPrice } from './format';
import { showSnackbar } from './snackbar';

/** Abre o carrinho (o CartDrawer escuta este evento). */
export function abrirCarrinho(): void {
  document.dispatchEvent(new CustomEvent('cd:open-cart'));
}

/** Avisa que um produto foi adicionado: snackbar "X adicionado · Ver". */
export function avisarAdicionado(nome: string): void {
  showSnackbar(`${nome} adicionado`, { label: 'Ver', onClick: abrirCarrinho });
}

/**
 * Liga o stepper e o botao de adicionar dentro de `root`. `aoAdicionar` roda
 * depois de colocar o item no carrinho (ex.: fechar a sheet).
 */
export function ligarDetalhe(root: ParentNode, aoAdicionar?: () => void): void {
  const qtyWrap = root.querySelector<HTMLElement>('[data-qty]');
  const addBtn = root.querySelector<HTMLElement>('[data-add-detail]');
  if (!qtyWrap || !addBtn) return;

  const valueEl = qtyWrap.querySelector<HTMLElement>('[data-qty-value]')!;
  const lineTotalEl = addBtn.querySelector<HTMLElement>('[data-line-total]')!;
  const decBtn = qtyWrap.querySelector<HTMLElement>('[data-qty-dec]')!;
  const id = addBtn.dataset.addDetail!;
  const nome = addBtn.dataset.nome ?? '';
  const preco = Number(addBtn.dataset.preco);
  let qty = 1;

  function refresh() {
    valueEl.textContent = String(qty);
    lineTotalEl.textContent = formatPrice(preco * qty);
    decBtn.setAttribute('aria-disabled', String(qty <= 1));
  }

  decBtn.addEventListener('click', () => {
    if (decBtn.getAttribute('aria-disabled') === 'true') return;
    qty = Math.max(1, qty - 1);
    refresh();
  });
  qtyWrap.querySelector('[data-qty-inc]')!.addEventListener('click', () => {
    qty = qty + 1;
    refresh();
  });

  addBtn.addEventListener('click', () => {
    cartStore.add(id, qty);
    aoAdicionar?.();
    avisarAdicionado(nome);
    qty = 1;
    refresh();
  });

  refresh();
}
