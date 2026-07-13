// Camada de dados do cardapio (fonte unica da verdade).
//
// A partir da fase do CMS, os produtos vem da Content Collection "produtos"
// (arquivos .md em src/content/produtos/, editaveis pela Nina via Sveltia CMS).
// Ver src/content/config.ts. Os helpers puros (agrupar, filtrar, etc.) ficam
// em ./menu-helpers.ts (testaveis) e sao reexportados aqui.
//
// -----------------------------------------------------------------------------
// CAMINHO ANTIGO (JSON fixo) — DESATIVADO, mas preservado para reativacao.
// Antes desta fase os produtos vinham de ./products.json. Para reativar:
//   1) descomente o import e o `products` abaixo (e ajuste os tipos: foto era
//      string | null; aqui e ImageMetadata);
//   2) troque, nas paginas, `await getProdutos()` por `products`.
// O arquivo src/data/products.json foi mantido no repo de proposito.
//
// import productsJson from './products.json';
// export const products = productsJson as Array<{ id: string; nome: string;
//   descricao?: string; preco: number; categoria: string; foto: string | null;
//   disponivel: boolean }>;
// -----------------------------------------------------------------------------

import { getCollection, type CollectionEntry } from 'astro:content';
import { porDisponibilidade, produtosVisiveis, type Product } from './menu-helpers';

// reexporta tipos e helpers puros para os consumidores continuarem importando
// tudo de '../data/menu'
export * from './menu-helpers';

/** Converte uma entrada da collection no tipo Product usado pelo app. */
function toProduct(entry: CollectionEntry<'produtos'>): Product {
  return {
    id: entry.id,
    nome: entry.data.nome,
    descricao: entry.data.descricao,
    preco: entry.data.preco,
    categoria: entry.data.categoria,
    disponivel: entry.data.disponivel,
    escondido: entry.data.escondido,
    foto: entry.data.foto,
  };
}

/**
 * Le todos os produtos VISIVEIS da Content Collection (assincrono, em tempo
 * de build) — produtos escondidos do cardapio (ver produtosVisiveis em
 * menu-helpers.ts) ja saem filtrados aqui, entao NENHUM consumidor (grade,
 * pagina de detalhe, carrinho) precisa se preocupar com isso; todos chamam
 * getProdutos().
 * Disponiveis vem primeiro; esgotados vao para o fim da lista (ver
 * porDisponibilidade em menu-helpers.ts) — ficam visiveis so ao rolar a pagina.
 */
export async function getProdutos(): Promise<Product[]> {
  const entries = await getCollection('produtos');
  return produtosVisiveis(entries.map(toProduct)).sort(porDisponibilidade);
}
