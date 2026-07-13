// Schema da configuracao de Entrega e Retirada (collection "configuracoes",
// arquivo singleton src/content/configuracoes/entrega.json). Corresponde 1:1
// aos campos do CMS (public/admin/config.yml). A regra de negocio "as duas
// opcoes nao podem ficar desligadas ao mesmo tempo" fica em
// src/lib/checkout-config.ts (normalizeCheckoutConfig) e nao aqui — de
// proposito, para uma configuracao invalida nunca derrubar o build (mesmo
// espirito de produtoBaseSchema/cupomBaseSchema).
import { z } from 'astro/zod';

export const entregaConfigBaseSchema = z.object({
  entrega_habilitada: z.boolean().default(true),
  retirada_habilitada: z.boolean().default(true),
  // taxa em reais, somada ao total quando o cliente escolhe "Entrega".
  // Ignorada quando taxa_a_combinar for true.
  taxa_entrega: z.number().min(0).default(0),
  // quando true, mostra "A combinar" no lugar de um valor fixo (nao soma
  // nada ao total) — para quando a Nina ainda nao sabe o preco do frete.
  taxa_a_combinar: z.boolean().default(false),
});

export type EntregaConfigBase = z.infer<typeof entregaConfigBaseSchema>;
