// Guarda do tema: todas as cores, fontes, raios e sombras vivem nos arquivos
// de tema (src/styles/theme.css e alternativos). Este teste falha se algum
// componente ou pagina voltar a ter um valor fixo, se usar um token que nao
// existe, se as cores da barra do navegador (src/config/theme.ts) nao
// baterem com --hero, se um tema alternativo esquecer algum token de cor, ou
// se um par de texto principal perder o contraste AA.
// Como criar um tema novo: ver o topo de src/styles/theme.css.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { THEMES, ACTIVE_THEME, THEME_COLOR_LIGHT, THEME_COLOR_DARK } from '../src/config/theme';

const root = process.cwd();
const ler = (p: string) => readFileSync(join(root, p), 'utf8');
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) return arquivos(p);
    return /\.(astro|css)$/.test(nome) ? [p] : [];
  });
}

const arquivosDeTema = Object.values(THEMES).map((t) => join(root, t.css));
// arquivos de UI (tudo em src/ que tem CSS), menos os proprios temas
const ui = arquivos(join(root, 'src')).filter((p) => !arquivosDeTema.includes(p));

/** so o CSS (blocos <style> nos .astro), sem comentarios */
function cssDe(p: string): string {
  const txt = readFileSync(p, 'utf8');
  const css = p.endsWith('.css')
    ? txt
    : [...txt.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  return semComentarios(css);
}

/** tokens "--nome: valor" de um bloco CSS */
function tokens(bloco: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of semComentarios(bloco).matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

function bloco(css: string, seletor: RegExp): string {
  const m = css.match(new RegExp(seletor.source + String.raw`\s*{([^}]*)}`));
  return m?.[1] ?? '';
}

// Blocos de cada tema: claro, escuro (atributo) e escuro (fallback @media)
const SELETORES: Record<string, { claro: RegExp; escuro: RegExp; fallback: RegExp }> = {
  material: {
    claro: /\/\* ---- Modo CLARO[^\n]*\n:root/,
    escuro: /:root\[data-theme='dark'\]/,
    fallback: /:root:not\(\[data-theme='light'\]\):not\(\[data-theme='dark'\]\)/,
  },
  confeitaria: {
    claro: /:root\[data-ui-theme='confeitaria'\]/,
    escuro: /:root\[data-ui-theme='confeitaria'\]\[data-theme='dark'\]/,
    fallback: /:root\[data-ui-theme='confeitaria'\]:not\(\[data-theme='light'\]\):not\(\[data-theme='dark'\]\)/,
  },
};

function modos(nome: string) {
  const css = ler(THEMES[nome as keyof typeof THEMES].css);
  const s = SELETORES[nome];
  return { claro: tokens(bloco(css, s.claro)), escuro: tokens(bloco(css, s.escuro)), fallback: tokens(bloco(css, s.fallback)) };
}

// contraste WCAG
function luminancia(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const l = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
const CATEGORIAS = ['--c-neutro', '--c-morango', '--c-caramelo', '--c-cacau', '--c-baunilha'];
// [texto, fundo] — pares de texto que aparecem no site
const PARES: [string, string][] = [
  ['--on-cta', '--cta'],
  ['--on-ok', '--ok'],
  ['--ok-text', '--sf-low'],
  ['--on-hl', '--hl'],
  ['--on-t-c', '--t-c'],
  ['--t', '--sf-lowest'],
  ['--on-hero', '--hero'],
  ['--on-s-c', '--s-c'],
  ['--inv-on-sf', '--inv-sf'],
  ['--err', '--sf-low'],
  ['--primary', '--sf'],
  ['--primary', '--sf-low'],
  ['--primary', '--sf-lowest'],
  ['--on-sf', '--sf'],
  ['--on-sf', '--sf-low'],
  ['--on-sf', '--sf-high'],
  ['--on-sf-v', '--sf'],
  ['--on-sf-v', '--sf-low'],
  ['--on-sf-v', '--sf-lowest'],
  ...CATEGORIAS.flatMap((c) => [['--on-sf', c], ['--on-sf-v', c], ['--primary', c]] as [string, string][]),
];

describe('tema — componentes so usam tokens', () => {
  it('nenhum componente/pagina tem cor, fonte, raio ou sombra fixos', () => {
    const problemas: string[] = [];
    for (const p of ui) {
      const css = cssDe(p);
      const regras: [RegExp, string][] = [
        [/#[0-9a-fA-F]{3,8}\b/g, 'cor hex'],
        [/rgba?\(/g, 'cor rgb()'],
        [/hsla?\(/g, 'cor hsl()'],
        [/font-family:(?!\s*(var\(|inherit))[^;]*/g, 'fonte'],
        [/border-radius:(?!\s*(var\(|0\b|inherit))[^;]*/g, 'raio'],
        [/box-shadow:(?!\s*(var\(|none|inherit))[^;]*/g, 'sombra'],
      ];
      for (const [re, tipo] of regras) {
        for (const m of css.match(re) ?? []) problemas.push(`${relative(root, p)}: ${tipo} (${m})`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('todo var(--token) usado nos componentes existe no tema padrao', () => {
    const tema = ler('src/styles/theme.css');
    const definidos = new Set([...tema.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    // definidos localmente (ex.: --cat, --media-ratio, --i, --motion-shift)
    for (const p of ui) for (const m of cssDe(p).matchAll(/(--[a-z0-9-]+)\s*:/g)) definidos.add(m[1]);
    const faltando: string[] = [];
    for (const p of ui) {
      for (const m of cssDe(p).matchAll(/var\((--[a-z0-9-]+)(,)?/g)) {
        // var(--x, fallback) e permitido sem definicao
        if (!definidos.has(m[1]) && !m[2]) faltando.push(`${relative(root, p)}: ${m[1]}`);
      }
    }
    expect(faltando).toEqual([]);
  });
});

describe.each(Object.keys(THEMES))('tema "%s"', (nome) => {
  const { claro, escuro, fallback } = modos(nome);
  const padrao = modos('material');

  it('theme-color (src/config/theme.ts) = --hero do modo claro e do escuro', () => {
    const t = THEMES[nome as keyof typeof THEMES];
    expect(claro['--hero']?.toLowerCase()).toBe(t.colorLight.toLowerCase());
    expect(escuro['--hero']?.toLowerCase()).toBe(t.colorDark.toLowerCase());
  });

  it('define todos os tokens de cor do tema padrao, nos dois modos', () => {
    const cores = Object.keys(padrao.claro);
    expect(cores.filter((k) => !(k in claro))).toEqual([]);
    expect(Object.keys(padrao.escuro).filter((k) => !(k in escuro))).toEqual([]);
  });

  it('o bloco do modo escuro e o fallback @media (prefers-color-scheme: dark) sao iguais', () => {
    expect(Object.keys(escuro).length).toBeGreaterThan(0);
    expect(fallback).toEqual(escuro);
  });

  it('pares de texto passam no contraste AA (4,5:1) nos dois modos', () => {
    const falhas: string[] = [];
    for (const [modo, t] of [['claro', claro], ['escuro', escuro]] as const) {
      for (const [texto, fundo] of PARES) {
        const a = t[texto];
        const b = t[fundo];
        if (!/^#[0-9a-f]{6}$/i.test(a ?? '') || !/^#[0-9a-f]{6}$/i.test(b ?? '')) {
          falhas.push(`${modo}: ${texto}/${fundo} sem cor hex`);
          continue;
        }
        const r = contraste(a, b);
        if (r < 4.5) falhas.push(`${modo}: ${texto} sobre ${fundo} = ${r.toFixed(2)}`);
      }
    }
    expect(falhas).toEqual([]);
  });
});

describe('tema ativo', () => {
  it('as constantes exportadas sao as do tema ativo', () => {
    expect(THEME_COLOR_LIGHT).toBe(THEMES[ACTIVE_THEME].colorLight);
    expect(THEME_COLOR_DARK).toBe(THEMES[ACTIVE_THEME].colorDark);
  });

  it('o tema padrao usa o theme-color do design (#FFD9DF claro, #3E1821 escuro)', () => {
    expect(THEMES.material.colorLight).toBe('#FFD9DF');
    expect(THEMES.material.colorDark).toBe('#3E1821');
  });

  it('a URL das fontes do tema padrao carrega Outfit (500/600/700) e Roboto (400/500/700)', () => {
    expect(THEMES.material.fontsUrl).toContain('family=Outfit:wght@500;600;700');
    expect(THEMES.material.fontsUrl).toContain('family=Roboto:wght@400;500;700');
  });

  it('os temas alternativos sao importados no BaseLayout', () => {
    const layout = ler('src/layouts/BaseLayout.astro');
    for (const t of Object.values(THEMES)) {
      expect(layout).toContain(`'../styles/${t.css.split('/').pop()}'`);
    }
  });
});
