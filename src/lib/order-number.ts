// Numero de pedido SEQUENCIAL e crescente: DN0001, DN0002, DN0003, ...
//
// ATUALMENTE NAO USADO — a pedido do cliente, o app voltou a usar o numero
// ALEATORIO (generateOrderId em src/lib/whatsapp.ts). Motivo: como o site e
// 100% estatico, sem servidor/banco, o contador so pode viver no localStorage
// DE CADA NAVEGADOR — ou seja, cada cliente novo (ou cada aparelho diferente
// da mesma pessoa) comecaria SEMPRE do zero em "DN0001", o que parecia
// estranho/pouco confiavel para quem recebe o pedido.
//
// Este arquivo fica aqui, testado e funcional, para o caso de um dia o site
// ganhar um backend (Cloudflare Worker + KV/D1, por ex.) e um contador
// GLOBAL de verdade fizer sentido. Para reativar por navegador mesmo assim:
// em src/components/CartDrawer.astro, troque a importacao de
// `generateOrderId` (de '../lib/whatsapp') por `nextOrderNumber` (deste
// arquivo) e troque a chamada `pedido: generateOrderId()` por
// `pedido: nextOrderNumber()`.
//
// Ver docs/CUPONS-E-PEDIDOS.md.

const KEY = 'dn-pedido-seq';

/** Formata um numero sequencial como "DN0001" (minimo 4 digitos). */
export function formatOrderNumber(seq: number): string {
  const n = Math.max(0, Math.floor(seq));
  return 'DN' + String(n).padStart(4, '0');
}

/**
 * Proximo numero de pedido: incrementa e persiste o contador do navegador.
 * Retorna ja formatado (ex.: "DN0007").
 */
export function nextOrderNumber(): string {
  let seq = 1;
  try {
    const atual = parseInt(localStorage.getItem(KEY) || '0', 10);
    seq = (Number.isFinite(atual) ? atual : 0) + 1;
    localStorage.setItem(KEY, String(seq));
  } catch {
    // localStorage indisponivel: usa 1 e nao trava o pedido
  }
  return formatOrderNumber(seq);
}
