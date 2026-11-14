// Schema da configuracao do rodape (arquivo singular
// src/content/configuracoes/rodape.json, editado no CMS em Configuracoes ->
// Rodape). Corresponde 1:1 aos campos de public/admin/config.yml.
//
// - Horario de pedidos: chave liga/desliga + dia inicial, dia final, hora de
//   inicio e hora de fim escolhidos em menus. O TEXTO e fixo, montado aqui
//   (ex.: "Pedidos de terça a sábado, das 9h às 18h") — ver textoHorario.
// - Redes sociais: lista em que o dono da loja escolhe a rede, cola o link do
//   perfil e liga/desliga cada uma. SO entra no site a rede que estiver
//   ligada E tiver um link valido (https://...) — o painel ja exige o link,
//   e o site ignora qualquer item sem link, por seguranca.
import { z } from 'astro/zod';

/** Redes que podem aparecer no rodape e na pagina Contato (ordem do select). */
export const REDES_SOCIAIS = ['instagram', 'tiktok', 'facebook', 'pinterest', 'x', 'youtube', 'threads'] as const;
export type RedeSocial = (typeof REDES_SOCIAIS)[number];

/** Todos os icones de traco de src/components/SocialIcon.astro. */
export type IconeSocial = RedeSocial | 'whatsapp' | 'github' | 'linkedin';

/** Nome exibido (aria-label no rodape, rotulo na pagina Contato). */
export const NOME_DA_REDE: Record<RedeSocial, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  x: 'X',
  youtube: 'YouTube',
  threads: 'Threads',
};

const redeItem = z.object({
  rede: z.string().optional(),
  url: z.string().optional(),
  // sem o campo, a rede conta como ligada
  ativo: z.boolean().optional().default(true),
});

/** Dias da semana (valores gravados pelo CMS), na ordem da semana. */
export const DIAS_SEMANA = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

/**
 * Nome do dia no texto ("de terça a sábado") e no plural com o artigo certo
 * ("às terças", mas "aos sábados" / "aos domingos", que sao masculinos).
 */
const NOME_DIA: Record<DiaSemana, { nome: string; plural: string; rotulo: string }> = {
  segunda: { nome: 'segunda', plural: 'às segundas', rotulo: 'Segunda-feira' },
  terca: { nome: 'terça', plural: 'às terças', rotulo: 'Terça-feira' },
  quarta: { nome: 'quarta', plural: 'às quartas', rotulo: 'Quarta-feira' },
  quinta: { nome: 'quinta', plural: 'às quintas', rotulo: 'Quinta-feira' },
  sexta: { nome: 'sexta', plural: 'às sextas', rotulo: 'Sexta-feira' },
  sabado: { nome: 'sábado', plural: 'aos sábados', rotulo: 'Sábado' },
  domingo: { nome: 'domingo', plural: 'aos domingos', rotulo: 'Domingo' },
};

/** Rotulo do dia no menu do CMS (ex.: "Terça-feira"). */
export function rotuloDia(dia: DiaSemana): string {
  return NOME_DIA[dia].rotulo;
}

/** Horarios do menu do CMS: de meia em meia hora, "00:00" a "23:30". */
export const HORAS: readonly string[] = Array.from({ length: 48 }, (_, i) =>
  `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
);

/** "09:00" -> "9h"; "09:30" -> "9h30". Valor fora do formato -> ''. */
export function formatarHora(hhmm: string | undefined): string {
  const m = (hhmm ?? '').match(/^(\d{2}):(\d{2})$/);
  if (!m) return '';
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return '';
  return min ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`;
}

export interface HorarioPedidos {
  dia_inicio?: string;
  dia_fim?: string;
  hora_inicio?: string;
  hora_fim?: string;
}

/**
 * Texto FIXO do horario a partir das escolhas do menu:
 *  - de segunda a domingo -> "Pedidos todos os dias, das 9h às 18h"
 *  - mesmo dia            -> "Pedidos às terças, das 9h às 18h" (ou "aos sábados")
 *  - outros               -> "Pedidos de terça a sábado, das 9h às 18h"
 * Qualquer campo faltando ou invalido -> '' (a linha nao aparece).
 */
export function textoHorario(h: HorarioPedidos | undefined): string {
  if (!h) return '';
  const ini = h.dia_inicio as DiaSemana;
  const fim = h.dia_fim as DiaSemana;
  if (!(DIAS_SEMANA as readonly string[]).includes(ini) || !(DIAS_SEMANA as readonly string[]).includes(fim)) return '';
  const hi = formatarHora(h.hora_inicio);
  const hf = formatarHora(h.hora_fim);
  if (!hi || !hf) return '';
  const horas = `das ${hi} às ${hf}`;
  if (ini === 'segunda' && fim === 'domingo') return `Pedidos todos os dias, ${horas}`;
  if (ini === fim) return `Pedidos ${NOME_DIA[ini].plural}, ${horas}`;
  return `Pedidos de ${NOME_DIA[ini].nome} a ${NOME_DIA[fim].nome}, ${horas}`;
}

export const rodapeConfigSchema = z.object({
  horario_habilitado: z.boolean().optional().default(true),
  dia_inicio: z.string().optional(),
  dia_fim: z.string().optional(),
  hora_inicio: z.string().optional(),
  hora_fim: z.string().optional(),
  // ANTES: texto livre do horario. Nao e mais lido (o texto agora e fixo,
  // montado por textoHorario); continua aceito para nao quebrar arquivos
  // antigos que ainda tenham o campo.
  horario: z.string().optional(),
  redes: z.array(redeItem).optional().default([]),
});

export type RodapeConfig = z.infer<typeof rodapeConfigSchema>;

/** Link aceito: http(s), com dominio (ex.: https://www.instagram.com/minhaloja). */
export function linkValido(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url.trim());
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export interface RedeVisivel {
  rede: RedeSocial;
  nome: string;
  url: string;
}

/**
 * Redes que aparecem no site, na ordem cadastrada: so as LIGADAS, de uma rede
 * conhecida e COM link valido. Itens repetidos da mesma rede: vale o primeiro.
 */
export function redesVisiveis(config: Partial<RodapeConfig> | undefined): RedeVisivel[] {
  const vistas = new Set<string>();
  const out: RedeVisivel[] = [];
  for (const item of config?.redes ?? []) {
    const rede = (item.rede ?? '') as RedeSocial;
    if (!(REDES_SOCIAIS as readonly string[]).includes(rede)) continue;
    if (item.ativo === false || !linkValido(item.url) || vistas.has(rede)) continue;
    vistas.add(rede);
    out.push({ rede, nome: NOME_DA_REDE[rede], url: item.url!.trim() });
  }
  return out;
}

/** Texto do horario, ou '' se desligado ou com dia/hora faltando. */
export function horarioVisivel(config: Partial<RodapeConfig> | undefined): string {
  if (!config || config.horario_habilitado === false) return '';
  return textoHorario(config);
  // ANTES: return (config.horario ?? '').trim();  (texto livre)
}
