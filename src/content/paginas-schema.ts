// Schemas do conteudo editavel das paginas "Sobre" e "Contato" (arquivos
// singulares src/content/configuracoes/sobre.json e contato.json, editados no
// CMS em Configuracoes -> Pagina Sobre / Pagina Contato). Correspondem 1:1
// aos campos de public/admin/config.yml.
//
// Todos os campos sao OPCIONAIS: texto vazio vira undefined e a parte
// correspondente da pagina simplesmente nao aparece (nunca quebra o build).
import { z } from 'astro/zod';

const textoOpcional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

export const sobrePaginaSchema = z.object({
  /** foto da pessoa ou da loja (URL publica, ex.: /uploads/foto.webp) */
  foto: textoOpcional,
  /** texto em tom pessoal; paragrafos separados por uma linha em branco */
  texto: textoOpcional,
  /** rotulo do botao que leva ao cardapio */
  chamada: textoOpcional,
});

export const contatoPaginaSchema = z.object({
  /** "Como encomendar": com quanta antecedencia pedir */
  antecedencia: textoOpcional,
  /** "Como encomendar": bairros/regiao atendidos na entrega */
  regiao_entrega: textoOpcional,
  /** "Como encomendar": onde/como retirar */
  retirada: textoOpcional,
  /** "Como encomendar": formas de pagamento aceitas */
  pagamento: textoOpcional,
});

export type SobrePagina = z.infer<typeof sobrePaginaSchema>;
export type ContatoPagina = z.infer<typeof contatoPaginaSchema>;

/** Divide o texto do CMS em paragrafos (separados por linha em branco). */
export function paragrafos(texto?: string): string[] {
  if (!texto) return [];
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

/** Itens da secao "Como encomendar", na ordem de exibicao, sem os vazios. */
export function itensComoEncomendar(c: Partial<ContatoPagina> | undefined): { chave: keyof ContatoPagina; titulo: string; texto: string }[] {
  const ordem: { chave: keyof ContatoPagina; titulo: string }[] = [
    { chave: 'antecedencia', titulo: 'Antecedência' },
    { chave: 'regiao_entrega', titulo: 'Região de entrega' },
    { chave: 'retirada', titulo: 'Retirada' },
    { chave: 'pagamento', titulo: 'Formas de pagamento' },
  ];
  return ordem
    .map(({ chave, titulo }) => ({ chave, titulo, texto: (c?.[chave] ?? '').trim() }))
    .filter((i) => i.texto);
}
