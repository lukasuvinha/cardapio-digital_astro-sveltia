// Campo opcional "cor" da categoria: schema, distribuicao automatica pela
// ordem das categorias e o select do CMS.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import { categoriaBaseSchema, CORES_CATEGORIA } from '../src/content/categoria-schema';
import { coresPorCategoria, CICLO_CORES } from '../src/data/menu-helpers';

describe('categoriaBaseSchema — campo cor', () => {
  it('aceita cada cor da lista', () => {
    for (const cor of CORES_CATEGORIA) {
      expect(categoriaBaseSchema.parse({ nome: 'X', cor }).cor).toBe(cor);
    }
  });

  it('cor e opcional', () => {
    expect(categoriaBaseSchema.parse({ nome: 'X' }).cor).toBeUndefined();
    expect(categoriaBaseSchema.parse({ nome: 'X', cor: '' }).cor).toBeUndefined();
  });

  it('cor invalida nao quebra o build: cai na distribuicao automatica', () => {
    expect(categoriaBaseSchema.parse({ nome: 'X', cor: 'azul' }).cor).toBeUndefined();
  });
});

describe('coresPorCategoria', () => {
  it('sem cores definidas, distribui o ciclo pela ordem das categorias', () => {
    const mapa = coresPorCategoria(['A', 'B', 'C', 'D', 'E']);
    expect(mapa).toEqual({ A: 'morango', B: 'caramelo', C: 'cacau', D: 'baunilha', E: 'morango' });
  });

  it('a cor definida no CMS tem prioridade', () => {
    const mapa = coresPorCategoria(['A', 'B'], { A: 'neutro' });
    expect(mapa.A).toBe('neutro');
    // B continua com a cor da sua posicao (nao "anda" por causa de A)
    expect(mapa.B).toBe(CICLO_CORES[1]);
  });

  it('o ciclo automatico nao usa "neutro" (reservado ao chip Todos)', () => {
    expect(CICLO_CORES).not.toContain('neutro');
  });
});

describe('categorias de exemplo e CMS', () => {
  it('as categorias de exemplo tem as cores do design', () => {
    const dir = join(process.cwd(), 'src/content/categorias');
    const cores: Record<string, string> = {};
    for (const f of readdirSync(dir)) {
      const txt = readFileSync(join(dir, f), 'utf8');
      const nome = txt.match(/^nome:\s*(.+)$/m)![1].trim();
      cores[nome] = txt.match(/^cor:\s*(.+)$/m)?.[1].trim() ?? '';
    }
    expect(cores).toEqual({
      'Bolo de Pote': 'morango',
      Brigadeiro: 'caramelo',
      Brownie: 'cacau',
      Cookies: 'baunilha',
    });
  });

  it('o CMS expoe "cor" como select opcional com as mesmas opcoes do schema', () => {
    const config = load(readFileSync(join(process.cwd(), 'public/admin/config.yml'), 'utf8')) as any;
    const cats = config.collections.find((c: any) => c.name === 'categorias');
    const cor = cats.fields.find((f: any) => f.name === 'cor');
    expect(cor.widget).toBe('select');
    expect(cor.required).toBe(false);
    const valores = cor.options.map((o: any) => o.value);
    expect(valores).toEqual([...CORES_CATEGORIA]);
    // rotulos em portugues (nao o valor cru)
    for (const o of cor.options) expect(o.label).not.toBe(o.value);
  });
});
