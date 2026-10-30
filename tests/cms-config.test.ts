// Guarda de regressao do painel do CMS (public/admin/config.yml).
//
// Dois incidentes DERRUBARAM o painel em producao por causa deste arquivo:
//   - YAML invalido (lista em bloco dentro de mapping em fluxo);
//   - widget "date" depreciado no campo de validade do cupom.
// Este teste faz o parse do config.yml e valida a estrutura, pegando essa
// classe de erro em `npm test` (antes do deploy), e nao mais so no navegador.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';

const configPath = join(process.cwd(), 'public/admin/config.yml');
const raw = readFileSync(configPath, 'utf8');

// O parse em si ja falha se o YAML for invalido (incidente 1).
const config = load(raw) as any;

const bySame = (arr: any[], name: string) => arr.find((c) => c.name === name);
const fieldsOf = (col: any) => (col?.fields ?? []) as any[];

describe('public/admin/config.yml — parse e estrutura', () => {
  it('faz parse sem erro de YAML', () => {
    expect(config).toBeTruthy();
    expect(Array.isArray(config.collections)).toBe(true);
  });

  it('tem as collections produtos, categorias e cupons', () => {
    const nomes = config.collections.map((c: any) => c.name);
    expect(nomes).toContain('produtos');
    expect(nomes).toContain('categorias');
    expect(nomes).toContain('cupons');
  });

  it('NENHUM campo usa o widget "date" depreciado (quebra o Sveltia)', () => {
    const widgetsDeCampos: string[] = [];
    for (const col of config.collections) {
      for (const f of fieldsOf(col)) if (f && f.widget) widgetsDeCampos.push(f.widget);
      // collections do tipo "files" (ex.: "configuracoes") tem os campos
      // dentro de cada arquivo, nao direto na collection.
      for (const file of col.files ?? []) {
        for (const f of file.fields ?? []) if (f && f.widget) widgetsDeCampos.push(f.widget);
      }
    }
    expect(widgetsDeCampos).not.toContain('date');
  });

  it('validade do cupom usa datetime + type: date (forma suportada)', () => {
    const validade = fieldsOf(bySame(config.collections, 'cupons')).find(
      (f) => f.name === 'validade',
    );
    expect(validade).toBeTruthy();
    expect(validade.widget).toBe('datetime');
    expect(validade.type).toBe('date');
  });

  it('tipo do cupom oferece percentual e valor_fixo', () => {
    const tipo = fieldsOf(bySame(config.collections, 'cupons')).find((f) => f.name === 'tipo');
    const values = (tipo.options ?? []).map((o: any) => (typeof o === 'string' ? o : o.value));
    expect(values).toContain('percentual');
    expect(values).toContain('valor_fixo');
  });

  it('categoria do produto e um relation para a collection categorias', () => {
    const categoria = fieldsOf(bySame(config.collections, 'produtos')).find(
      (f) => f.name === 'categoria',
    );
    expect(categoria.widget).toBe('relation');
    expect(categoria.collection).toBe('categorias');
  });

  it('produto tem o campo "escondido" (Esconder do Cardápio; boolean, padrao false)', () => {
    const escondido = fieldsOf(bySame(config.collections, 'produtos')).find(
      (f) => f.name === 'escondido',
    );
    expect(escondido).toBeTruthy();
    expect(escondido.widget).toBe('boolean');
    expect(escondido.default).toBe(false);
  });

  it('hora de expiracao do cupom e um campo de texto opcional (a prova de falhas)', () => {
    const hora = fieldsOf(bySame(config.collections, 'cupons')).find((f) => f.name === 'hora');
    expect(hora).toBeTruthy();
    expect(hora.widget).toBe('string'); // string = widget mais seguro do CMS
    expect(hora.required).toBe(false);
  });

  it('pattern da hora aceita string vazia (bug do Decap/Sveltia: campo opcional vazio nao pode ser recusado pelo pattern)', () => {
    // Incidente real em producao: com required:false mas sem "^$|" no pattern,
    // o painel recusava salvar o cupom com "Use o formato HH:MM..." mesmo com
    // o campo vazio. Ver docs/BUGS-E-CORRECOES.md, item 8.
    const hora = fieldsOf(bySame(config.collections, 'cupons')).find((f) => f.name === 'hora');
    const [regexStr] = hora.pattern as [string, string];
    const re = new RegExp(regexStr);
    expect(re.test('')).toBe(true);
    // continua validando o formato quando preenchido
    expect(re.test('14:30')).toBe(true);
    expect(re.test('23:59')).toBe(true);
    expect(re.test('14h30')).toBe(false);
    expect(re.test('24:00')).toBe(false);
  });

  it('collection "configuracoes" tem o arquivo "entrega", mas "whatsapp" continua DESATIVADO', () => {
    // O arquivo "whatsapp" (edicao do texto do WhatsApp pela Nina) foi
    // desativado a pedido do cliente — o texto so muda no codigo
    // (src/lib/whatsapp.ts). Este teste falha se alguem reativar esse
    // arquivo no config.yml sem querer.
    const cfg = bySame(config.collections, 'configuracoes');
    expect(cfg).toBeTruthy();
    const nomes = (cfg.files ?? []).map((f: any) => f.name);
    expect(nomes).toContain('entrega');
    expect(nomes).not.toContain('whatsapp');
  });

  it('arquivo "entrega" tem entrega_habilitada, retirada_habilitada e taxa_entrega', () => {
    const cfg = bySame(config.collections, 'configuracoes');
    const entregaFile = (cfg.files ?? []).find((f: any) => f.name === 'entrega');
    const fields = (entregaFile?.fields ?? []) as any[];

    const entregaHab = fields.find((f) => f.name === 'entrega_habilitada');
    expect(entregaHab?.widget).toBe('boolean');
    expect(entregaHab?.default).toBe(true);

    const retiradaHab = fields.find((f) => f.name === 'retirada_habilitada');
    expect(retiradaHab?.widget).toBe('boolean');
    expect(retiradaHab?.default).toBe(true);

    const taxa = fields.find((f) => f.name === 'taxa_entrega');
    expect(taxa?.widget).toBe('number');
    expect(taxa?.min).toBe(0);

    const taxaCombinar = fields.find((f) => f.name === 'taxa_a_combinar');
    expect(taxaCombinar?.widget).toBe('boolean');
    expect(taxaCombinar?.default).toBe(false);
  });

  it('o "accept" da foto e uma STRING separada por virgulas, nao uma lista', () => {
    // Incidente real em producao: com accept como LISTA, o painel parou de
    // abrir com "coleção Produto, campo foto: The `accept` option must be a
    // string". O Sveltia espera o mesmo formato do atributo accept do
    // <input type="file"> do HTML. Ver docs/BUGS-E-CORRECOES.md, item 9.
    const foto = fieldsOf(bySame(config.collections, 'produtos')).find((f) => f.name === 'foto');
    expect(foto).toBeTruthy();
    expect(typeof foto.accept).toBe('string');
    expect(Array.isArray(foto.accept)).toBe(false);
    // continua restringindo os mesmos formatos de antes (bloqueia HEIC etc.)
    expect(foto.accept).toContain('image/jpeg');
    expect(foto.accept).toContain('image/png');
    expect(foto.accept).toContain('image/webp');
  });

  it('collection "configuracoes" tambem tem o arquivo "fornada"', () => {
    const cfg = bySame(config.collections, 'configuracoes');
    const nomes = (cfg.files ?? []).map((f: any) => f.name);
    expect(nomes).toContain('fornada');
  });

  it('arquivo "fornada" tem banner_habilitado, modo (select) e hora com pattern seguro', () => {
    const cfg = bySame(config.collections, 'configuracoes');
    const fornadaFile = (cfg.files ?? []).find((f: any) => f.name === 'fornada');
    const fields = (fornadaFile?.fields ?? []) as any[];

    const habilitado = fields.find((f) => f.name === 'banner_habilitado');
    expect(habilitado?.widget).toBe('boolean');
    expect(habilitado?.default).toBe(false);

    const modo = fields.find((f) => f.name === 'modo');
    expect(modo?.widget).toBe('select');
    const modoValues = (modo?.options ?? []).map((o: any) => (typeof o === 'string' ? o : o.value));
    expect(modoValues).toContain('data');
    expect(modoValues).toContain('em_breve');

    // data: mesma forma segura do cupom (datetime + type:date, nao "date" depreciado)
    const data = fields.find((f) => f.name === 'data');
    expect(data?.widget).toBe('datetime');
    expect(data?.type).toBe('date');
    expect(data?.required).toBe(false);

    // hora: mesmo campo de texto a prova de falhas do cupom, com o pattern
    // aceitando string vazia (mesmo bug do item 8 do BUGS-E-CORRECOES)
    const hora = fields.find((f) => f.name === 'hora');
    expect(hora?.widget).toBe('string');
    expect(hora?.required).toBe(false);
    const [regexStr] = hora.pattern as [string, string];
    expect(new RegExp(regexStr).test('')).toBe(true);
  });

  it('o arquivo de configuracao do WhatsApp (nao usado no CMS) continua existindo', () => {
    // mantido no repo para o caso de a secao ser reativada no futuro.
    expect(existsSync(join(process.cwd(), 'src/content/configuracoes/whatsapp.json'))).toBe(true);
  });
});
