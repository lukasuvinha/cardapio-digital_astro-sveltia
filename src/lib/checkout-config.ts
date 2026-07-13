// Regras puras da configuracao de Entrega/Retirada (testaveis sem Content
// Collections). A Nina edita os valores brutos pelo painel do Sveltia CMS
// (collection "configuracoes", arquivo entrega.json); esta funcao normaliza
// esse valor bruto para o formato usado pelo carrinho. Ver
// docs/CUPONS-E-PEDIDOS.md, secao "Entrega e retirada".

export interface CheckoutConfig {
  entregaHabilitada: boolean;
  retiradaHabilitada: boolean;
  /** taxa em reais, somada ao total quando o cliente escolhe "Entrega". Ignorada quando taxaACombinar for true. */
  taxaEntrega: number;
  /** quando true, a taxa nao tem valor fixo: mostra "A combinar" e nao soma nada ao total. */
  taxaACombinar: boolean;
}

export interface CheckoutConfigInput {
  entrega_habilitada?: boolean;
  retirada_habilitada?: boolean;
  taxa_entrega?: number;
  taxa_a_combinar?: boolean;
}

/**
 * Normaliza a config bruta do CMS. As duas opcoes nunca podem ficar
 * desligadas ao mesmo tempo (o cliente sempre precisa de uma forma de
 * receber o pedido) — se isso acontecer, a Retirada e reativada
 * automaticamente, sem quebrar o build.
 */
export function normalizeCheckoutConfig(raw: CheckoutConfigInput | undefined): CheckoutConfig {
  const entregaHabilitada = raw?.entrega_habilitada ?? true;
  let retiradaHabilitada = raw?.retirada_habilitada ?? true;
  if (!entregaHabilitada && !retiradaHabilitada) {
    retiradaHabilitada = true;
  }
  const taxaEntrega = raw?.taxa_entrega ?? 0;
  const taxaACombinar = raw?.taxa_a_combinar ?? false;
  return { entregaHabilitada, retiradaHabilitada, taxaEntrega, taxaACombinar };
}
