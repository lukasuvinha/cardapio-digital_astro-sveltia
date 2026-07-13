import { describe, it, expect } from 'vitest';
import { formatPrice } from '../src/lib/format';

describe('formatPrice', () => {
  it('formata inteiros no padrao brasileiro', () => {
    expect(formatPrice(14)).toBe('R$ 14,00');
  });

  it('usa virgula como separador decimal', () => {
    expect(formatPrice(4.5)).toBe('R$ 4,50');
  });

  it('formata zero', () => {
    expect(formatPrice(0)).toBe('R$ 0,00');
  });
});
