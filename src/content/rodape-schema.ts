// Schema da configuracao do rodape (arquivo singular
// src/content/configuracoes/rodape.json, editado no CMS em Configuracoes ->
// Rodape). Corresponde 1:1 aos campos de public/admin/config.yml.
//
// - Horario de pedidos: texto livre + chave liga/desliga.
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

export const rodapeConfigSchema = z.object({
  horario_habilitado: z.boolean().optional().default(true),
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

/** Texto do horario, ou '' se desligado/vazio. */
export function horarioVisivel(config: Partial<RodapeConfig> | undefined): string {
  if (!config || config.horario_habilitado === false) return '';
  return (config.horario ?? '').trim();
}
