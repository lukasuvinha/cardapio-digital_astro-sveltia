// Schema do cupom, isolado para poder ser testado com Vitest sem o runtime
// do Astro. Corresponde 1:1 aos campos do CMS (public/admin/config.yml).
import { z } from 'astro/zod';

export const cupomBaseSchema = z.object({
  codigo: z.string(),
  // tipo de desconto: percentual (%) ou valor fixo (R$)
  tipo: z.enum(['percentual', 'valor_fixo']),
  // valor do desconto (numero): 10 = 10% (percentual) ou R$ 10,00 (valor_fixo)
  valor: z.number(),
  // data de validade, valida ate o fim desse dia. O widget "datetime"
  // (type: date) do CMS grava "YYYY-MM-DD", mas dependendo da versao/serializacao
  // o valor pode chegar como Date, ou como string ISO com horario/fuso
  // (ex.: "2030-12-31T00:00:00.000Z"). Normalizamos SEMPRE para os 10 primeiros
  // caracteres ("YYYY-MM-DD"), para nao quebrar o build nem a logica de
  // validade (coupon.ts), seja qual for o formato gravado.
  validade: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v.toISOString() : String(v)).slice(0, 10)),
  // hora exata de expiracao (OPCIONAL). Se preenchida no CMS (widget de hora),
  // o cupom expira nesse horario do dia da validade; se vazia, vale o dia todo.
  // Normalizamos para 'HH:mm' (aceita Date/ISO com horario tambem).
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

export type CupomBase = z.infer<typeof cupomBaseSchema>;
