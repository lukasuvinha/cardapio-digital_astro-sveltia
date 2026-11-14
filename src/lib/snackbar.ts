// Snackbar (Material 3): aviso curto no rodape da tela, com uma acao
// opcional — ex.: "Brownie adicionado · Ver". O elemento fica em
// src/components/Snackbar.astro. So roda no navegador.

const DURACAO_MS = 2500;
let timer: number | undefined;

export interface SnackbarAction {
  label: string;
  onClick: () => void;
}

export function showSnackbar(texto: string, acao?: SnackbarAction): void {
  const el = document.querySelector<HTMLElement>('[data-snackbar]');
  if (!el) return;
  const textoEl = el.querySelector<HTMLElement>('[data-snack-text]')!;
  const botao = el.querySelector<HTMLButtonElement>('[data-snack-action]')!;

  textoEl.textContent = texto;
  botao.hidden = !acao;
  botao.textContent = acao?.label ?? '';
  botao.onclick = acao
    ? () => {
        esconder(el);
        acao.onClick();
      }
    : null;

  el.hidden = false;
  // reinicia a animacao de entrada se ja estava visivel
  el.dataset.show = 'false';
  void el.offsetWidth;
  el.dataset.show = 'true';

  window.clearTimeout(timer);
  timer = window.setTimeout(() => esconder(el), DURACAO_MS);
}

/** Esconde o snackbar na hora (ex.: ao abrir o carrinho, que ele cobriria). */
export function hideSnackbar(): void {
  const el = document.querySelector<HTMLElement>('[data-snackbar]');
  if (el) esconder(el);
}

function esconder(el: HTMLElement) {
  window.clearTimeout(timer);
  el.dataset.show = 'false';
}
