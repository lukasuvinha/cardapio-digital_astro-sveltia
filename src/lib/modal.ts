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
// de tela) e o CSS a esconde depois da animacao de saida. Enquanto abre ou
// fecha, a raiz tem data-animating (o CSS usa para will-change, so durante a
// animacao).

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

// Trava de rolagem por COMPENSACAO: mede a largura da barra de rolagem
// ANTES de esconde-la, poe overflow: hidden no <html> e devolve a mesma
// largura como padding-right no <body>. O conteudo (inclusive o header
// sticky e o trilho do FAB/snackbar, que vivem dentro do body) fica
// exatamente onde estava; o que e position: fixed (scrim, drawer) passa a
// usar a janela inteira — o scrim cobre tudo e o drawer fica a 12px da borda
// real. A largura fica em --cd-scrollbar no <html> para algum elemento fixo
// encostado a direita fora do modal que precise compensar. No celular a
// barra e sobreposta (largura 0) e nada muda.
//
// ---- ANTES (PR #4): espaco da barra sempre reservado com
//      html { scrollbar-gutter: stable } + --cd-gutter empurrando o drawer.
//      Trocado porque deixava uma faixa da cor do tema no lugar da barra, o
//      scrim nao cobria essa faixa e a borda direita do drawer ficava atras
//      dela. Para reativar: descomente o bloco abaixo (e o scrollbar-gutter
//      em global.css e o right do drawer em CartDrawer.astro) no lugar da
//      compensacao.
//   if (on && travas === 0) {
//     html.style.setProperty('--cd-gutter', `${Math.max(0, window.innerWidth - html.clientWidth)}px`);
//   }
function travarRolagem(on: boolean) {
  const html = document.documentElement;
  const body = document.body;
  if (on && travas === 0) {
    const barra = Math.max(0, window.innerWidth - html.clientWidth); // antes de esconder
    html.style.setProperty('--cd-scrollbar', `${barra}px`);
    html.style.overflow = 'hidden';
    if (barra > 0) body.style.paddingRight = `${barra}px`;
    body.classList.add('cd-scroll-lock');
  }
  travas = Math.max(0, travas + (on ? 1 : -1));
  if (!on && travas === 0) {
    // tudo no mesmo frame: sem estado intermediario em que algo pula
    html.style.removeProperty('overflow');
    html.style.removeProperty('--cd-scrollbar');
    body.style.removeProperty('padding-right');
    body.classList.remove('cd-scroll-lock');
  }
}

// Duracao maxima de uma animacao de abrir/fechar (seguranca, caso o
// transitionend nao chegue — ex.: movimento reduzido, aba em segundo plano).
const LIMITE_ANIMACAO_MS = 700;

/**
 * Chama `fim` quando a transicao do PROPRIO painel termina (transitionend
 * de filhos sobe por bolha e e ignorado), ou depois do limite de seguranca.
 * Retorna uma funcao que cancela a espera.
 */
function aoFimDaTransicao(painel: HTMLElement, fim: () => void): () => void {
  let feito = false;
  const terminar = () => {
    if (feito) return;
    feito = true;
    painel.removeEventListener('transitionend', onEnd);
    window.clearTimeout(timer);
    fim();
  };
  const onEnd = (e: TransitionEvent) => {
    if (e.target === painel) terminar();
  };
  painel.addEventListener('transitionend', onEnd);
  const timer = window.setTimeout(terminar, LIMITE_ANIMACAO_MS);
  return () => {
    feito = true;
    painel.removeEventListener('transitionend', onEnd);
    window.clearTimeout(timer);
  };
}

export function createModal(root: HTMLElement, opts: Options): Modal {
  let aberto = false;
  let origem: HTMLElement | null = null;
  let cancelarEspera: (() => void) | null = null;

  // marca a raiz durante a animacao (will-change no CSS) e roda `depois` no fim
  function animar(depois?: () => void) {
    cancelarEspera?.();
    root.dataset.animating = 'true';
    cancelarEspera = aoFimDaTransicao(opts.panel, () => {
      cancelarEspera = null;
      delete root.dataset.animating;
      depois?.();
    });
  }
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
      travarRolagem(true);
      pilha.push(modal);
      document.addEventListener('keydown', onKey);
      opts.onOpen?.();
      root.dataset.animating = 'true';
      // DOIS frames: o 1o garante que o estado fechado (com will-change) foi
      // calculado e PINTADO; so no 2o muda data-open — assim a transicao de
      // entrada sempre comeca do ponto certo, sem pulo no primeiro quadro.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!aberto) return; // fechou antes de comecar
          root.dataset.open = 'true';
          // foco so DEPOIS da entrada: mover o foco no meio da animacao
          // pode forcar rolagem/relayout e travar o primeiro quadro
          animar(() => {
            if (!aberto) return;
            const alvo = opts.initialFocus?.() ?? opts.panel;
            alvo.focus({ preventScroll: true });
          });
        });
      });
    },
    close() {
      if (!aberto) return;
      aberto = false;
      animar();
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
