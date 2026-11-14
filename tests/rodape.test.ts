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
  textoHorario,
  formatarHora,
  linkValido,
  REDES_SOCIAIS,
  NOME_DA_REDE,
  DIAS_SEMANA,
  HORAS,
} from '../src/content/rodape-schema';

const exemplo = rodapeConfigSchema.parse(
  JSON.parse(readFileSync(join(process.cwd(), 'src/content/configuracoes/rodape.json'), 'utf8')),
);

describe('horario de pedidos (texto fixo, dias e horas escolhidos no menu)', () => {
  const ter_sab = { dia_inicio: 'terca', dia_fim: 'sabado', hora_inicio: '09:00', hora_fim: '18:00' };

  it('monta o texto fixo: "Pedidos de terça a sábado, das 9h às 18h"', () => {
    expect(textoHorario(ter_sab)).toBe('Pedidos de terça a sábado, das 9h às 18h');
  });

  it('meia hora aparece como "9h30"', () => {
    expect(textoHorario({ ...ter_sab, hora_inicio: '09:30', hora_fim: '17:30' })).toBe('Pedidos de terça a sábado, das 9h30 às 17h30');
  });

  it('mesmo dia no inicio e no fim: "Pedidos às terças" / "aos sábados"', () => {
    expect(textoHorario({ ...ter_sab, dia_fim: 'terca' })).toBe('Pedidos às terças, das 9h às 18h');
    // sabado e domingo sao masculinos: "aos"
    expect(textoHorario({ ...ter_sab, dia_inicio: 'sabado', dia_fim: 'sabado' })).toBe('Pedidos aos sábados, das 9h às 18h');
    expect(textoHorario({ ...ter_sab, dia_inicio: 'domingo', dia_fim: 'domingo' })).toBe('Pedidos aos domingos, das 9h às 18h');
  });

  it('de segunda a domingo: "Pedidos todos os dias"', () => {
    expect(textoHorario({ ...ter_sab, dia_inicio: 'segunda', dia_fim: 'domingo' })).toBe('Pedidos todos os dias, das 9h às 18h');
  });

  it('dia ou hora faltando/invalidos: sem texto (a linha nao aparece)', () => {
    expect(textoHorario({ ...ter_sab, dia_fim: undefined })).toBe('');
    expect(textoHorario({ ...ter_sab, dia_inicio: 'feriado' })).toBe('');
    expect(textoHorario({ ...ter_sab, hora_fim: '25:00' })).toBe('');
    expect(textoHorario({ ...ter_sab, hora_inicio: '9h' })).toBe('');
    expect(textoHorario(undefined)).toBe('');
  });

  it('chave desligada esconde, mesmo com dias e horas salvos', () => {
    expect(horarioVisivel({ horario_habilitado: false, ...ter_sab })).toBe('');
    expect(horarioVisivel({ horario_habilitado: true, ...ter_sab })).toBe('Pedidos de terça a sábado, das 9h às 18h');
  });

  it('sem o campo da chave, conta como ligado', () => {
    expect(horarioVisivel(rodapeConfigSchema.parse(ter_sab))).toBe('Pedidos de terça a sábado, das 9h às 18h');
  });

  it('o campo de texto livre antigo ("horario") nao e mais usado', () => {
    expect(horarioVisivel(rodapeConfigSchema.parse({ horario: 'Qualquer texto' }))).toBe('');
  });

  it('formatarHora', () => {
    expect(formatarHora('00:00')).toBe('0h');
    expect(formatarHora('18:00')).toBe('18h');
    expect(formatarHora('07:30')).toBe('7h30');
    expect(formatarHora('')).toBe('');
  });

  it('o menu de horas vai de 0h a 23h30, de meia em meia hora', () => {
    expect(HORAS.length).toBe(48);
    expect(HORAS[0]).toBe('00:00');
    expect(HORAS[HORAS.length - 1]).toBe('23:30');
    for (const h of HORAS) expect(formatarHora(h)).not.toBe('');
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

  it('horario: chave liga/desliga e quatro menus (dias e horas), sem texto livre', () => {
    expect(campo('horario_habilitado').widget).toBe('boolean');
    expect(campo('horario')).toBeUndefined();
    for (const n of ['dia_inicio', 'dia_fim']) {
      expect(campo(n).widget).toBe('select');
      expect(campo(n).options.map((o: any) => o.value)).toEqual([...DIAS_SEMANA]);
    }
    for (const n of ['hora_inicio', 'hora_fim']) {
      expect(campo(n).widget).toBe('select');
      expect(campo(n).options.map((o: any) => o.value)).toEqual([...HORAS]);
      // rotulos legiveis no menu ("9h", "9h30")
      for (const o of campo(n).options) expect(o.label).toBe(formatarHora(o.value));
    }
    // valores padrao montam um texto valido
    const padrao = { dia_inicio: campo('dia_inicio').default, dia_fim: campo('dia_fim').default, hora_inicio: campo('hora_inicio').default, hora_fim: campo('hora_fim').default };
    expect(textoHorario(padrao)).toBe('Pedidos de terça a sábado, das 9h às 18h');
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
