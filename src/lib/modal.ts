// Comportamento comum de sheets, drawer e dialogs (carrinho, detalhe do
// produto, foto ampliada). So roda no navegador.
//
// Garante o que a acessibilidade pede para um dialogo modal:
//  - role="dialog" + aria-modal (ficam no markup de cada componente);
//  - foco vai para dentro ao abrir e fica PRESO la dentro (Tab / Shift+Tab);
//  - Esc e clique no fundo ([data-modal-close]) fecham;
//  - ao fechar, o foco volta para o elemento que abriu;
//  - a rolagem da pagina fica travada enquanto houver algum aberto.
//
// Visual: o componente anima pelo atributo data-open ("true"/"false") no
// elemento raiz. Fechado, a raiz fica com `inert` (fora do Tab e do leitor
// de tela) e o CSS a esconde depois da animacao de saida.

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface Modal {
  open(trigger?: HTMLElement | null): void;
  close(): void;
  isOpen(): boolean;
}

interface Options {
  /** Painel com role="dialog" (recebe o foco se nao houver nada focavel). */
  panel: HTMLElement;
  /** Elemento que recebe o foco ao abrir (padrao: o painel). */
  initialFocus?: () => HTMLElement | null;
  onOpen?: () => void;
  onClose?: () => void;
}

// pilha de modais abertos: Esc e o foco preso valem so para o do topo
const pilha: Modal[] = [];
let travas = 0;

function travarRolagem(on: boolean) {
  travas = Math.max(0, travas + (on ? 1 : -1));
  document.body.classList.toggle('cd-scroll-lock', travas > 0);
}

export function createModal(root: HTMLElement, opts: Options): Modal {
  let aberto = false;
  let origem: HTMLElement | null = null;
  root.dataset.open = 'false';
  root.setAttribute('inert', '');
  if (!opts.panel.hasAttribute('tabindex')) opts.panel.setAttribute('tabindex', '-1');

  const focaveis = () =>
    Array.from(opts.panel.querySelectorAll<HTMLElement>(FOCAVEIS)).filter(
      (el) => el.offsetParent !== null && !el.closest('[inert]'),
    );

  function onKey(e: KeyboardEvent) {
    if (pilha[pilha.length - 1] !== modal) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      modal.close();
      return;
    }
    if (e.key !== 'Tab') return;
    const els = focaveis();
    if (els.length === 0) {
      e.preventDefault();
      opts.panel.focus();
      return;
    }
    const primeiro = els[0];
    const ultimo = els[els.length - 1];
    const ativo = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (ativo === primeiro || !opts.panel.contains(ativo))) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && (ativo === ultimo || !opts.panel.contains(ativo))) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  const modal: Modal = {
    open(trigger) {
      if (aberto) return;
      aberto = true;
      origem = trigger ?? (document.activeElement as HTMLElement | null);
      root.removeAttribute('inert');
      root.setAttribute('aria-hidden', 'false');
      // proximo frame: deixa o navegador pintar o estado fechado antes, para
      // a transicao de entrada acontecer
      travarRolagem(true);
      pilha.push(modal);
      document.addEventListener('keydown', onKey);
      opts.onOpen?.();
      requestAnimationFrame(() => {
        root.dataset.open = 'true';
        // o foco so pode ir para dentro depois que o painel ficou visivel
        const alvo = opts.initialFocus?.() ?? opts.panel;
        alvo.focus({ preventScroll: true });
      });
    },
    close() {
      if (!aberto) return;
      aberto = false;
      root.dataset.open = 'false';
      root.setAttribute('aria-hidden', 'true');
      root.setAttribute('inert', '');
      travarRolagem(false);
      const i = pilha.indexOf(modal);
      if (i >= 0) pilha.splice(i, 1);
      document.removeEventListener('keydown', onKey);
      opts.onClose?.();
      if (origem && document.contains(origem)) origem.focus({ preventScroll: true });
      origem = null;
    },
    isOpen: () => aberto,
  };

  // fundo (scrim) e botoes de fechar
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-modal-close]') && root.contains(t)) modal.close();
  });

  return modal;
}
