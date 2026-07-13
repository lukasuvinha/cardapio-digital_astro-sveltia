import { describe, it, expect } from 'vitest';
import { normalizeCheckoutConfig } from '../src/lib/checkout-config';

describe('normalizeCheckoutConfig', () => {
  it('sem config (undefined): entrega e retirada habilitadas, taxa 0, sem "a combinar"', () => {
    const cfg = normalizeCheckoutConfig(undefined);
    expect(cfg).toEqual({
      entregaHabilitada: true,
      retiradaHabilitada: true,
      taxaEntrega: 0,
      taxaACombinar: false,
    });
  });

  it('so entrega desligada: mantem retirada ligada', () => {
    const cfg = normalizeCheckoutConfig({ entrega_habilitada: false, retirada_habilitada: true });
    expect(cfg.entregaHabilitada).toBe(false);
    expect(cfg.retiradaHabilitada).toBe(true);
  });

  it('so retirada desligada: mantem entrega ligada', () => {
    const cfg = normalizeCheckoutConfig({ entrega_habilitada: true, retirada_habilitada: false });
    expect(cfg.entregaHabilitada).toBe(true);
    expect(cfg.retiradaHabilitada).toBe(false);
  });

  it('as duas desligadas ao mesmo tempo: reativa a retirada automaticamente', () => {
    const cfg = normalizeCheckoutConfig({ entrega_habilitada: false, retirada_habilitada: false });
    expect(cfg.entregaHabilitada).toBe(false);
    expect(cfg.retiradaHabilitada).toBe(true);
  });

  it('repassa a taxa de entrega configurada', () => {
    const cfg = normalizeCheckoutConfig({ taxa_entrega: 7.5 });
    expect(cfg.taxaEntrega).toBe(7.5);
  });

  it('sem taxa configurada, usa 0 (entrega gratis)', () => {
    const cfg = normalizeCheckoutConfig({ entrega_habilitada: true, retirada_habilitada: true });
    expect(cfg.taxaEntrega).toBe(0);
  });

  it('sem "a combinar" configurado, usa false por padrao', () => {
    const cfg = normalizeCheckoutConfig({ taxa_entrega: 5 });
    expect(cfg.taxaACombinar).toBe(false);
  });

  it('"a combinar" ligado: repassa true independente do valor da taxa', () => {
    const cfg = normalizeCheckoutConfig({ taxa_entrega: 6, taxa_a_combinar: true });
    expect(cfg.taxaACombinar).toBe(true);
    // o valor numerico continua disponivel na config (quem decide ignora-lo
    // e o consumidor — CartDrawer/whatsapp.ts), a normalizacao so repassa.
    expect(cfg.taxaEntrega).toBe(6);
  });
});
