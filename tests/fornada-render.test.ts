// Teste de render (Container API) do componente FornadaBanner e da home
// (index.astro), focado na fiacao entre a config e o HTML. A logica de
// texto/visibilidade em si e testada, pura, em tests/fornada-banner.test.ts.
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import FornadaBanner from '../src/components/FornadaBanner.astro';
import Index from '../src/pages/index.astro';

describe('FornadaBanner (componente)', () => {
  it('renderiza o texto recebido', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(FornadaBanner, {
      props: { texto: 'Próxima fornada: Sábado, 1 de Agosto' },
    });
    expect(html).toContain('Próxima fornada: Sábado, 1 de Agosto');
  });
});

describe('Home — banner de fornada', () => {
  it('com a config padrao (banner desligado), o banner nao aparece', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index, {});
    expect(html).not.toContain('dn-fornada');
  });
});
