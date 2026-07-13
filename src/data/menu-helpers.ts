// Helpers puros do cardapio (SEM dependencia de astro:content), para poderem
// ser testados com Vitest. A leitura da Content Collection fica em ./menu.ts,
// que reexporta tudo daqui.
import { slugify } from '../lib/slug';

export interface Product {
  id: string;
  nome: string;
  /** descricao curta, exibida na pagina de detalhe do produto */
  descricao?: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
  /**
   * "Esconder do Cardápio": produto some do site (grade e pagina de
   * detalhe), mas continua no CMS com todos os dados preservados, para a
   * Nina reativar quando quiser. Diferente de disponivel=false (que ainda
   * aparece, com o selo "Esgotado"). Ausente/undefined = NAO escondido
   * (compatibilidade com produtos existentes).
   */
  escondido?: boolean;
  /** URL publica da foto (ex.: /uploads/foo.webp); undefined quando nao ha foto */
  foto?: string;
}

export interface CategoryGroup {
  categoria: string;
  slug: string;
  produtos: Product[];
}

// Formatos de imagem que o navegador exibe com seguranca. Serve de PROTECAO:
// uma foto em formato incompativel (ex.: .heic do iPhone) NAO e tratada como
// imagem — o produto cai no placeholder em vez de mostrar uma imagem quebrada.
const FORMATOS_SUPORTADOS = /\.(jpe?g|png|webp|avif|gif)$/i;

/** true quando o produto tem uma foto em formato suportado pelo navegador. */
export function productHasPhoto(product: Pick<Product, 'foto'>): boolean {
  const foto = product.foto;
  return typeof foto === 'string' && FORMATOS_SUPORTADOS.test(foto.trim());
}

/** Busca um produto pelo id dentro de uma lista. */
export function produtoById(produtos: Product[], id: string): Product | undefined {
  return produtos.find((p) => p.id === id);
}

/**
 * Remove produtos ESCONDIDOS da lista — eles nao devem aparecer em nenhum
 * lugar visivel ao cliente (grade, pagina de detalhe, carrinho). O arquivo do
 * produto continua existindo no CMS; so nao entra no que e mostrado no site.
 */
export function produtosVisiveis(produtos: Product[]): Product[] {
  return produtos.filter((p) => !p.escondido);
}

/** Categorias na ordem de primeira aparicao. */
export function categoriasDe(produtos: Product[]): string[] {
  return [...new Set(produtos.map((p) => p.categoria))];
}

/** Ordena por id numerico (p1, p2, ... p10), preservando a ordem do cardapio. */
export function porId(a: Product, b: Product): number {
  const na = Number(a.id.replace(/\D/g, '')) || 0;
  const nb = Number(b.id.replace(/\D/g, '')) || 0;
  return na - nb || a.id.localeCompare(b.id);
}

/**
 * Ordem de exibicao do cardapio: produtos DISPONIVEIS primeiro (por id entre
 * si), esgotados por ULTIMO (tambem por id entre si). Assim o esgotado nao
 * fica a vista quando o cliente entra no site, mas ainda aparece — no fim da
 * pagina — se ele rolar ate o final. O filtro por categoria (client-side) so
 * mostra/esconde cards, nao reordena o DOM, entao essa ordem tambem vale
 * dentro de cada categoria filtrada.
 */
export function porDisponibilidade(a: Product, b: Product): number {
  if (a.disponivel !== b.disponivel) return a.disponivel ? -1 : 1;
  return porId(a, b);
}

/**
 * Agrupa produtos por categoria, preservando a ordem de primeira aparicao
 * (tanto das categorias quanto dos produtos dentro de cada uma).
 */
export function groupByCategory(produtos: Product[]): CategoryGroup[] {
  const ordem: string[] = [];
  const mapa = new Map<string, Product[]>();

  for (const p of produtos) {
    if (!mapa.has(p.categoria)) {
      mapa.set(p.categoria, []);
      ordem.push(p.categoria);
    }
    mapa.get(p.categoria)!.push(p);
  }

  return ordem.map((categoria) => ({
    categoria,
    slug: slugify(categoria),
    produtos: mapa.get(categoria)!,
  }));
}
