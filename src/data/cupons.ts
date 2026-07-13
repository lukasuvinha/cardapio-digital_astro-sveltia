// Leitura dos cupons da Content Collection (tempo de build).
import { getCollection } from 'astro:content';
import type { Coupon } from '../lib/coupon';

/** Le todos os cupons cadastrados no CMS. */
export async function getCupons(): Promise<Coupon[]> {
  const entries = await getCollection('cupons');
  return entries.map((e) => ({
    codigo: e.data.codigo,
    tipo: e.data.tipo,
    valor: e.data.valor,
    validade: e.data.validade,
    hora: e.data.hora, // opcional: hora exata de expiracao (HH:mm) ou undefined
  }));
}
