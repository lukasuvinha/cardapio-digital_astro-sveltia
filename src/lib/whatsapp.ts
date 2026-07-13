// Montagem da mensagem de pedido e do link do WhatsApp (funcoes puras).
import type { CartLine } from './cart-core';
import { formatPrice } from './format';

export type Fulfillment = 'retirada' | 'entrega';
export type Payment = 'pix' | 'cartao' | 'dinheiro';

export interface Order {
  pedido: string; // ex.: "DN1234"
  nome: string;
  telefone: string;
  fulfillment: Fulfillment;
  endereco?: string;
  payment: Payment;
  observacoes?: string;
  lines: CartLine[];
  /** soma dos itens, antes do desconto */
  subtotal: number;
  /** cupom aplicado (opcional): codigo e desconto em reais */
  cupom?: { codigo: string; desconto: number };
  /** taxa de entrega (R$), somada ao total quando fulfillment === 'entrega'. Ausente/0 = sem taxa. */
  taxaEntrega?: number;
  /** taxa "a combinar" (sem valor fixo ainda) — quando true, taxaEntrega deve ficar ausente/0. */
  taxaACombinar?: boolean;
  /** total final a pagar (subtotal - desconto do cupom + taxa de entrega, se houver) */
  total: number;
}

const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  retirada: 'Retirada',
  entrega: 'Entrega',
};

const PAYMENT_LABEL: Record<Payment, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
};

// Titulo e mensagem final da mensagem do pedido. ANTES eram editaveis pela
// Nina direto no painel do Sveltia (CMS) via um arquivo de configuracao
// (OrderMessageConfig); a pedido do cliente, essa opcao foi DESATIVADA no CMS
// (ver o bloco comentado "configuracoes" em public/admin/config.yml) porque a
// Nina prefere que o texto so mude por pedido direto ao desenvolvedor.
//
// Para trocar o texto agora, edite as duas constantes abaixo, direto no
// codigo. Passo a passo em docs/CUPONS-E-PEDIDOS.md, secao
// "Editar o texto do WhatsApp manualmente".
const TITULO = 'Novo pedido — Doçuras da Nina';
// mensagem extra no fim do pedido (ex.: um agradecimento). Deixe '' (vazio)
// para nao incluir nenhuma linha a mais.
const MENSAGEM_FINAL = '';

// ---- ANTES: titulo/mensagem final editaveis pela Nina no CMS (singleton
//      src/content/configuracoes/whatsapp.json). Mantido comentado para
//      referencia e reativacao rapida, se um dia for reativado no CMS.
// export interface OrderMessageConfig {
//   /** primeira linha (em negrito) da mensagem. */
//   titulo?: string;
//   /** texto opcional no fim da mensagem (ex.: agradecimento). */
//   mensagemFinal?: string;
// }
// export function buildOrderMessage(order: Order, config: OrderMessageConfig = {}): string {
//   const titulo = (config.titulo && config.titulo.trim()) || TITULO;
//   ...(igual ao buildOrderMessage abaixo, mas usando config.mensagemFinal no
//   lugar de MENSAGEM_FINAL)...
// }

/** Monta o texto do pedido em portugues, pronto para o WhatsApp. */
export function buildOrderMessage(order: Order): string {
  const linhas: string[] = [];

  linhas.push(`*${TITULO}*`);
  linhas.push(`Pedido: ${order.pedido}`);
  linhas.push('');

  linhas.push('*Itens*');
  for (const l of order.lines) {
    // quantidade, PRECO UNITARIO e subtotal da linha (ex.: "2× Brownie — R$ 14,00 cada = R$ 28,00")
    linhas.push(`${l.qty}× ${l.nome} — ${formatPrice(l.preco)} cada = ${formatPrice(l.lineTotal)}`);
  }
  linhas.push('');
  // Se houver cupom e/ou taxa de entrega, mostra o subtotal antes do total
  // final, para o calculo ficar transparente (o total sozinho nao bateria
  // com a soma dos itens acima).
  const temCupom = !!order.cupom && order.cupom.desconto > 0;
  const temTaxaACombinar = !!order.taxaACombinar;
  // "a combinar" tem prioridade: se vier junto com um valor numerico (nao
  // deveria, mas por seguranca), o aviso "A combinar" e o que vale.
  const temTaxa = !temTaxaACombinar && !!order.taxaEntrega && order.taxaEntrega > 0;
  if (temCupom || temTaxa || temTaxaACombinar) {
    linhas.push(`Subtotal: ${formatPrice(order.subtotal)}`);
  }
  if (temCupom) {
    linhas.push(`Cupom ${order.cupom!.codigo}: -${formatPrice(order.cupom!.desconto)}`);
  }
  if (temTaxaACombinar) {
    // sem valor fixo ainda: nao soma nada ao total, so avisa que precisa combinar
    linhas.push(`Taxa de entrega: A combinar`);
  } else if (temTaxa) {
    linhas.push(`Taxa de entrega: ${formatPrice(order.taxaEntrega!)}`);
  }
  linhas.push(`*Total: ${formatPrice(order.total)}*`);
  linhas.push('');

  linhas.push('*Cliente*');
  linhas.push(`Nome: ${order.nome}`);
  linhas.push(`Telefone: ${order.telefone}`);
  linhas.push('');

  linhas.push(`*Entrega:* ${FULFILLMENT_LABEL[order.fulfillment]}`);
  if (order.fulfillment === 'entrega' && order.endereco) {
    linhas.push(`Endereço: ${order.endereco}`);
  }
  linhas.push(`*Pagamento:* ${PAYMENT_LABEL[order.payment]}`);

  if (order.observacoes && order.observacoes.trim()) {
    linhas.push('');
    linhas.push(`*Observações:* ${order.observacoes.trim()}`);
  }

  // mensagem final opcional (ver MENSAGEM_FINAL no topo do arquivo)
  if (MENSAGEM_FINAL.trim()) {
    linhas.push('');
    linhas.push(MENSAGEM_FINAL.trim());
  }

  return linhas.join('\n');
}

/** Monta a URL do WhatsApp (wa.me) com o numero (so digitos) e o texto. */
export function buildWhatsappUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Gera um numero de pedido ALEATORIO, ex.: "DN1234". E o gerador ATIVO
 * (usado pelo CartDrawer).
 *
 * Existe tambem uma numeracao SEQUENCIAL (DN0001, DN0002...) em
 * src/lib/order-number.ts, mas ela foi DESATIVADA a pedido do cliente: como
 * o site nao tem servidor, o contador sequencial e por navegador — cada
 * cliente novo comecaria do zero em DN0001, o que confundia mais do que
 * ajudava. O codigo sequencial continua no repo (nao usado) para o caso de
 * um dia ganhar um backend e virar um contador global de verdade.
 */
export function generateOrderId(rand: () => number = Math.random): string {
  return 'DN' + Math.floor(1000 + rand() * 9000);
}
