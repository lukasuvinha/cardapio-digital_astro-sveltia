// Content Collections do Astro.
//
// A collection "produtos" e a fonte da verdade dos produtos do cardapio,
// editavel pela Nina via Sveltia CMS (ver pasta /admin). Cada produto e um
// arquivo plano src/content/produtos/<slug>.md. As fotos NAO ficam aqui: sao
// URLs de /public (ex.: /uploads/foo.webp), ver produto-schema.ts para o porque.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { produtoBaseSchema } from './produto-schema';
import { cupomBaseSchema } from './cupom-schema';
import { entregaConfigBaseSchema } from './configuracoes-schema';
import { fornadaConfigBaseSchema } from './fornada-schema';
import { z } from 'astro/zod';

const produtos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/produtos' }),
  // schema simples e testavel (foto e uma string/URL, nao o image() do Astro)
  schema: produtoBaseSchema,
});

// Cupons de desconto, editaveis pela Nina no CMS.
const cupons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cupons' }),
  schema: cupomBaseSchema,
});

// Categorias dos doces. Existe para a Nina poder ADICIONAR novas categorias
// pelo CMS (o campo "categoria" do produto e um relation para esta collection).
// O site em si deriva as categorias dos proprios produtos, entao esta collection
// e usada pelo painel; mantemos definida aqui para o Astro validar os arquivos.
const categorias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categorias' }),
  schema: z.object({ nome: z.string() }),
});

// Configuracoes operacionais editaveis pela Nina no CMS (collection do tipo
// "files" no painel: cada entrada e um arquivo singular, nao uma lista). Hoje
// so o arquivo "entrega.json" e lido de verdade — o pattern do loader NAO
// inclui "whatsapp.json" (existe no repo mas fica FORA desta collection de
// proposito; ver nota em src/lib/whatsapp.ts e docs/CUPONS-E-PEDIDOS.md).
const configuracoes = defineCollection({
  loader: glob({ pattern: 'entrega.json', base: './src/content/configuracoes' }),
  schema: entregaConfigBaseSchema,
});

// Banner "Proxima fornada" (mesma pasta de configuracoes, arquivo singular
// proprio). Collection separada da "configuracoes" acima porque cada
// collection do Astro so aceita UM schema — mais simples do que unir os dois
// formatos num schema so. No painel do CMS, porem, os dois arquivos aparecem
// juntos, dentro da mesma secao "Configuracoes" (ver config.yml).
const fornada = defineCollection({
  loader: glob({ pattern: 'fornada.json', base: './src/content/configuracoes' }),
  schema: fornadaConfigBaseSchema,
});

export const collections = { produtos, cupons, categorias, configuracoes, fornada };
