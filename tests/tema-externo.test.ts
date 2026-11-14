// Tema controlado pela pagina que embute o cardapio (iframe): ?theme= na URL e
// postMessage({ type: 'cd-theme', theme }). Ver src/lib/theme.ts.
//  - temaDaUrl / temaDaMensagem: so aceitam os formatos e valores combinados;
//  - SCRIPT_TEMA_INICIAL (o script do <head>) e executado aqui com window,
//    document e storages falsos: ?theme= vence, NAO grava no localStorage e
//    acerta a cor da barra do navegador;
//  - o BaseLayout usa esse script e liga o ouvinte de postMessage.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { temaDaUrl, temaDaMensagem, SCRIPT_TEMA_INICIAL, CHAVE_TEMA_EMBUTIDO } from '../src/lib/theme';

describe('temaDaUrl', () => {
  it('aceita ?theme=light e ?theme=dark', () => {
    expect(temaDaUrl('?theme=light')).toBe('light');
    expect(temaDaUrl('?theme=dark')).toBe('dark');
    expect(temaDaUrl('?a=1&theme=dark')).toBe('dark');
  });
  it('ignora ausencia e valores invalidos', () => {
    for (const s of ['', '?', '?theme=', '?theme=Dark', '?theme=blue', '?tema=dark']) {
      expect(temaDaUrl(s)).toBeNull();
    }
  });
});

describe('temaDaMensagem', () => {
  it('aceita exatamente { type: "cd-theme", theme: "light" | "dark" }', () => {
    expect(temaDaMensagem({ type: 'cd-theme', theme: 'light' })).toBe('light');
    expect(temaDaMensagem({ theme: 'dark', type: 'cd-theme' })).toBe('dark');
  });
  it('ignora qualquer outro formato ou valor', () => {
    const invalidas: unknown[] = [
      null,
      undefined,
      'dark',
      42,
      ['cd-theme', 'dark'],
      {},
      { type: 'cd-theme' },
      { theme: 'dark' },
      { type: 'cd-theme', theme: 'blue' },
      { type: 'cd-theme', theme: 'DARK' },
      { type: 'outro', theme: 'dark' },
      { type: 'cd-theme', theme: 'dark', extra: true },
    ];
    for (const m of invalidas) expect(temaDaMensagem(m)).toBeNull();
  });
});

// Executa o script do <head> num ambiente falso e devolve o que ele fez.
function rodarScript({
  search = '',
  local = {} as Record<string, string>,
  sessao = {} as Record<string, string>,
  sistemaEscuro = false,
} = {}) {
  const attrs: Record<string, string> = {};
  const metas = [
    { dataset: { light: '#claro', dark: '#escuro' }, content: '', setAttribute(_: string, v: string) { this.content = v; } },
  ];
  const storage = (dados: Record<string, string>) => ({
    getItem: (k: string) => (k in dados ? dados[k] : null),
    setItem: (k: string, v: string) => { dados[k] = String(v); },
    removeItem: (k: string) => { delete dados[k]; },
  });
  const window = { matchMedia: () => ({ matches: sistemaEscuro }) };
  const document = {
    documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } },
    querySelectorAll: () => metas,
  };
  new Function('window', 'document', 'location', 'localStorage', 'sessionStorage', 'URLSearchParams', SCRIPT_TEMA_INICIAL)(
    window, document, { search }, storage(local), storage(sessao), URLSearchParams,
  );
  return { tema: attrs['data-theme'], meta: metas[0].content, local, sessao };
}

describe('SCRIPT_TEMA_INICIAL (antes da pintura)', () => {
  it('sem nada escolhido, segue o sistema e nao mexe na barra do navegador', () => {
    expect(rodarScript().tema).toBe('light');
    const r = rodarScript({ sistemaEscuro: true });
    expect(r.tema).toBe('dark');
    expect(r.meta).toBe('');
  });

  it('com escolha salva no localStorage, usa a escolha (comportamento de sempre)', () => {
    const r = rodarScript({ local: { 'cd-theme': 'dark' } });
    expect(r.tema).toBe('dark');
    expect(r.meta).toBe('#escuro');
  });

  it('?theme= vence a escolha salva e o sistema, sem gravar no localStorage', () => {
    const r = rodarScript({ search: '?theme=light', local: { 'cd-theme': 'dark' }, sistemaEscuro: true });
    expect(r.tema).toBe('light');
    expect(r.meta).toBe('#claro');
    expect(r.local).toEqual({ 'cd-theme': 'dark' });
    // guardado so na aba (proximas paginas dentro do iframe)
    expect(r.sessao[CHAVE_TEMA_EMBUTIDO]).toBe('light');
  });

  it('nas proximas paginas da mesma aba, o tema de fora continua valendo', () => {
    const r = rodarScript({ sessao: { [CHAVE_TEMA_EMBUTIDO]: 'dark' }, local: { 'cd-theme': 'light' } });
    expect(r.tema).toBe('dark');
  });

  it('?theme= invalido e ignorado', () => {
    const r = rodarScript({ search: '?theme=roxo', local: { 'cd-theme': 'dark' } });
    expect(r.tema).toBe('dark');
    expect(r.sessao).toEqual({});
  });
});

describe('fiacao no layout e no botao de tema', () => {
  const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
  const toggle = readFileSync('src/components/ThemeToggle.astro', 'utf8');

  it('o <head> usa SCRIPT_TEMA_INICIAL e todas as paginas ouvem o postMessage', () => {
    expect(layout).toMatch(/<script is:inline set:html=\{SCRIPT_TEMA_INICIAL\}/);
    expect(layout).toContain('ouvirTemaExterno()');
  });

  it('o botao de tema grava a escolha (persistir: true); o tema de fora nao', () => {
    expect(toggle).toContain('persistir: true');
    const lib = readFileSync('src/lib/theme.ts', 'utf8');
    expect(lib).toMatch(/aplicarTema\(t, \{ persistir: false \}\)/);
  });
});

describe('o site pode ser embutido em iframe', () => {
  it('nenhum cabecalho/meta bloqueia (X-Frame-Options / frame-ancestors)', () => {
    const arquivos = ['wrangler.jsonc', 'astro.config.mjs', 'src/layouts/BaseLayout.astro'];
    for (const f of arquivos) {
      expect(readFileSync(f, 'utf8')).not.toMatch(/x-frame-options|frame-ancestors/i);
    }
    // sem arquivo _headers do Cloudflare
    expect(() => readFileSync('public/_headers', 'utf8')).toThrow();
  });
});
