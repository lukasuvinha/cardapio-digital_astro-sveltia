// Painel de demonstracao sem login (scripts/demo-admin.mjs), so com
// PUBLIC_DEMO_MODE=true: config.yml com o Test Backend, link do seed no
// admin/index.html, arquivos do seed copiados e manifest.json gerado.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { load } from 'js-yaml';
import { configDemo, adminHtmlDemo, arquivosDoSeed, gerarDemoAdmin, SEED_LINK } from '../scripts/demo-admin.mjs';

const ROOT = process.cwd();
const CONFIG = readFileSync(path.join(ROOT, 'public/admin/config.yml'), 'utf8');
const HTML = '<!DOCTYPE html><html><head><title>x</title></head><body><script src="cms.js"></script></body></html>';

describe('configDemo', () => {
  const demo = load(configDemo(CONFIG)) as Record<string, any>;
  const original = load(CONFIG) as Record<string, any>;

  it('troca o backend por { name: test-repo }, sem repo, branch e base_url', () => {
    expect(demo.backend).toEqual({ name: 'test-repo' });
  });

  it('mantem todo o resto igual (colecoes, idioma, otimizacao de fotos)', () => {
    const { backend: _a, media_folder: _b, public_folder: _c, ...restoDemo } = demo;
    const { backend: _d, media_folder: _e, public_folder: _f, ...restoOriginal } = original;
    expect(restoDemo).toEqual(restoOriginal);
  });

  it('a pasta de midia passa a cobrir as fotos de exemplo (/img) e os uploads', () => {
    expect(demo.media_folder).toBe('public');
    expect(demo.public_folder).toBe('/');
  });

  it('o public/admin/config.yml do repositorio continua com o backend GitHub', () => {
    expect(original.backend.name).toBe('github');
  });
});

describe('adminHtmlDemo', () => {
  it('poe o link do seed no <head> e o aviso de demonstracao no <body>', () => {
    const out = adminHtmlDemo(HTML);
    expect(out).toContain(`${SEED_LINK}</head>`);
    expect(SEED_LINK).toBe('<link rel="cms-seed-url" href="/seed/manifest.json" />');
    expect(out).toMatch(/id="cd-demo-aviso"[^]*nada é salvo de verdade/);
  });
  it('e idempotente (rodar duas vezes nao duplica)', () => {
    const duas = adminHtmlDemo(adminHtmlDemo(HTML));
    expect(duas.match(/cms-seed-url/g)).toHaveLength(1);
    expect(duas.match(/cd-demo-aviso/g)).toHaveLength(1);
  });
});

describe('arquivosDoSeed (repositorio real)', () => {
  it('lista conteudo e fotos da loja de exemplo, com caminhos relativos a raiz', async () => {
    const files: string[] = await arquivosDoSeed(ROOT);
    expect(files).toContain('src/content/produtos/brownie-tradicional.md');
    expect(files).toContain('src/content/categorias/brownie.md');
    expect(files).toContain('src/content/configuracoes/rodape.json');
    expect(files).toContain('src/content/cupons/bemvindo10.md');
    expect(files).toContain('public/img/produtos/brownie-tradicional.webp');
    expect(files).toContain('public/img/sobre/doceria-exemplo.webp');
    // schemas e README nao sao conteudo
    expect(files.some((f) => f.endsWith('.ts'))).toBe(false);
    expect(files).not.toContain('src/content/README.md');
    // todos os caminhos sao validos para o Sveltia (sem "..", "." ou barra inicial)
    for (const f of files) expect(f.split('/').every((p) => p && p !== '.' && p !== '..')).toBe(true);
  });

  it('toda foto usada pelos produtos esta no seed', async () => {
    const files: string[] = await arquivosDoSeed(ROOT);
    const dir = path.join(ROOT, 'src/content/produtos');
    for (const f of readdirSync(dir)) {
      const foto = readFileSync(path.join(dir, f), 'utf8').match(/^foto:\s*(\S+)/m)?.[1];
      if (foto) expect(files).toContain(`public${foto}`);
    }
  });
});

describe('gerarDemoAdmin', () => {
  let tmp: string;
  let root: string;
  let dist: string;

  beforeAll(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'cd-demo-'));
    root = path.join(tmp, 'repo');
    dist = path.join(root, 'dist');
    const w = (rel: string, conteudo: string) => {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      writeFileSync(path.join(root, rel), conteudo);
    };
    w('public/admin/config.yml', CONFIG);
    w('src/content/produtos/bolo.md', '---\nnome: Bolo\nfoto: /img/produtos/bolo.webp\n---\n');
    w('src/content/configuracoes/sobre.json', '{}');
    w('src/content/produto-schema.ts', 'export {}');
    w('src/content/README.md', '# x');
    w('public/img/produtos/bolo.webp', 'imagem');
    w('public/uploads/foto nova.webp', 'upload');
    w('dist/admin/index.html', HTML);
    w('dist/admin/config.yml', CONFIG);
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('sem PUBLIC_DEMO_MODE, nao faz nada', async () => {
    const r = await gerarDemoAdmin({ root, dist, env: {} });
    expect(r).toEqual({ ativo: false });
    expect(existsSync(path.join(dist, 'seed'))).toBe(false);
    expect(readFileSync(path.join(dist, 'admin/index.html'), 'utf8')).toBe(HTML);
    expect(readFileSync(path.join(dist, 'admin/config.yml'), 'utf8')).toBe(CONFIG);
    // so "true" liga
    expect(await gerarDemoAdmin({ root, dist, env: { PUBLIC_DEMO_MODE: '1' } })).toEqual({ ativo: false });
  });

  it('com PUBLIC_DEMO_MODE=true, gera manifest, copia o seed e ajusta o admin', async () => {
    const r = await gerarDemoAdmin({ root, dist, env: { PUBLIC_DEMO_MODE: 'true' } });
    const esperado = [
      'public/img/produtos/bolo.webp',
      'public/uploads/foto nova.webp',
      'src/content/configuracoes/sobre.json',
      'src/content/produtos/bolo.md',
    ];
    expect(r.files).toEqual(esperado);

    const manifest = JSON.parse(readFileSync(path.join(dist, 'seed/manifest.json'), 'utf8'));
    expect(manifest).toEqual({ files: esperado });
    // cada arquivo do manifest existe em dist/seed/<caminho>, com o mesmo conteudo
    for (const f of esperado) {
      expect(readFileSync(path.join(dist, 'seed', f), 'utf8')).toBe(readFileSync(path.join(root, f), 'utf8'));
    }

    const cfg = load(readFileSync(path.join(dist, 'admin/config.yml'), 'utf8')) as Record<string, any>;
    expect(cfg.backend).toEqual({ name: 'test-repo' });
    expect(readFileSync(path.join(dist, 'admin/index.html'), 'utf8')).toContain(SEED_LINK);
    // o arquivo do repositorio nao muda
    expect(readFileSync(path.join(root, 'public/admin/config.yml'), 'utf8')).toBe(CONFIG);
  });
});
