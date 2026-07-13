import { describe, it, expect } from 'vitest';
import {
  applyCoupon,
  computeDesconto,
  isExpired,
  findCoupon,
  couponErrorMessage,
  type Coupon,
} from '../src/lib/coupon';

// "hoje" fixo para os testes nao dependerem da data real da maquina/CI.
const HOJE = new Date('2026-07-11T12:00:00');

const cupons: Coupon[] = [
  { codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, validade: '2030-12-31' },
  { codigo: 'MENOS5', tipo: 'valor_fixo', valor: 5, validade: '2030-12-31' },
  { codigo: 'EXPIRADO', tipo: 'percentual', valor: 20, validade: '2020-01-01' },
  { codigo: 'METADE', tipo: 'percentual', valor: 50, validade: '2030-12-31' },
];

describe('applyCoupon', () => {
  it('cupom percentual valido aplica o desconto proporcional', () => {
    const r = applyCoupon(cupons, 'BEMVINDO10', 50, HOJE);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.desconto).toBe(5); // 10% de 50
      expect(r.total).toBe(45);
      expect(r.coupon.codigo).toBe('BEMVINDO10');
    }
  });

  it('cupom de valor fixo valido subtrai o valor em reais', () => {
    const r = applyCoupon(cupons, 'MENOS5', 30, HOJE);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.desconto).toBe(5);
      expect(r.total).toBe(25);
    }
  });

  it('cupom expirado e recusado com motivo "expirado"', () => {
    const r = applyCoupon(cupons, 'EXPIRADO', 50, HOJE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('expirado');
  });

  it('cupom inexistente e recusado com motivo "inexistente"', () => {
    const r = applyCoupon(cupons, 'NAOEXISTE', 50, HOJE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('inexistente');
  });

  it('codigo vazio e recusado com motivo "vazio" (nao trava o pedido)', () => {
    const r = applyCoupon(cupons, '   ', 50, HOJE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('vazio');
  });

  it('e case-insensitive e ignora espacos ao redor do codigo', () => {
    const r = applyCoupon(cupons, '  bemvindo10  ', 50, HOJE);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.coupon.codigo).toBe('BEMVINDO10');
  });

  it('desconto nunca deixa o total negativo (limita ao subtotal)', () => {
    // valor fixo de R$ 5 sobre subtotal de R$ 3 => desconto no maximo R$ 3
    const r = applyCoupon(cupons, 'MENOS5', 3, HOJE);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.desconto).toBe(3);
      expect(r.total).toBe(0);
    }
  });

  it('cupom ja usado neste navegador e recusado com motivo "ja_usado"', () => {
    const r = applyCoupon(cupons, 'BEMVINDO10', 50, HOJE, ['BEMVINDO10']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('ja_usado');
  });

  it('"ja usado" ignora caixa/espacos na lista de usados', () => {
    const r = applyCoupon(cupons, 'BEMVINDO10', 50, HOJE, ['  bemvindo10 ']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe('ja_usado');
  });

  it('cupom NAO usado passa normalmente mesmo com outros usados na lista', () => {
    const r = applyCoupon(cupons, 'MENOS5', 30, HOJE, ['BEMVINDO10']);
    expect(r.ok).toBe(true);
  });
});

describe('computeDesconto', () => {
  it('percentual arredonda para 2 casas', () => {
    const cupom: Coupon = { codigo: 'X', tipo: 'percentual', valor: 10, validade: '2030-12-31' };
    // 10% de 41,50 = 4,15
    expect(computeDesconto(cupom, 41.5)).toBe(4.15);
  });

  it('valor fixo nunca ultrapassa o subtotal', () => {
    const cupom: Coupon = { codigo: 'X', tipo: 'valor_fixo', valor: 100, validade: '2030-12-31' };
    expect(computeDesconto(cupom, 20)).toBe(20);
  });
});

describe('isExpired', () => {
  it('valido no ultimo dia da validade (dia inteiro conta)', () => {
    const cupom: Coupon = { codigo: 'X', tipo: 'percentual', valor: 10, validade: '2026-07-11' };
    // as 12h do dia da validade ainda vale
    expect(isExpired(cupom, HOJE)).toBe(false);
  });

  it('expirado no dia seguinte a validade', () => {
    const cupom: Coupon = { codigo: 'X', tipo: 'percentual', valor: 10, validade: '2026-07-10' };
    expect(isExpired(cupom, HOJE)).toBe(true);
  });

  it('sem validade definida nao expira', () => {
    const cupom: Coupon = { codigo: 'X', tipo: 'percentual', valor: 10, validade: '' };
    expect(isExpired(cupom, HOJE)).toBe(false);
  });

  it('com HORA exata: valido antes da hora, expirado depois', () => {
    // HOJE = 12:00 do dia 2026-07-11
    const antes: Coupon = { codigo: 'X', tipo: 'percentual', valor: 10, validade: '2026-07-11', hora: '14:00' };
    expect(isExpired(antes, HOJE)).toBe(false); // 12:00 < 14:00
    const depois: Coupon = { codigo: 'X', tipo: 'percentual', valor: 10, validade: '2026-07-11', hora: '10:30' };
    expect(isExpired(depois, HOJE)).toBe(true); // 12:00 > 10:30
  });

  it('hora em formato invalido/ausente cai no fim do dia (nao trava)', () => {
    const cupom: Coupon = { codigo: 'X', tipo: 'percentual', valor: 10, validade: '2026-07-11', hora: 'abc' };
    expect(isExpired(cupom, HOJE)).toBe(false); // 12:00 ainda dentro do dia
  });
});

describe('findCoupon', () => {
  it('encontra ignorando caixa e espacos', () => {
    expect(findCoupon(cupons, ' metade ')?.codigo).toBe('METADE');
  });
  it('retorna undefined quando nao existe', () => {
    expect(findCoupon(cupons, 'ZZZ')).toBeUndefined();
  });
});

describe('couponErrorMessage', () => {
  it('mensagens amigaveis por motivo', () => {
    expect(couponErrorMessage('vazio')).toMatch(/[Dd]igite/);
    expect(couponErrorMessage('expirado')).toMatch(/expirado/i);
    expect(couponErrorMessage('ja_usado')).toMatch(/já usou/i);
    expect(couponErrorMessage('inexistente')).toMatch(/inválido|não encontrado/i);
  });
});
