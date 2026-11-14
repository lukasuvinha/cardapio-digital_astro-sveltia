// Schema da categoria, isolado para poder ser testado com Vitest sem o
// runtime do Astro. Corresponde 1:1 aos campos do CMS (public/admin/config.yml).
import { z } from 'astro/zod';

/**
 * Cores de categoria do tema (tokens --c-* em src/styles/theme.css). Pintam o
 * fundo do card, do chip e do detalhe do produto.
 */
export const CORES_CATEGORIA = ['morango', 'caramelo', 'cacau', 'baunilha', 'neutro'] as const;
export type CorCategoria = (typeof CORES_CATEGORIA)[number];

export const categoriaBaseSchema = z.object({
  nome: z.string(),
  // OPCIONAL: sem valor, a cor e distribuida pela ordem das categorias
  // (ver coresPorCategoria em src/data/menu-helpers.ts). Valor fora da lista
  // tambem cai na distribuicao automatica, em vez de quebrar o build.
  cor: z
    .string()
    .optional()
    .transform((v) => (CORES_CATEGORIA as readonly string[]).includes(v ?? '') ? (v as CorCategoria) : undefined),
});

export type CategoriaBase = z.infer<typeof categoriaBaseSchema>;
