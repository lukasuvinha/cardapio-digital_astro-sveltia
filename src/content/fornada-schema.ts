// Schema da configuração do banner "Próxima fornada" (collection "fornada",
// arquivo singleton src/content/configuracoes/fornada.json). Corresponde 1:1
// aos campos do CMS (public/admin/config.yml). A lógica de qual texto/estado
// mostrar fica em src/lib/fornada-banner.ts (resolveFornadaBanner), não aqui
// — de propósito, para uma configuração incompleta nunca derrubar o build
// (mesmo espírito de produtoBaseSchema/cupomBaseSchema/entregaConfigBaseSchema).
import { z } from 'astro/zod';

export const fornadaConfigBaseSchema = z.object({
  banner_habilitado: z.boolean().default(false),
  modo: z.enum(['data', 'em_breve']).default('em_breve'),
  // data pura 'YYYY-MM-DD'. Mesma normalização usada em cupom-schema.ts para
  // o widget datetime/type:date do CMS (aceita Date, string ISO com
  // horário/fuso, ou já pronta).
  data: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => {
      if (v == null || v === '') return undefined;
      return (v instanceof Date ? v.toISOString() : String(v)).slice(0, 10);
    }),
  // hora exata (OPCIONAL), 'HH:mm'. Mesma normalização usada em
  // cupom-schema.ts para o campo "hora" do cupom.
  hora: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => {
      if (v == null || v === '') return undefined;
      const s = v instanceof Date ? v.toISOString().slice(11, 16) : String(v);
      const m = s.match(/(\d{1,2}):(\d{2})/);
      return m ? `${m[1].padStart(2, '0')}:${m[2]}` : undefined;
    }),
});

export type FornadaConfigBase = z.infer<typeof fornadaConfigBaseSchema>;
