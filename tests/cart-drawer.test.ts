// Teste de render (Container API) do CartDrawer, focado na fiacao da config
// de Entrega/Retirada (src/data/checkout-config.ts -> template). A logica de
// habilitar/desabilitar em si e testada em tests/checkout-config.test.ts,
// puramente; aqui so confere que a config padrao (ambas habilitadas, no
// arquivo real src/content/configuracoes/entrega.json) chega ate o HTML.
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CartDrawer from '../src/components/CartDrawer.astro';

describe('CartDrawer — entrega/retirada', () => {
  it('com a config padrao (ambas habilitadas), mostra o seletor Retirada/Entrega', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CartDrawer, {});
    expect(html).toContain('data-seg="fulfillment"');
    expect(html).toContain('>Retirada<');
    expect(html).toContain('>Entrega<');
    // linhas de taxa de entrega existem no DOM, mas comecam ocultas
    expect(html).toContain('data-taxa-row');
  });
});
