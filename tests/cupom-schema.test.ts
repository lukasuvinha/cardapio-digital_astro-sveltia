import { describe, it, expect } from 'vitest';
import { cupomBaseSchema } from '../src/content/cupom-schema';

describe('cupomBaseSchema', () => {
  it('aceita validade como string YYYY-MM-DD', () => {
    const r = cupomBaseSchema.parse({
      codigo: 'BEMVINDO10',
      tipo: 'percentual',
      valor: 10,
      validade: '2030-12-31',
    });
    expect(r.validade).toBe('2030-12-31');
  });

  it('normaliza validade quando o YAML a entrega como Date', () => {
    // o widget do CMS pode gravar a data sem aspas; o YAML a interpreta como
    // Date. O schema deve devolver sempre a string YYYY-MM-DD.
    const r = cupomBaseSchema.parse({
      codigo: 'BEMVINDO10',
      tipo: 'percentual',
      valor: 10,
      validade: new Date('2030-12-31T00:00:00Z'),
    });
    expect(r.validade).toBe('2030-12-31');
  });

  it('normaliza validade quando vem como string ISO com horario/fuso', () => {
    // o widget datetime (type: date) pode, dependendo da versao, gravar um ISO
    // completo. O schema deve reduzir para os 10 primeiros caracteres.
    const r = cupomBaseSchema.parse({
      codigo: 'BEMVINDO10',
      tipo: 'percentual',
      valor: 10,
      validade: '2030-12-31T00:00:00.000Z',
    });
    expect(r.validade).toBe('2030-12-31');
  });

  it('rejeita tipo de desconto invalido', () => {
    expect(() =>
      cupomBaseSchema.parse({
        codigo: 'X',
        tipo: 'brinde',
        valor: 10,
        validade: '2030-12-31',
      }),
    ).toThrow();
  });

  it('hora e opcional (undefined quando ausente ou vazia)', () => {
    const semHora = cupomBaseSchema.parse({
      codigo: 'X', tipo: 'percentual', valor: 10, validade: '2030-12-31',
    });
    expect(semHora.hora).toBeUndefined();
    const horaVazia = cupomBaseSchema.parse({
      codigo: 'X', tipo: 'percentual', valor: 10, validade: '2030-12-31', hora: '',
    });
    expect(horaVazia.hora).toBeUndefined();
  });

  it('normaliza hora para HH:mm (aceita H:mm e ISO com horario)', () => {
    const r1 = cupomBaseSchema.parse({
      codigo: 'X', tipo: 'percentual', valor: 10, validade: '2030-12-31', hora: '9:05',
    });
    expect(r1.hora).toBe('09:05');
    const r2 = cupomBaseSchema.parse({
      codigo: 'X', tipo: 'percentual', valor: 10, validade: '2030-12-31', hora: '14:30',
    });
    expect(r2.hora).toBe('14:30');
  });
});
