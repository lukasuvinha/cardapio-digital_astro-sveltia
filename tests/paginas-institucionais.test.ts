// Testes das paginas institucionais (Sobre, Contato), do rodape e do credito
// do desenvolvedor (que substituiu a pagina /desenvolvedor). Usam a Container
// API do Astro (render em memoria). No Vitest as content collections chegam
// vazias, entao as paginas renderizam SEM o conteudo do CMS — o que tambem
// testa a regra "campo vazio nao aparece". O conteudo de exemplo e validado
// lendo os JSON direto.
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Footer from '../src/components/Footer.astro';
import ContactButton from '../src/components/ContactButton.astro';
import Sobre from '../src/pages/sobre.astro';
import Contato from '../src/pages/contato.astro';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  WHATSAPP_NUMBER,
  INSTAGRAM_URL,
  DEV_NAME,
  DEV_URL,
  DEV_CREDIT_ENABLED,
  ORDER_HOURS,
  SITE_NAME,
} from '../src/config/site';
import {
  sobrePaginaSchema,
  contatoPaginaSchema,
  paragrafos,
  itensComoEncomendar,
} from '../src/content/paginas-schema';

const json = (p: string) => JSON.parse(readFileSync(join(process.cwd(), p), 'utf8'));

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

describe('Footer — contato, horario e credito', () => {
  it('icones de WhatsApp e Instagram com os links de site.ts e aria-label', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {});
    expect(html).toMatch(new RegExp(`<a[^>]*href="https://wa.me/${WHATSAPP_NUMBER}"[^>]*aria-label="WhatsApp da ${SITE_NAME}"`));
    expect(html).toMatch(new RegExp(`<a[^>]*href="${INSTAGRAM_URL}"[^>]*aria-label="Instagram da ${SITE_NAME}"`));
  });

  it('mostra o horario de pedidos configurado', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {});
    if (ORDER_HOURS.trim()) expect(html).toContain(ORDER_HOURS.trim());
    else expect(html).not.toContain('cd-footer__hours');
  });

  it('credito "Site feito por {DEV_NAME}" com link para DEV_URL, nofollow e nova aba', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {});
    if (!DEV_CREDIT_ENABLED) {
      expect(html).not.toContain('Site feito por');
      return;
    }
    expect(html).toMatch(new RegExp(`<a[^>]*href="${DEV_URL}"[^>]*target="_blank"[^>]*rel="nofollow noopener"[^>]*>\\s*Site feito por ${DEV_NAME}\\s*</a>`));
  });

  it('o credito usa texto pequeno e cor de baixo contraste (tokens)', () => {
    const css = readFileSync(join(process.cwd(), 'src/components/Footer.astro'), 'utf8');
    expect(css).toMatch(/\.cd-footer__credit\s*{[^}]*font-size:\s*var\(--fs-label\)/);
    expect(css).toMatch(/\.cd-footer__credit a\s*{[^}]*color:\s*var\(--on-sf-v\)/);
  });
});

describe('Pagina /desenvolvedor desativada', () => {
  it('o arquivo foi renomeado com "_" (o Astro nao gera a rota) e o codigo continua no repo', () => {
    expect(existsSync(join(process.cwd(), 'src/pages/desenvolvedor.astro'))).toBe(false);
    const src = readFileSync(join(process.cwd(), 'src/pages/_desenvolvedor.astro'), 'utf8');
    expect(src).toContain('PAGINA DESATIVADA');
    expect(src).toContain('COMO REATIVAR');
  });

  it('Contato nao tem mais link ativo para /desenvolvedor', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contato, {});
    expect(html).not.toContain('href="/desenvolvedor"');
  });
});

describe('Página Sobre', () => {
  it('renderiza o titulo e o botao para o cardapio; sem conteudo do CMS, nao mostra cartao vazio', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Sobre, {});
    expect(html).toContain(`Sobre a ${SITE_NAME}`);
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Ver Cardápio<\/a>/);
    expect(html).not.toContain('cd-sobre__card');
  });

  it('o sobre.json de exemplo tem foto, texto pessoal e chamada', () => {
    const sobre = sobrePaginaSchema.parse(json('src/content/configuracoes/sobre.json'));
    expect(sobre.foto).toBeTruthy();
    expect(existsSync(join(process.cwd(), 'public', sobre.foto!))).toBe(true);
    expect(paragrafos(sobre.texto).length).toBeGreaterThanOrEqual(2);
    expect(sobre.chamada).toBeTruthy();
  });

  it('paragrafos: separa por linha em branco e ignora vazios', () => {
    expect(paragrafos('Um\nainda um\n\nDois\n\n\n')).toEqual(['Um ainda um', 'Dois']);
    expect(paragrafos(undefined)).toEqual([]);
  });

  it('campos vazios do CMS viram undefined (somem da pagina)', () => {
    expect(sobrePaginaSchema.parse({ foto: '', texto: '  ', chamada: '' })).toEqual({ foto: undefined, texto: undefined, chamada: undefined });
  });
});

describe('Página Contato', () => {
  it('botão principal do WhatsApp (cor --ok) usa o número configurado', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contato, {});
    expect(html).toMatch(new RegExp(`<a[^>]*class="cd-btn cd-btn--ok[^"]*"[^>]*href="https://wa.me/${WHATSAPP_NUMBER}"`));
    expect(html).toContain('WhatsApp');
  });

  it('botão do Instagram usa o link configurado', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contato, {});
    expect(html).toContain(INSTAGRAM_URL);
    expect(html).toContain('Instagram');
  });

  it('sem conteudo do CMS, a secao "Como encomendar" nao aparece', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Contato, {});
    expect(html).not.toContain('Como encomendar');
  });

  it('o contato.json de exemplo preenche os quatro itens de "Como encomendar", na ordem', () => {
    const itens = itensComoEncomendar(contatoPaginaSchema.parse(json('src/content/configuracoes/contato.json')));
    expect(itens.map((i) => i.titulo)).toEqual(['Antecedência', 'Região de entrega', 'Retirada', 'Formas de pagamento']);
  });

  it('itens vazios somem individualmente', () => {
    const itens = itensComoEncomendar(contatoPaginaSchema.parse({ antecedencia: '2 dias', regiao_entrega: '', pagamento: 'Pix' }));
    expect(itens.map((i) => i.chave)).toEqual(['antecedencia', 'pagamento']);
    expect(itensComoEncomendar(undefined)).toEqual([]);
  });
});
