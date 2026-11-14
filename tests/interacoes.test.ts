// Guardas das correcoes de interacao (salto ao abrir painel, FAB x rodape,
// arrastar para fechar, troca de tema uniforme). O comportamento em si foi
// conferido no navegador; aqui garantimos que as pecas nao sumam do codigo.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const css = (p: string) => ler(p).replace(/\/\*[\s\S]*?\*\//g, '');

describe('1. pagina nao "salta" ao abrir carrinho/detalhe (trava por compensacao)', () => {
  it('sem scrollbar-gutter ativo (a faixa reservada foi trocada pela compensacao)', () => {
    expect(css('src/styles/global.css')).not.toMatch(/scrollbar-gutter:\s*stable/);
  });

  it('modal.ts mede a barra ANTES de travar e aplica overflow no <html> + padding-right no <body>', () => {
    const m = ler('src/lib/modal.ts');
    const medir = m.indexOf('window.innerWidth - html.clientWidth');
    const travar = m.indexOf("html.style.overflow = 'hidden'");
    expect(medir).toBeGreaterThan(-1);
    expect(travar).toBeGreaterThan(medir);
    expect(m).toContain('body.style.paddingRight');
    expect(m).toContain("'--cd-scrollbar'");
    // ao destravar, tudo sai junto
    expect(m).toMatch(/removeProperty\('overflow'\);\s*html\.style\.removeProperty\('--cd-scrollbar'\);\s*body\.style\.removeProperty\('padding-right'\)/);
  });

  it('o body nao recebe overflow: hidden (quebraria o header sticky com o painel aberto)', () => {
    expect(css('src/styles/global.css')).not.toMatch(/body\.cd-scroll-lock\s*{[^}]*overflow/);
  });

  it('o drawer usa --sheet-inset nas bordas e na largura (sem --cd-gutter)', () => {
    const drawer = css('src/components/CartDrawer.astro');
    for (const lado of ['top', 'right', 'bottom']) expect(drawer).toMatch(new RegExp(`${lado}:\\s*var\\(--sheet-inset\\);`));
    expect(drawer).toContain('width: min(460px, calc(100vw - 2 * var(--sheet-inset)));');
    expect(drawer).not.toContain('--cd-gutter');
  });

  it('--sheet-inset (24px) vem do tema e tambem da o respiro do dialog do produto', () => {
    expect(css('src/styles/theme.css')).toMatch(/--sheet-inset:\s*24px;/);
    const sheet = css('src/components/ProductSheet.astro');
    expect(sheet).toMatch(/\.cd-sheet\s*{[^}]*padding:\s*var\(--sheet-inset\);/);
    expect(sheet).toContain('max-height: calc(100vh - 2 * var(--sheet-inset));');
  });
});

describe('2. FAB preso acima do rodape so com CSS', () => {
  it('FAB e snackbar ficam em trilhos sticky de altura 0, renderizados logo antes do <footer>', () => {
    const rail = css('src/components/CartRail.astro');
    expect(rail).toMatch(/\.cd-rail\s*{[^}]*position:\s*sticky;[^}]*bottom:\s*env\(safe-area-inset-bottom\);[^}]*height:\s*0;/);
    expect(ler('src/components/CartRail.astro')).toContain('data-fab');
    expect(ler('src/components/CartRail.astro')).toContain('<Snackbar />');
    const footer = ler('src/components/Footer.astro');
    expect(footer.indexOf('<CartRail />')).toBeGreaterThan(-1);
    expect(footer.indexOf('<CartRail />')).toBeLessThan(footer.indexOf('<footer'));
  });

  it('o FAB tem 16px de respiro e nao usa mais position: fixed nem --fab-lift', () => {
    const rail = css('src/components/CartRail.astro');
    expect(rail).toMatch(/\.cd-fab\s*{[^}]*margin:\s*0 16px 16px 0;/);
    expect(rail).not.toMatch(/\.cd-fab\s*{[^}]*position:\s*fixed/);
    expect(rail).not.toContain('--fab-lift');
    expect(css('src/components/Snackbar.astro')).not.toContain('--fab-lift');
  });

  it('o listener de scroll do --fab-lift ficou so como comentario', () => {
    const drawer = ler('src/components/CartDrawer.astro');
    const ativo = drawer.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(ativo).not.toContain('--fab-lift');
    expect(ativo).not.toMatch(/addEventListener\('scroll'/);
  });
});

describe('3b. abertura fluida dos paineis', () => {
  it('modal.open usa dois requestAnimationFrame antes de data-open e foca so no fim da transicao', () => {
    const m = ler('src/lib/modal.ts');
    expect(m).toMatch(/requestAnimationFrame\(\(\) => \{\s*requestAnimationFrame\(\(\) => \{[\s\S]*?root\.dataset\.open = 'true'/);
    expect(m).toContain("addEventListener('transitionend'");
    expect(m).toContain('LIMITE_ANIMACAO_MS');
    expect(m).toContain('focus({ preventScroll: true })');
    expect(m).toContain('dataset.animating');
  });

  it('will-change so durante a animacao (data-animating) no painel e no fundo', () => {
    for (const [p, painel, fundo] of [
      ['src/components/CartDrawer.astro', 'cd-cart__panel', 'cd-cart__scrim'],
      ['src/components/ProductSheet.astro', 'cd-sheet__panel', 'cd-sheet__scrim'],
    ]) {
      const c = css(p);
      expect(c).toMatch(new RegExp(`\\[data-animating\\] \\.${painel}\\s*{\\s*will-change:\\s*transform`));
      expect(c).toMatch(new RegExp(`\\[data-animating\\] \\.${fundo}\\s*{\\s*will-change:\\s*opacity`));
    }
  });

  it('abrir/fechar so anima transform e opacity', () => {
    for (const p of ['src/components/CartDrawer.astro', 'src/components/ProductSheet.astro']) {
      for (const m of css(p).matchAll(/transition:\s*([^;]+);/g)) {
        const props = m[1].split(',').map((t) => t.trim().split(/\s+/)[0]);
        for (const prop of props) expect(['transform', 'opacity', 'visibility', 'none', 'background-color', 'color', 'width', 'border-radius']).toContain(prop);
      }
      // painel e fundo: so transform/opacity
      const c = css(p);
      for (const bloco of c.match(/\.cd-(cart|sheet)__(panel|scrim)\s*{[^}]*}/g) ?? []) {
        const t = bloco.match(/transition:\s*([^;]+);/);
        if (t) for (const prop of t[1].split(',').map((x) => x.trim().split(/\s+/)[0])) expect(['transform', 'opacity']).toContain(prop);
      }
    }
  });

  it('a sheet decodifica a foto (mesma URL do card) antes de abrir, com limite de ~150ms', () => {
    const s = ler('src/components/ProductSheet.astro');
    expect(s).toContain("'pointerdown'");
    expect(s).toContain('.decode()');
    expect(s).toContain('ESPERA_MAX_MS = 150');
  });

  it('sem realce de toque em links e clicaveis dos cards', () => {
    expect(css('src/styles/global.css')).toMatch(/:where\(a,[^)]*\[data-open-detail\][^)]*\)\s*{\s*-webkit-tap-highlight-color:\s*transparent/);
  });
});

describe('3. arrastar para fechar', () => {
  it('ProductSheet e CartDrawer ligam o gesto e fecham pelo modal (mesmo caminho do X)', () => {
    for (const p of ['src/components/ProductSheet.astro', 'src/components/CartDrawer.astro']) {
      const src = ler(p);
      expect(src).toContain('ligarArrastoDaSheet(');
      expect(src).toContain('fechar: () => modal.close()');
    }
  });

  it('a faixa de pegar tem 48px e touch-action: none; no desktop ela some com a alca', () => {
    const sheet = css('src/components/ProductSheet.astro');
    expect(sheet).toMatch(/\.cd-sheet__grab\s*{[^}]*height:\s*48px[^}]*touch-action:\s*none/);
    expect(sheet).toMatch(/\.cd-sheet__handle,\s*\.cd-sheet__grab\s*{\s*display:\s*none/);
    expect(css('src/components/CartDrawer.astro')).toMatch(/\.cd-cart__handle,\s*\.cd-cart__bar\s*{[^}]*touch-action:\s*none/);
  });

  it('usa Pointer Events', () => {
    const lib = ler('src/lib/sheet-drag.ts');
    for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) expect(lib).toContain(`'${ev}'`);
  });
});

describe('4. troca de tema uniforme', () => {
  it('global.css zera as transicoes durante a troca e define o cross-fade de 300ms', () => {
    const g = css('src/styles/global.css');
    expect(g).toMatch(/\.cd-theme-switching \*[^{]*{[^}]*transition:\s*none !important/);
    expect(g).toMatch(/::view-transition-old\(root\),\s*::view-transition-new\(root\)\s*{[^}]*animation-duration:\s*300ms[^}]*var\(--ease-emph\)/);
  });

  it('o body nao tem mais transicao de cor propria', () => {
    expect(css('src/styles/global.css')).not.toMatch(/body\s*{[^}]*transition/);
  });

  it('ThemeToggle usa View Transitions so sem prefers-reduced-motion e tira a classe depois de 2 frames', () => {
    const t = ler('src/components/ThemeToggle.astro');
    expect(t).toContain('startViewTransition');
    expect(t).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(t).toMatch(/requestAnimationFrame\(\(\) => \{\s*requestAnimationFrame\(\(\) => html\.classList\.remove\('cd-theme-switching'\)\)/);
    expect(t).toContain('meta[name="theme-color"]');
  });
});
