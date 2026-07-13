import { describe, it, expect } from 'vitest';
import {
  buildOrderMessage,
  buildWhatsappUrl,
  generateOrderId,
  type Order,
} from '../src/lib/whatsapp';
import type { CartLine } from '../src/lib/cart-core';

const lines: CartLine[] = [
  { id: 'p1', nome: 'Brownie Trufado', preco: 14, qty: 2, foto: '/img/products/p1.svg', lineTotal: 28 },
  { id: 'p3', nome: 'Brigadeiro Belga', preco: 4.5, qty: 3, foto: null, lineTotal: 13.5 },
];

const baseOrder: Order = {
  pedido: 'DN1234',
  nome: 'Maria Silva',
  telefone: '(11) 91234-5678',
  fulfillment: 'retirada',
  payment: 'pix',
  lines,
  subtotal: 41.5,
  total: 41.5,
};

describe('buildOrderMessage', () => {
  it('inclui itens com quantidade, preco unitario e subtotal da linha', () => {
    const msg = buildOrderMessage(baseOrder);
    // preco unitario visivel em cada linha (R$ 14,00 e R$ 4,50), alem do subtotal
    expect(msg).toContain('2× Brownie Trufado — R$ 14,00 cada = R$ 28,00');
    expect(msg).toContain('3× Brigadeiro Belga — R$ 4,50 cada = R$ 13,50');
    expect(msg).toContain('*Total: R$ 41,50*');
  });

  it('inclui dados do cliente e forma de pagamento', () => {
    const msg = buildOrderMessage(baseOrder);
    expect(msg).toContain('Nome: Maria Silva');
    expect(msg).toContain('Telefone: (11) 91234-5678');
    expect(msg).toContain('*Pagamento:* Pix');
    expect(msg).toContain('Pedido: DN1234');
  });

  it('na retirada nao mostra endereco', () => {
    const msg = buildOrderMessage(baseOrder);
    expect(msg).toContain('*Entrega:* Retirada');
    expect(msg).not.toContain('Endereço:');
  });

  it('na entrega mostra o endereco', () => {
    const msg = buildOrderMessage({
      ...baseOrder,
      fulfillment: 'entrega',
      endereco: 'Rua das Flores, 100',
    });
    expect(msg).toContain('*Entrega:* Entrega');
    expect(msg).toContain('Endereço: Rua das Flores, 100');
  });

  it('inclui observacoes apenas quando preenchidas', () => {
    expect(buildOrderMessage(baseOrder)).not.toContain('Observações');
    const msg = buildOrderMessage({ ...baseOrder, observacoes: 'Sem nozes' });
    expect(msg).toContain('*Observações:* Sem nozes');
  });

  it('sem cupom, nao mostra linhas de subtotal/desconto', () => {
    const msg = buildOrderMessage(baseOrder);
    expect(msg).not.toContain('Subtotal:');
    expect(msg).not.toContain('Cupom');
  });

  it('com cupom, mostra subtotal, desconto e o TOTAL JA COM DESCONTO', () => {
    // pedido de R$ 41,50 com cupom de 10% (desconto R$ 4,15) => total R$ 37,35
    const msg = buildOrderMessage({
      ...baseOrder,
      subtotal: 41.5,
      cupom: { codigo: 'BEMVINDO10', desconto: 4.15 },
      total: 37.35,
    });
    expect(msg).toContain('Subtotal: R$ 41,50');
    expect(msg).toContain('Cupom BEMVINDO10: -R$ 4,15');
    // o total final da mensagem e o valor COM desconto, nao o subtotal
    expect(msg).toContain('*Total: R$ 37,35*');
    expect(msg).not.toContain('*Total: R$ 41,50*');
  });

  it('sem taxa de entrega, nao mostra a linha (mesmo com fulfillment entrega)', () => {
    const msg = buildOrderMessage({ ...baseOrder, fulfillment: 'entrega', endereco: 'Rua X, 1' });
    expect(msg).not.toContain('Taxa de entrega');
    expect(msg).not.toContain('Subtotal:');
  });

  it('com taxa de entrega, mostra subtotal e a taxa antes do total', () => {
    // pedido de R$ 41,50 + taxa de R$ 6,00 (sem cupom) => total R$ 47,50
    const msg = buildOrderMessage({
      ...baseOrder,
      fulfillment: 'entrega',
      endereco: 'Rua das Flores, 100',
      taxaEntrega: 6,
      total: 47.5,
    });
    expect(msg).toContain('Subtotal: R$ 41,50');
    expect(msg).toContain('Taxa de entrega: R$ 6,00');
    expect(msg).toContain('*Total: R$ 47,50*');
  });

  it('com cupom E taxa de entrega, mostra as tres linhas na ordem certa', () => {
    // R$ 41,50 - R$ 4,15 (cupom) + R$ 6,00 (taxa) => total R$ 43,35
    const msg = buildOrderMessage({
      ...baseOrder,
      fulfillment: 'entrega',
      endereco: 'Rua das Flores, 100',
      cupom: { codigo: 'BEMVINDO10', desconto: 4.15 },
      taxaEntrega: 6,
      total: 43.35,
    });
    const idxSubtotal = msg.indexOf('Subtotal: R$ 41,50');
    const idxCupom = msg.indexOf('Cupom BEMVINDO10: -R$ 4,15');
    const idxTaxa = msg.indexOf('Taxa de entrega: R$ 6,00');
    const idxTotal = msg.indexOf('*Total: R$ 43,35*');
    expect(idxSubtotal).toBeGreaterThanOrEqual(0);
    expect(idxSubtotal).toBeLessThan(idxCupom);
    expect(idxCupom).toBeLessThan(idxTaxa);
    expect(idxTaxa).toBeLessThan(idxTotal);
  });

  it('taxa "a combinar": mostra o aviso, sem valor, e nao soma nada ao total', () => {
    // total = so o subtotal (R$ 41,50), a taxa "a combinar" nao entra na conta
    const msg = buildOrderMessage({
      ...baseOrder,
      fulfillment: 'entrega',
      endereco: 'Rua das Flores, 100',
      taxaACombinar: true,
      total: 41.5,
    });
    expect(msg).toContain('Subtotal: R$ 41,50');
    expect(msg).toContain('Taxa de entrega: A combinar');
    expect(msg).not.toContain('Taxa de entrega: R$');
    expect(msg).toContain('*Total: R$ 41,50*');
  });

  it('taxa "a combinar" tem prioridade se taxaEntrega tambem vier preenchido por engano', () => {
    const msg = buildOrderMessage({
      ...baseOrder,
      fulfillment: 'entrega',
      endereco: 'Rua das Flores, 100',
      taxaEntrega: 6,
      taxaACombinar: true,
      total: 41.5,
    });
    expect(msg).toContain('Taxa de entrega: A combinar');
    expect(msg).not.toContain('R$ 6,00');
  });

  it('usa o titulo fixo do codigo (edicao pelo CMS foi desativada)', () => {
    const msg = buildOrderMessage(baseOrder);
    expect(msg).toContain('*Novo pedido — Doçuras da Nina*');
  });

  it('sem mensagem final configurada, a mensagem termina no pagamento', () => {
    const msg = buildOrderMessage(baseOrder);
    expect(msg.trimEnd().endsWith('*Pagamento:* Pix')).toBe(true);
  });
});

describe('buildWhatsappUrl', () => {
  it('remove nao-digitos do numero e codifica o texto', () => {
    const url = buildWhatsappUrl('+55 (11) 91234-5678', 'Olá, tudo bem?');
    expect(url).toBe('https://wa.me/5511912345678?text=Ol%C3%A1%2C%20tudo%20bem%3F');
  });
});

describe('generateOrderId', () => {
  it('gera no formato DN + 4 digitos', () => {
    expect(generateOrderId(() => 0)).toBe('DN1000');
    expect(generateOrderId(() => 0.9999)).toBe('DN9999');
    expect(generateOrderId()).toMatch(/^DN\d{4}$/);
  });
});
