import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Guarda de regressao contra os incidentes de producao com o CMS/fotos.
//
// Estrutura correta e verificada:
//  - entradas PLANAS: um .md por produto direto em src/content/produtos/;
//  - fotos em /public (URL publica, ex.: /uploads/foo.webp), NUNCA dentro de
//    src/content/ nem referenciadas como /src/... (isso exigiria o image() do
//    Astro, que hard-faila o build e ja quebrou o deploy 3x).
//
// Este teste falha se algum desses invariantes quebrar.
const entriesDir = join(process.cwd(), 'src/content/produtos');
const publicDir = join(process.cwd(), 'public');
const IMG = /\.(jpe?g|png|webp|avif|gif)$/i;

describe('estrutura da collection de produtos (guarda de regressao)', () => {
  const entradas = readdirSync(entriesDir);

  it('so contem arquivos .md planos (sem subpastas, sem imagens)', () => {
    const subpastas = entradas.filter((e) => statSync(join(entriesDir, e)).isDirectory());
    expect(subpastas).toEqual([]);
    const imagens = entradas.filter((e) => IMG.test(e));
    expect(imagens).toEqual([]);
    expect(entradas.filter((e) => e.endsWith('.md')).length).toBeGreaterThanOrEqual(6);
  });

  const mds = entradas.filter((e) => e.endsWith('.md'));

  it('todo campo foto e uma URL publica valida (nao /src/...) e em formato suportado', () => {
    for (const md of mds) {
      const txt = readFileSync(join(entriesDir, md), 'utf8');
      const m = txt.match(/^foto:\s*(.+)$/m);
      if (!m) continue; // produto sem campo foto e permitido
      const foto = m[1].trim().replace(/^["']|["']$/g, '');
      if (!foto) continue; // foto vazia (ex.: foto: '') = produto sem foto, permitido
      expect(foto.startsWith('/'), `${md}: foto deve ser URL publica`).toBe(true);
      expect(foto.startsWith('/src'), `${md}: foto NAO pode apontar para /src (nao e servido)`).toBe(false);
      expect(IMG.test(foto), `${md}: formato de foto nao suportado`).toBe(true);
    }
  });

  it('toda foto referenciada existe de fato em /public', () => {
    for (const md of mds) {
      const txt = readFileSync(join(entriesDir, md), 'utf8');
      const m = txt.match(/^foto:\s*(.+)$/m);
      if (!m) continue;
      const foto = m[1].trim().replace(/^["']|["']$/g, '');
      if (!foto) continue; // foto vazia = produto sem foto
      expect(existsSync(join(publicDir, foto)), `${md}: arquivo ${foto} nao existe em public/`).toBe(true);
    }
  });
});
