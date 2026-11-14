// Modo demonstracao no site (PUBLIC_DEMO_MODE=true): faixa no topo do
// cardapio e etapa "demo" no carrinho (mensagem que a loja receberia, sem
// abrir o WhatsApp). Sem a variavel, nada disso aparece.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CartDrawer from '../src/components/CartDrawer.astro';
import DemoBanner from '../src/components/DemoBanner.astro';
import { demoAtivo } from '../src/config/demo';

afterEach(() => vi.unstubAllEnvs());

describe('demoAtivo', () => {
  it('so liga com PUBLIC_DEMO_MODE=true', () => {
    expect(demoAtivo({})).toBe(false);
    expect(demoAtivo({ PUBLIC_DEMO_MODE: 'false' })).toBe(false);
    expect(demoAtivo({ PUBLIC_DEMO_MODE: '1' })).toBe(false);
    expect(demoAtivo({ PUBLIC_DEMO_MODE: 'true' })).toBe(true);
  });
});

describe('sem PUBLIC_DEMO_MODE (template normal)', () => {
  it('nao mostra a faixa nem a etapa de demonstracao', async () => {
    vi.stubEnv('PUBLIC_DEMO_MODE', '');
    const c = await AstroContainer.create();
    expect(await c.renderToString(DemoBanner, {})).not.toContain('cd-demo-banner');
    const html = await c.renderToString(CartDrawer, {});
    expect(html).not.toContain('data-pane="demo"');
    // a confirmacao continua igual
    expect(html).toContain('data-pane="confirmed"');
    expect(html).toContain('Abrimos o WhatsApp com o seu pedido.');
  });
});

describe('com PUBLIC_DEMO_MODE=true', () => {
  it('faixa discreta com o texto combinado', async () => {
    vi.stubEnv('PUBLIC_DEMO_MODE', 'true');
    const c = await AstroContainer.create();
    const html = await c.renderToString(DemoBanner, {});
    expect(html).toContain('Loja de demonstração · os pedidos não são enviados');
  });

  it('etapa "demo" com o titulo, o balao da mensagem e o botao de voltar', async () => {
    vi.stubEnv('PUBLIC_DEMO_MODE', 'true');
    const c = await AstroContainer.create();
    const html = await c.renderToString(CartDrawer, {});
    const etapa = html.slice(html.indexOf('data-pane="demo"'));
    expect(etapa).toContain('Esta é a mensagem que a loja receberia');
    expect(etapa).toContain('data-demo-message');
    expect(etapa).toMatch(/data-modal-close[^>]*>\s*Voltar ao cardápio/);
    // a confirmacao do modo normal continua no markup, igual
    expect(html).toContain('Abrimos o WhatsApp com o seu pedido.');
  });
});

describe('envio no script do carrinho', () => {
  const src = readFileSync('src/components/CartDrawer.astro', 'utf8');
  const envio = src.slice(src.indexOf("sendBtn.addEventListener('click'"));

  it('em modo demo mostra a mensagem e NAO abre o wa.me', () => {
    const ramoDemo = envio.slice(envio.indexOf('if (demoAtivo())'), envio.indexOf('} else {'));
    expect(ramoDemo).toContain("setStep('demo')");
    expect(ramoDemo).toContain('textContent = mensagem');
    expect(ramoDemo).not.toContain('window.open');
  });

  it('fora do modo demo continua abrindo o WhatsApp e indo para a confirmacao', () => {
    const ramoNormal = envio.slice(envio.indexOf('} else {'));
    expect(ramoNormal).toContain('buildWhatsappUrl(WHATSAPP_NUMBER, mensagem)');
    expect(ramoNormal).toContain("window.open(url, '_blank', 'noopener')");
    expect(ramoNormal).toContain("setStep('confirmed')");
  });
});

describe('package.json', () => {
  it('o build roda o script do painel de demonstracao depois do astro build', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts.build).toBe('astro build && node scripts/demo-admin.mjs');
  });
});
