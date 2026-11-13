// Guarda do tema: todas as cores, fontes, raios e sombras vivem em
// src/styles/theme.css (tokens CSS). Este teste falha se algum componente ou
// pagina voltar a ter um valor fixo, se usar um token que nao existe, ou se
// as cores da barra do navegador (src/config/theme.ts) se desencontrarem do
// tema. Como criar um tema novo: ver o topo de src/styles/theme.css.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { THEME_COLOR_LIGHT, THEME_COLOR_DARK } from '../src/config/theme';

const root = process.cwd();
const themeCss = readFileSync(join(root, 'src/styles/theme.css'), 'utf8');

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) return arquivos(p);
    return /\.(astro|css)$/.test(nome) ? [p] : [];
  });
}

// arquivos de UI (tudo em src/ que tem CSS), menos o proprio tema
const ui = arquivos(join(root, 'src')).filter((p) => !p.endsWith('theme.css'));

/** so o CSS (blocos <style> nos .astro), sem comentarios */
function cssDe(p: string): string {
  const txt = readFileSync(p, 'utf8');
  const css = p.endsWith('.css')
    ? txt
    : [...txt.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function tokenDoTema(nome: string, bloco: RegExp): string {
  const m = themeCss.match(bloco);
  const v = m?.[1].match(new RegExp(`${nome}:\\s*([^;]+);`));
  return (v?.[1] ?? '').trim();
}

describe('tema (src/styles/theme.css)', () => {
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

  it('todo var(--token) usado nos componentes existe no tema', () => {
    const definidos = new Set([...themeCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const faltando: string[] = [];
    for (const p of ui) {
      for (const m of cssDe(p).matchAll(/var\((--[a-z0-9-]+)/g)) {
        if (!definidos.has(m[1])) faltando.push(`${relative(root, p)}: ${m[1]}`);
      }
    }
    expect(faltando).toEqual([]);
  });

  it('theme-color (src/config/theme.ts) bate com --brand (claro) e --bg (escuro)', () => {
    const brandClaro = tokenDoTema('--brand', /\/\* ---- Modo CLARO[\s\S]*?:root\s*{([\s\S]*?)}/);
    const bgEscuro = tokenDoTema('--bg', /:root\[data-theme='dark'\]\s*{([\s\S]*?)}/);
    expect(brandClaro.toLowerCase()).toBe(THEME_COLOR_LIGHT.toLowerCase());
    expect(bgEscuro.toLowerCase()).toBe(THEME_COLOR_DARK.toLowerCase());
  });

  it('o bloco do modo escuro e o fallback @media (prefers-color-scheme: dark) sao iguais', () => {
    const explicito = themeCss.match(/:root\[data-theme='dark'\]\s*{([\s\S]*?)}/)?.[1] ?? '';
    const fallback = themeCss.match(/:root:not\(\[data-theme='light'\]\):not\(\[data-theme='dark'\]\)\s*{([\s\S]*?)}/)?.[1] ?? '';
    const tokens = (s: string) =>
      [...s.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => `${m[1]}=${m[2].trim()}`).sort();
    expect(tokens(explicito).length).toBeGreaterThan(0);
    expect(tokens(fallback)).toEqual(tokens(explicito));
  });
});
