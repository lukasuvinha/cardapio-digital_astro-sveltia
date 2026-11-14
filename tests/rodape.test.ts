// Rodape editavel no CMS (Configuracoes -> Rodape): horario de pedidos com
// chave liga/desliga e redes sociais que so aparecem ligadas e com link.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import {
  rodapeConfigSchema,
  redesVisiveis,
  horarioVisivel,
  linkValido,
  REDES_SOCIAIS,
  NOME_DA_REDE,
} from '../src/content/rodape-schema';

const exemplo = rodapeConfigSchema.parse(
  JSON.parse(readFileSync(join(process.cwd(), 'src/content/configuracoes/rodape.json'), 'utf8')),
);

describe('horario de pedidos', () => {
  it('aparece quando ligado e preenchido', () => {
    expect(horarioVisivel({ horario_habilitado: true, horario: ' Pedidos de terça a sábado ' })).toBe('Pedidos de terça a sábado');
  });

  it('some quando desligado, mesmo com texto salvo', () => {
    expect(horarioVisivel({ horario_habilitado: false, horario: 'Pedidos de terça a sábado' })).toBe('');
  });

  it('some quando vazio ou sem configuracao', () => {
    expect(horarioVisivel({ horario_habilitado: true, horario: '   ' })).toBe('');
    expect(horarioVisivel(undefined)).toBe('');
  });

  it('sem o campo da chave, conta como ligado', () => {
    expect(horarioVisivel(rodapeConfigSchema.parse({ horario: 'Todos os dias' }))).toBe('Todos os dias');
  });
});

describe('redes sociais', () => {
  it('so entram as redes ligadas e com link valido, na ordem cadastrada', () => {
    const redes = redesVisiveis({
      redes: [
        { rede: 'tiktok', url: 'https://www.tiktok.com/@loja', ativo: true },
        { rede: 'instagram', url: '', ativo: true }, // sem link: fica de fora
        { rede: 'facebook', url: 'https://www.facebook.com/loja', ativo: false }, // desligada
        { rede: 'pinterest', url: 'pinterest.com/loja', ativo: true }, // link sem https://
        { rede: 'x', url: 'https://x.com/loja', ativo: true },
      ],
    });
    expect(redes).toEqual([
      { rede: 'tiktok', nome: 'TikTok', url: 'https://www.tiktok.com/@loja' },
      { rede: 'x', nome: 'X', url: 'https://x.com/loja' },
    ]);
  });

  it('rede desconhecida ou repetida e ignorada (vale a primeira)', () => {
    const redes = redesVisiveis({
      redes: [
        { rede: 'orkut', url: 'https://orkut.com/loja', ativo: true },
        { rede: 'instagram', url: 'https://instagram.com/a', ativo: true },
        { rede: 'instagram', url: 'https://instagram.com/b', ativo: true },
      ],
    });
    expect(redes.map((r) => r.url)).toEqual(['https://instagram.com/a']);
  });

  it('sem o campo "ativo", a rede conta como ligada', () => {
    const cfg = rodapeConfigSchema.parse({ redes: [{ rede: 'youtube', url: 'https://youtube.com/@loja' }] });
    expect(redesVisiveis(cfg).map((r) => r.rede)).toEqual(['youtube']);
  });

  it('linkValido exige http(s) e dominio', () => {
    expect(linkValido('https://www.instagram.com/loja')).toBe(true);
    expect(linkValido('instagram.com/loja')).toBe(false);
    expect(linkValido('javascript:alert(1)')).toBe(false);
    expect(linkValido('https://semponto')).toBe(false);
    expect(linkValido(undefined)).toBe(false);
  });

  it('toda rede tem nome para exibir', () => {
    for (const r of REDES_SOCIAIS) expect(NOME_DA_REDE[r]).toBeTruthy();
  });

  it('cada rede da lista tem um icone de traco em SocialIcon.astro', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/SocialIcon.astro'), 'utf8');
    for (const r of REDES_SOCIAIS) expect(src).toContain(`icon === '${r}'`);
  });
});

describe('rodape.json de exemplo', () => {
  it('liga o horario e cadastra redes de exemplo, todas com link', () => {
    expect(horarioVisivel(exemplo)).toBeTruthy();
    const redes = redesVisiveis(exemplo);
    expect(redes.length).toBeGreaterThan(0);
    expect(redes.length).toBe(exemplo.redes.length);
  });
});

describe('CMS (public/admin/config.yml) — Configuracoes -> Rodape', () => {
  const config = load(readFileSync(join(process.cwd(), 'public/admin/config.yml'), 'utf8')) as any;
  const rodape = config.collections.find((c: any) => c.name === 'configuracoes').files.find((f: any) => f.name === 'rodape');
  const campo = (n: string) => rodape.fields.find((f: any) => f.name === n);

  it('tem a chave do horario e o texto do horario', () => {
    expect(campo('horario_habilitado').widget).toBe('boolean');
    expect(campo('horario').widget).toBe('string');
    expect(campo('horario').required).toBe(false);
  });

  it('redes: lista com rede (select das redes suportadas), link e "mostrar no site"', () => {
    const redes = campo('redes');
    expect(redes.widget).toBe('list');
    const sub = (n: string) => redes.fields.find((f: any) => f.name === n);
    expect(sub('rede').widget).toBe('select');
    expect(sub('rede').options.map((o: any) => o.value)).toEqual([...REDES_SOCIAIS]);
    expect(sub('ativo').widget).toBe('boolean');
  });

  it('o link e OBRIGATORIO e o pattern so aceita link completo com https://', () => {
    const url = campo('redes').fields.find((f: any) => f.name === 'url');
    expect(url.required).not.toBe(false); // obrigatorio (padrao do Sveltia)
    const re = new RegExp(url.pattern[0]);
    expect(re.test('https://www.instagram.com/minhaloja')).toBe(true);
    expect(re.test('http://tiktok.com/@minhaloja')).toBe(true);
    expect(re.test('instagram.com/minhaloja')).toBe(false);
    expect(re.test('')).toBe(false);
  });
});
