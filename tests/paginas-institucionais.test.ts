// Testes das paginas institucionais (Sobre, Contato, Desenvolvedor) e do
// rodape que leva ate elas. Usam a Container API do Astro (render em
// memoria, sem navegador) — nenhuma dessas paginas depende de Content
// Collections, entao renderizam limpo.
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Footer from '../src/components/Footer.astro';
import ContactButton from '../src/components/ContactButton.astro';
import Sobre from '../src/pages/sobre.astro';
import Contato from '../src/pages/contato.astro';
import Desenvolvedor from '../src/pages/desenvolvedor.astro';
import { WHATSAPP_NUMBER, INSTAGRAM_URL, DEV_NAME, DEV_GITHUB_URL, DEV_LINKEDIN_URL } from '../src/config/site';

describe('Footer — links institucionais', () => {
  it('tem links para /sobre e /contato', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {});
    expect(html).toMatch(/<a[^>]*href="\/sobre"[^>]*>Sobre<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/contato"[^>]*>Contato<\/a>/);
  });
});

describe('ContactButton', () => {
  it('renderiza o href, o rotulo e abre em nova aba quando external', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ContactButton, {
      props: { href: 'https://exemplo.com', label: 'Exemplo', icon: 'github', external: true },
    });
    expect(html).toContain('href="https://exemplo.com"');
    expect(html).toContain('Exemplo');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('sem external, nao abre em nova aba', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ContactButton, {
      props: { href: '/contato', label: 'Contato', icon: 'whatsapp' },
    });
    expect(html).not.toContain('target="_blank"');
  });
});

describe('Página Sobre', () => {
  it('renderiza um título e texto (placeholder editável depois)', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Sobre, {});
    expect(html).toContain('Sobre a Doçuras da Nina');
    expect(html).toContain('Doçuras da Nina nasceu');
    // link de volta ao cardapio
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Ver Cardápio<\/a>/);
  });
});

describe('Página Contato', () => {
  it('botão do WhatsApp usa o número configurado', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contato, {});
    expect(html).toContain(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(html).toContain('WhatsApp');
  });

  it('botão do Instagram usa o link configurado', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contato, {});
    expect(html).toContain(INSTAGRAM_URL);
    expect(html).toContain('Instagram');
  });

  it('tem um link discreto para /desenvolvedor', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contato, {});
    expect(html).toMatch(/<a[^>]*href="\/desenvolvedor"[^>]*>Desenvolvedor<\/a>/);
  });
});

describe('Página Desenvolvedor', () => {
  it('mostra o nome do desenvolvedor e os links de GitHub/LinkedIn configurados', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Desenvolvedor, {});
    expect(html).toContain(DEV_NAME);
    expect(html).toContain(DEV_GITHUB_URL);
    expect(html).toContain(DEV_LINKEDIN_URL);
    expect(html).toContain('GitHub');
    expect(html).toContain('LinkedIn');
  });
});
