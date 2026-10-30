// Leitura (build time) do banner "Próxima fornada", editado pelo dono do site no
// CMS. Mesmo padrão de src/data/checkout-config.ts: lê a Content Collection
// e devolve o resultado pronto via a função pura de src/lib/fornada-banner.ts.
import { getCollection } from 'astro:content';
import { resolveFornadaBanner, type FornadaBanner } from '../lib/fornada-banner';

export async function getFornadaBanner(): Promise<FornadaBanner> {
  const entries = await getCollection('fornada');
  const entry = entries.find((e) => e.id === 'fornada');
  return resolveFornadaBanner(entry?.data);
}
