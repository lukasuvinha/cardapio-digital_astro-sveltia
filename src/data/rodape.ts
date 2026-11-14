// Leitura (build time) da configuracao do rodape (horario e redes sociais),
// editada no CMS em Configuracoes -> Rodape. Sem arquivo, nada aparece.
import { getCollection } from 'astro:content';
import { horarioVisivel, redesVisiveis, type RedeVisivel } from '../content/rodape-schema';

export async function getRodape(): Promise<{ horario: string; redes: RedeVisivel[] }> {
  const entries = await getCollection('rodape');
  const config = entries.find((e) => e.id === 'rodape')?.data;
  return { horario: horarioVisivel(config), redes: redesVisiveis(config) };
}
