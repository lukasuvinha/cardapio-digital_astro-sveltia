// Tema claro/escuro: troca, leitura e controle pela pagina que embute o site.
//
// - O botao de tema (ThemeToggle.astro) chama aplicarTema(t, { persistir: true }):
//   a escolha fica salva no localStorage ('cd-theme').
// - A pagina que embute o cardapio num iframe pode mandar o tema de duas
//   formas, que NAO gravam no localStorage (visitas diretas ao cardapio
//   continuam com a escolha/sistema de cada visitante):
//     1. na URL: ?theme=light ou ?theme=dark (lido antes da pintura pelo
//        script de SCRIPT_TEMA_INICIAL, no <head> do BaseLayout);
//     2. por mensagem: iframe.contentWindow.postMessage(
//          { type: 'cd-theme', theme: 'dark' }, '*')
//        (ouvida por ouvirTemaExterno, ligada em todas as paginas).
//   O tema vindo de fora fica no sessionStorage ('cd-theme-embed'), so para as
//   proximas paginas DENTRO do iframe (Sobre, Contato, produto) manterem o
//   mesmo tema. Ele e apagado quando o visitante usa o botao de tema.
//   Qualquer outro formato ou valor de mensagem e ignorado.

export type Tema = 'light' | 'dark';

export const CHAVE_TEMA = 'cd-theme';
export const CHAVE_TEMA_EMBUTIDO = 'cd-theme-embed';

export function ehTema(v: unknown): v is Tema {
  return v === 'light' || v === 'dark';
}

/** Tema pedido na URL (?theme=light|dark), ou null. */
export function temaDaUrl(search: string): Tema | null {
  const t = new URLSearchParams(search).get('theme');
  return ehTema(t) ? t : null;
}

/**
 * Tema de uma mensagem postMessage. So aceita exatamente
 * { type: 'cd-theme', theme: 'light' | 'dark' } (sem outras chaves).
 */
export function temaDaMensagem(data: unknown): Tema | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const chaves = Object.keys(data).sort();
  if (chaves.length !== 2 || chaves[0] !== 'theme' || chaves[1] !== 'type') return null;
  const m = data as { type: unknown; theme: unknown };
  if (m.type !== 'cd-theme') return null;
  return ehTema(m.theme) ? m.theme : null;
}

// Script do <head> (BaseLayout, is:inline): define data-theme ANTES da pintura
// para nao piscar. Ordem: ?theme= da URL > tema vindo do iframe nesta aba
// (sessionStorage) > escolha salva (localStorage) > preferencia do sistema.
// Fica como texto para os testes poderem executa-lo (tests/tema-externo.test.ts).
export const SCRIPT_TEMA_INICIAL = `(function () {
  var ok = function (t) { return t === 'light' || t === 'dark' ? t : null; };
  var externo = null;
  try {
    externo = ok(new URLSearchParams(location.search).get('theme'));
    if (externo) sessionStorage.setItem('${CHAVE_TEMA_EMBUTIDO}', externo);
    else externo = ok(sessionStorage.getItem('${CHAVE_TEMA_EMBUTIDO}'));
  } catch (e) {
    /* sessionStorage indisponivel: vale so o ?theme= desta pagina */
  }
  var stored = null;
  try {
    stored = ok(localStorage.getItem('${CHAVE_TEMA}'));
  } catch (e) {
    /* localStorage indisponivel: cai no CSS via prefers-color-scheme */
  }
  var escolhido = externo || stored;
  var theme =
    escolhido ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  // tema escolhido (botao ou pagina que embute): a barra do navegador acompanha
  if (escolhido) {
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', theme === 'dark' ? m.dataset.dark : m.dataset.light);
    });
  }
})();`;

export function temaAtual(): Tema {
  const attr = document.documentElement.getAttribute('data-theme');
  if (ehTema(attr)) return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Aplica o tema de uma vez so na pagina inteira. A classe
// cd-theme-switching (global.css) zera as transicoes de cor de todos os
// elementos durante a troca — sem ela cada componente trocava no seu
// proprio ritmo — e sai depois de dois frames, quando a pintura nova ja
// aconteceu.
function trocarTema(theme: Tema, persistir: boolean) {
  const html = document.documentElement;
  html.classList.add('cd-theme-switching');
  html.setAttribute('data-theme', theme);
  try {
    if (persistir) {
      localStorage.setItem(CHAVE_TEMA, theme);
      // escolha do visitante vale mais que o tema mandado pela pagina de fora
      sessionStorage.removeItem(CHAVE_TEMA_EMBUTIDO);
    } else {
      sessionStorage.setItem(CHAVE_TEMA_EMBUTIDO, theme);
    }
  } catch (e) {
    /* storage indisponivel: mantem apenas na pagina atual */
  }
  document.querySelectorAll('.cd-theme-toggle').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
  });
  // a cor da barra do navegador acompanha a escolha
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    const cor = theme === 'dark' ? m.dataset.dark : m.dataset.light;
    if (cor) m.content = cor;
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => html.classList.remove('cd-theme-switching'));
  });
}

/**
 * Troca o tema. Com View Transitions (e sem pedido de menos movimento), a
 * troca vira um cross-fade unico da pagina inteira (~300ms, ver
 * ::view-transition-* em global.css). Sem suporte ou com movimento reduzido:
 * troca instantanea. persistir: grava no localStorage (so o botao de tema).
 */
export function aplicarTema(theme: Tema, { persistir }: { persistir: boolean }) {
  if (theme === temaAtual() && document.documentElement.hasAttribute('data-theme')) {
    // mesmo tema: so registra a origem da escolha, sem animar
    trocarTema(theme, persistir);
    return;
  }
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (typeof doc.startViewTransition === 'function' && !reduzir) {
    doc.startViewTransition(() => trocarTema(theme, persistir));
  } else {
    trocarTema(theme, persistir);
  }
}

/** Liga o controle do tema por postMessage (pagina que embute o cardapio). */
export function ouvirTemaExterno(alvo: Window = window) {
  alvo.addEventListener('message', (e: MessageEvent) => {
    const t = temaDaMensagem(e.data);
    if (t) aplicarTema(t, { persistir: false });
  });
}
