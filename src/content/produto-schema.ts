// Schema do produto, isolado aqui para poder ser testado com Vitest sem
// depender do runtime do Astro.
//
// IMPORTANTE — por que `foto` e uma STRING (URL) e NAO o image() do Astro:
// O image() otimiza no build, mas HARD-FAILA o build inteiro se a imagem nao
// resolver (caminho errado, formato estranho, etc.). Como as fotos vem de
// uploads da Nina pelo CMS, isso ja quebrou o deploy 3 vezes. Agora a foto e
// uma URL de /public (servida como esta, o build NUNCA a processa, entao nao
// tem como quebrar), e a otimizacao acontece no UPLOAD (o Sveltia converte
// para WebP e redimensiona no navegador antes de commitar) — ver
// public/admin/config.yml (media_libraries.transformations).
import { z } from 'astro/zod';

export const produtoBaseSchema = z.object({
  nome: z.string(),
  descricao: z.string().optional(),
  // preco DEVE ser numero (nao string) — garante calculo correto de subtotal
  preco: z.number(),
  categoria: z.string(),
  // se omitido no CMS, assume disponivel
  disponivel: z.boolean().default(true),
  // "Esconder do Cardápio": some do site (grade e pagina de detalhe) mas o
  // produto continua no CMS, com nome/descricao/preco preservados, para a
  // Nina poder reativar depois. Diferente de "disponivel: false" (que ainda
  // mostra o produto com o selo "Esgotado"). Se omitido no CMS, assume NAO
  // escondido (produtos existentes continuam aparecendo normalmente).
  escondido: z.boolean().default(false),
  // caminho publico da foto (ex.: /uploads/foo.webp) ou ausente
  foto: z.string().optional(),
});

export type ProdutoBase = z.infer<typeof produtoBaseSchema>;
