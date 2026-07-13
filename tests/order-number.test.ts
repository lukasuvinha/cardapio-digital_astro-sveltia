import { describe, it, expect } from 'vitest';
import { formatOrderNumber } from '../src/lib/order-number';

describe('formatOrderNumber', () => {
  it('formata sequencial com 4 digitos: DN0001, DN0002...', () => {
    expect(formatOrderNumber(1)).toBe('DN0001');
    expect(formatOrderNumber(2)).toBe('DN0002');
    expect(formatOrderNumber(42)).toBe('DN0042');
    expect(formatOrderNumber(1234)).toBe('DN1234');
  });

  it('acima de 9999 nao trava (usa os digitos que precisar)', () => {
    expect(formatOrderNumber(12345)).toBe('DN12345');
  });

  it('numeros invalidos/negativos viram DN0000', () => {
    expect(formatOrderNumber(0)).toBe('DN0000');
    expect(formatOrderNumber(-5)).toBe('DN0000');
    expect(formatOrderNumber(3.9)).toBe('DN0003'); // trunca
  });
});
