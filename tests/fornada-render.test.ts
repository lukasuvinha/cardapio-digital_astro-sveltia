// Teste de render (Container API) do componente FornadaBanner e da home
// (index.astro), focado na fiacao entre a config e o HTML. A logica de
// texto/visibilidade em si e testada, pura, em tests/fornada-banner.test.ts.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import FornadaBanner from '../src/components/FornadaBanner.astro';
import Index from '../src/pages/index.astro';
import { resolveFornadaBanner } from '../src/lib/fornada-banner';
import { fornadaConfigBaseSchema } from '../src/content/fornada-schema';

describe('FornadaBanner (componente)', () => {
  it('mostra o rotulo e o valor em linhas separadas (quebra no primeiro ": ")', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(FornadaBanner, {
      props: { texto: 'Próxima fornada: Sábado, 1 de Agosto' },
    });
    expect(html).toMatch(/cd-fornada__rotulo[^>]*>Próxima fornada/);
    expect(html).toMatch(/cd-fornada__valor[^>]*>Sábado, 1 de Agosto</);
    // o leitor de tela continua ouvindo "Próxima fornada: Sábado..."
    expect(html).toContain('<span class="cd-sr');
  });

  it('texto sem ":" vira so o valor', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(FornadaBanner, { props: { texto: 'Em preparação' } });
    expect(html).not.toContain('cd-fornada__rotulo');
    expect(html).toContain('Em preparação');
  });
});

describe('Home — banner de fornada', () => {
  it('sem configuracao da fornada, o banner nao aparece (nao quebra a home)', async () => {
    // No ambiente do Vitest as content collections chegam vazias, entao a
    // home e renderizada sem config: o banner tem de sumir, nunca quebrar.
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index, {});
    expect(html).not.toContain('cd-fornada');
  });

  it('o exemplo do template (fornada.json) liga o banner com o aviso generico', () => {
    const raw = JSON.parse(readFileSync(join(process.cwd(), 'src/content/configuracoes/fornada.json'), 'utf8'));
    const banner = resolveFornadaBanner(fornadaConfigBaseSchema.parse(raw));
    expect(banner).toEqual({ visivel: true, texto: 'Próxima fornada: Em preparação' });
  });
});
