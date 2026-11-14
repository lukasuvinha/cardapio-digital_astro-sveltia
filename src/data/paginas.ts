// Leitura (build time) do conteudo das paginas "Sobre" e "Contato", editado
// no CMS. Sem arquivo (ou com campos vazios), devolve um objeto vazio e as
// paginas escondem as partes correspondentes.
import { getCollection } from 'astro:content';
import type { SobrePagina, ContatoPagina } from '../content/paginas-schema';

export async function getSobrePagina(): Promise<SobrePagina> {
  const entries = await getCollection('sobre');
  return entries.find((e) => e.id === 'sobre')?.data ?? {};
}

export async function getContatoPagina(): Promise<ContatoPagina> {
  const entries = await getCollection('contato');
  return entries.find((e) => e.id === 'contato')?.data ?? {};
}
