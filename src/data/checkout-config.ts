// Leitura (build time) da configuracao de Entrega/Retirada, editada pela Nina
// no CMS. Mesmo padrao de src/data/menu.ts e src/data/cupons.ts: le a Content
// Collection e devolve um tipo de dominio simples via a funcao pura de
// src/lib/checkout-config.ts.
import { getCollection } from 'astro:content';
import { normalizeCheckoutConfig, type CheckoutConfig } from '../lib/checkout-config';

export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  const entries = await getCollection('configuracoes');
  const entrega = entries.find((e) => e.id === 'entrega');
  return normalizeCheckoutConfig(entrega?.data);
}
