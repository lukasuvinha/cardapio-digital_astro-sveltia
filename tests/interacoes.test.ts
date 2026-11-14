// Guardas das correcoes de interacao (salto ao abrir painel, FAB x rodape,
// arrastar para fechar, troca de tema uniforme). O comportamento em si foi
// conferido no navegador; aqui garantimos que as pecas nao sumam do codigo.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ler = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const css = (p: string) => ler(p).replace(/\/\*[\s\S]*?\*\//g, '');

describe('1. pagina nao "salta" ao abrir carrinho/detalhe', () => {
  it('html reserva o espaco da barra de rolagem (scrollbar-gutter: stable)', () => {
    expect(css('src/styles/global.css')).toMatch(/html\s*{[^}]*scrollbar-gutter:\s*stable/);
  });

  it('o drawer compensa a faixa reservada para ficar a 12px da borda', () => {
    expect(ler('src/components/CartDrawer.astro')).toContain('right: calc(12px - var(--cd-gutter, 0px))');
    expect(ler('src/lib/modal.ts')).toContain("'--cd-gutter'");
  });
});

describe('2. FAB nao cobre o rodape', () => {
  it('o FAB sobe por --fab-lift (translate, separado do transform das animacoes)', () => {
    const drawer = ler('src/components/CartDrawer.astro');
    expect(drawer).toMatch(/\.cd-fab\s*{[^}]*translate:\s*0 calc\(-1 \* var\(--fab-lift, 0px\)\)/);
    // calculado no scroll/resize com rAF e listeners passivos
    expect(drawer).toContain("window.innerHeight - footer.getBoundingClientRect().top");
    expect(drawer).toMatch(/addEventListener\('scroll', agendar, \{ passive: true \}\)/);
    expect(drawer).toMatch(/addEventListener\('resize', agendar, \{ passive: true \}\)/);
    expect(drawer).toContain('requestAnimationFrame(medir)');
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
