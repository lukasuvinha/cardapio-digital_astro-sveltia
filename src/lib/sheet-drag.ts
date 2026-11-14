// Arrastar para baixo para fechar uma bottom sheet (celular): detalhe do
// produto (ProductSheet) e carrinho (CartDrawer).
//
// A DECISAO (fecha ou volta) e uma funcao pura, testada em
// tests/sheet-drag.test.ts. O gesto em si (ligarArrastoDaSheet) so roda no
// navegador e usa Pointer Events (toque e mouse).

/** Fecha se arrastou mais que esta fracao da altura do painel. */
export const LIMIAR_DISTANCIA = 0.25;
/** ...ou se soltou rapido para baixo (px/ms). */
export const LIMIAR_VELOCIDADE = 0.5;

export interface Arrasto {
  /** quanto o painel desceu, em px (negativo = para cima) */
  deslocamento: number;
  /** altura do painel, em px */
  altura: number;
  /** velocidade no momento de soltar, em px/ms (positiva = para baixo) */
  velocidade: number;
}

/**
 * Ao soltar o dedo: 'fechar' se o painel desceu mais de 25% da propria
 * altura, ou se o gesto terminou rapido para baixo (> 0,5 px/ms) — o
 * "peteleco". Caso contrario, 'voltar' para a posicao aberta. Um gesto para
 * cima nunca fecha, por mais rapido que seja.
 */
export function decidirArrasto({ deslocamento, altura, velocidade }: Arrasto): 'fechar' | 'voltar' {
  if (!(deslocamento > 0)) return 'voltar';
  if (velocidade > LIMIAR_VELOCIDADE) return 'fechar';
  if (altura > 0 && deslocamento > altura * LIMIAR_DISTANCIA) return 'fechar';
  return 'voltar';
}

/**
 * Posicao do painel durante o arrasto: segue o dedo para baixo, mas nao
 * passa da posicao aberta para cima.
 */
export function posicaoDoPainel(deslocamento: number): number {
  return Math.max(0, deslocamento);
}

/** Opacidade do fundo (scrim) durante o arrasto: clareia proporcionalmente. */
export function opacidadeDoFundo(deslocamento: number, altura: number): number {
  if (!(altura > 0)) return 1;
  return Math.min(1, Math.max(0, 1 - posicaoDoPainel(deslocamento) / altura));
}

/**
 * Velocidade (px/ms) a partir das ultimas amostras {y, t}, olhando so os
 * ultimos ~100ms do gesto (o que importa e o movimento final do dedo).
 */
export function velocidadeFinal(amostras: { y: number; t: number }[], janelaMs = 100): number {
  if (amostras.length < 2) return 0;
  const ultima = amostras[amostras.length - 1];
  let primeira = amostras[amostras.length - 2];
  for (let i = amostras.length - 2; i >= 0; i--) {
    if (ultima.t - amostras[i].t > janelaMs) break;
    primeira = amostras[i];
  }
  const dt = ultima.t - primeira.t;
  return dt > 0 ? (ultima.y - primeira.y) / dt : 0;
}

// ---------------------------------------------------------------------------
// Gesto (so no navegador)

interface Opcoes {
  /** painel que desce (o elemento com role="dialog") */
  painel: HTMLElement;
  /** fundo escurecido, que clareia durante o arrasto */
  fundo: HTMLElement;
  /**
   * Faixa de pegar (alca + topo do painel, >= 48px de altura): o gesto
   * comeca nela a qualquer momento. Deve ter `touch-action: none` no CSS.
   */
  pegas: () => HTMLElement[];
  /** conteudo rolavel atual: o gesto tambem comeca nele se estiver no topo */
  rolavel: () => HTMLElement | null;
  /** o gesto so vale quando isto e true (ex.: alca visivel = celular) */
  ativo: () => boolean;
  /** fecha pelo MESMO caminho do botao X (modal.close) */
  fechar: () => void;
}

const LIMIAR_INICIO = 6; // px de movimento antes de decidir se e arrasto

export function ligarArrastoDaSheet(o: Opcoes): void {
  let id: number | null = null;
  let y0 = 0;
  let x0 = 0;
  let pelaPega = false;
  let arrastando = false;
  let altura = 0;
  let amostras: { y: number; t: number }[] = [];
  let ignorarClique = false;
  let aoAssentar: ((e: TransitionEvent) => void) | null = null;

  const limparEstilos = () => {
    o.painel.style.transition = '';
    o.painel.style.transform = '';
    o.fundo.style.transition = '';
    o.fundo.style.opacity = '';
  };
  // cancela a limpeza pendente do "voltar" (se um novo arrasto comecar antes)
  const cancelarAssentar = () => {
    if (aoAssentar) o.painel.removeEventListener('transitionend', aoAssentar);
    aoAssentar = null;
  };

  function inicio(e: PointerEvent) {
    if (id !== null || !o.ativo()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const alvo = e.target as HTMLElement;
    pelaPega = o.pegas().some((p) => p.contains(alvo));
    const rol = o.rolavel();
    // fora da pega, so vale comecar no conteudo (e la ainda depende do topo)
    if (!pelaPega && !(rol && rol.contains(alvo))) return;
    // com mouse, nao deixa o arrasto selecionar texto: um segundo arrasto
    // comecando sobre uma selecao vira "arrastar e soltar" nativo do
    // navegador (pointercancel) e o gesto morre
    if (pelaPega && e.pointerType === 'mouse') e.preventDefault();
    id = e.pointerId;
    y0 = e.clientY;
    x0 = e.clientX;
    arrastando = false;
    amostras = [{ y: e.clientY, t: e.timeStamp }];
  }

  // decide, nos primeiros pixels, se o movimento vira arrasto da sheet
  function podeComecar(dy: number, dx: number): boolean {
    if (Math.abs(dy) < LIMIAR_INICIO || Math.abs(dy) < Math.abs(dx)) return false;
    if (pelaPega) return true;
    const rol = o.rolavel();
    return dy > 0 && (!rol || rol.scrollTop <= 0);
  }

  function mover(e: PointerEvent) {
    if (e.pointerId !== id) return;
    const dy = e.clientY - y0;
    if (!arrastando) {
      if (Math.abs(e.clientY - y0) < LIMIAR_INICIO && Math.abs(e.clientX - x0) < LIMIAR_INICIO) return;
      if (!podeComecar(dy, e.clientX - x0)) {
        id = null; // virou rolagem normal do conteudo (ou gesto lateral)
        return;
      }
      arrastando = true;
      cancelarAssentar();
      window.getSelection()?.removeAllRanges();
      altura = o.painel.getBoundingClientRect().height;
      o.painel.style.transition = 'none';
      o.fundo.style.transition = 'none';
      try {
        o.painel.setPointerCapture(e.pointerId);
      } catch {
        /* sem captura: segue funcionando enquanto o dedo estiver no painel */
      }
    }
    amostras.push({ y: e.clientY, t: e.timeStamp });
    if (amostras.length > 20) amostras.shift();
    o.painel.style.transform = `translateY(${posicaoDoPainel(dy)}px)`;
    o.fundo.style.opacity = String(opacidadeDoFundo(dy, altura));
  }

  function fim(e: PointerEvent) {
    if (e.pointerId !== id) return;
    id = null;
    if (!arrastando) return;
    arrastando = false;
    ignorarClique = true; // o "toque" que terminou o arrasto nao vira clique
    setTimeout(() => (ignorarClique = false), 0);
    const deslocamento = e.clientY - y0;
    const decisao =
      e.type === 'pointercancel'
        ? 'voltar'
        : decidirArrasto({ deslocamento, altura, velocidade: velocidadeFinal(amostras) });
    if (decisao === 'fechar') {
      cancelarAssentar();
      // volta as transicoes do CSS e fecha pelo caminho normal: o painel
      // anima da posicao atual ate sair da tela (curva de saida do tema)
      limparEstilos();
      o.fechar();
    } else {
      // volta para a posicao aberta com a curva de mola
      o.painel.style.transition = 'transform var(--dur-spring) var(--ease-spring)';
      o.fundo.style.transition = 'opacity var(--dur-spring) var(--ease-emph)';
      o.painel.style.transform = '';
      o.fundo.style.opacity = '';
      // so a transicao do PROPRIO painel (transitionend de filhos, como a
      // camada de estado dos botoes, sobe por bolha e nao pode limpar nada)
      cancelarAssentar();
      aoAssentar = (ev: TransitionEvent) => {
        if (ev.target !== o.painel || ev.propertyName !== 'transform') return;
        cancelarAssentar();
        limparEstilos();
      };
      o.painel.addEventListener('transitionend', aoAssentar);
    }
  }

  o.painel.addEventListener('pointerdown', inicio);
  o.painel.addEventListener('pointermove', mover);
  o.painel.addEventListener('pointerup', fim);
  o.painel.addEventListener('pointercancel', fim);
  o.painel.addEventListener(
    'click',
    (e) => {
      if (ignorarClique) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );

  // No toque, quando o gesto comeca NO CONTEUDO (fora da pega, que ja tem
  // touch-action: none), o navegador tentaria rolar a pagina e cancelaria os
  // pointer events. Com o conteudo no topo e o dedo descendo, impedimos essa
  // rolagem (touchmove nao passivo) para o arrasto da sheet continuar.
  o.painel.addEventListener(
    'touchmove',
    (e) => {
      if (id === null || pelaPega || !e.cancelable) return;
      const t = e.touches[0];
      if (!t) return;
      const dy = t.clientY - y0;
      const dx = t.clientX - x0;
      const rol = o.rolavel();
      // ja no primeiro movimento (antes do limiar de inicio): se o navegador
      // comecar a rolar, ele cancela os pointer events e o arrasto morre
      const noTopoDescendo = dy > 0 && Math.abs(dy) >= Math.abs(dx) && (!rol || rol.scrollTop <= 0);
      if (arrastando || noTopoDescendo) e.preventDefault();
    },
    { passive: false },
  );
}
