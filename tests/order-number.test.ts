import { describe, it, expect } from 'vitest';
import { formatOrderNumber } from '../src/lib/order-number';
import { ORDER_PREFIX } from '../src/config/site';

// O prefixo vem de src/config/site.ts (ORDER_PREFIX), entao os testes nao
// dependem da loja configurada.
const P = ORDER_PREFIX;

describe('formatOrderNumber', () => {
  it('formata sequencial com 4 digitos: <prefixo>0001, <prefixo>0002...', () => {
    expect(formatOrderNumber(1)).toBe(`${P}0001`);
    expect(formatOrderNumber(2)).toBe(`${P}0002`);
    expect(formatOrderNumber(42)).toBe(`${P}0042`);
    expect(formatOrderNumber(1234)).toBe(`${P}1234`);
  });

  it('acima de 9999 nao trava (usa os digitos que precisar)', () => {
    expect(formatOrderNumber(12345)).toBe(`${P}12345`);
  });

  it('numeros invalidos/negativos viram <prefixo>0000', () => {
    expect(formatOrderNumber(0)).toBe(`${P}0000`);
    expect(formatOrderNumber(-5)).toBe(`${P}0000`);
    expect(formatOrderNumber(3.9)).toBe(`${P}0003`); // trunca
  });
});
