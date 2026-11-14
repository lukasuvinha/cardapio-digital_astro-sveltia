// Painel de DEMONSTRACAO sem login (so com PUBLIC_DEMO_MODE=true no build).
//
// Roda depois do `astro build` (script "build" do package.json). Sem a
// variavel, nao faz nada: o build do template fica exatamente como sempre.
//
// Com PUBLIC_DEMO_MODE=true:
//  1. dist/admin/config.yml = public/admin/config.yml com o backend trocado
//     pelo Test Backend do Sveltia (`backend: { name: test-repo }`, sem repo,
//     branch e base_url). O Sveltia guarda as edicoes so no navegador de quem
//     testa (Origin Private File System): nada vai para o GitHub.
//  2. dist/admin/index.html ganha <link rel="cms-seed-url"
//     href="/seed/manifest.json" /> (conteudo inicial do repositorio de teste)
//     e um aviso fixo de que e uma demonstracao.
//  3. dist/seed/ recebe o conteudo e as fotos da loja de exemplo, nos mesmos
//     caminhos relativos a raiz do repositorio, e dist/seed/manifest.json
//     lista esses caminhos: { "files": [...] }. O Sveltia busca cada arquivo
//     relativo ao manifest (ex.: /seed/src/content/produtos/x.md).
//
// Docs: https://sveltiacms.app/en/docs/backends/test
// Uso manual: PUBLIC_DEMO_MODE=true npm run build

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Pastas (relativas a raiz) copiadas para o seed, e quais arquivos entram. */
export const SEED_SOURCES = [
  // conteudo editado no painel (Markdown/JSON); os schemas .ts e o README nao
  { dir: 'src/content', ext: ['.md', '.json', '.yml', '.yaml'], skip: ['README.md'] },
  // fotos da loja de exemplo (produtos e pagina Sobre)
  { dir: 'public/img/produtos', ext: ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif'] },
  { dir: 'public/img/sobre', ext: ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif'] },
  // uploads feitos pelo painel (media_folder), se houver
  { dir: 'public/uploads', ext: ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif'] },
];

export const SEED_URL = '/seed/manifest.json';
export const SEED_LINK = `<link rel="cms-seed-url" href="${SEED_URL}" />`;

export function demoLigado(env = process.env) {
  return env.PUBLIC_DEMO_MODE === 'true';
}

/**
 * Troca o bloco `backend:` (de nivel 0) do config.yml por
 * `backend:\n  name: test-repo`. O resto do arquivo (comentarios inclusive)
 * fica igual.
 */
export function configDemo(yml) {
  const linhas = yml.split('\n');
  const ini = linhas.findIndex((l) => /^backend:\s*(#.*)?$/.test(l));
  if (ini === -1) throw new Error('config.yml sem bloco "backend:" de nivel 0');
  let fim = ini + 1;
  // o bloco continua enquanto as linhas forem indentadas, vazias ou comentario indentado
  while (fim < linhas.length && (linhas[fim] === '' || /^\s/.test(linhas[fim]))) fim++;
  // devolve as linhas em branco do fim do bloco para depois dele
  let corte = fim;
  while (corte > ini + 1 && linhas[corte - 1].trim() === '') corte--;
  const novo = [
    '# MODO DEMONSTRACAO (gerado por scripts/demo-admin.mjs): Test Backend do',
    '# Sveltia, sem login. As edicoes ficam so no navegador de quem testa.',
    'backend:',
    '  name: test-repo',
  ];
  let out = [...linhas.slice(0, ini), ...novo, ...linhas.slice(corte)].join('\n');

  // Pasta de midia da demo = public/ inteira (publica em "/"). As fotos da loja
  // de exemplo ficam em /img/produtos e /img/sobre, fora de public/uploads; sem
  // isto o painel mostra so o caminho, sem a miniatura. /uploads/... continua
  // funcionando (public/uploads esta dentro de public/).
  const media = /^media_folder:.*$/m;
  const publica = /^public_folder:.*$/m;
  if (!media.test(out) || !publica.test(out)) throw new Error('config.yml sem media_folder/public_folder de nivel 0');
  out = out
    .replace(media, 'media_folder: "public"  # DEMO: inclui /img (fotos de exemplo) e /uploads')
    .replace(publica, 'public_folder: "/"');
  return out;
}

// Aviso fixo no painel, no canto inferior (nao cobre a barra do Sveltia), com
// botao "Entendi" para fechar. Usa cores fixas porque o /admin nao carrega o
// tema do site. O proprio Sveltia tambem mostra uma janela de boas-vindas da
// demo ao entrar no repositorio de teste.
export const AVISO_DEMO = `<div id="cd-demo-aviso" role="note" style="position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;gap:10px;width:max-content;max-width:calc(100vw - 24px);box-sizing:border-box;padding:6px 6px 6px 16px;border-radius:999px;background:#392E2B;color:#FFEDE8;font:500 13px/1.4 system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.28)"><span>Painel de demonstração · nada é salvo de verdade: as alterações ficam só neste navegador</span><button type="button" onclick="this.parentNode.remove()" style="flex:none;min-height:32px;padding:0 12px;border:0;border-radius:999px;background:#FFEDE8;color:#392E2B;font:600 13px/1 system-ui,sans-serif;cursor:pointer">Entendi</button></div>`;

/** Adiciona o link do seed ao <head> e o aviso ao <body> do admin. */
export function adminHtmlDemo(html) {
  let out = html;
  if (!out.includes('rel="cms-seed-url"')) {
    if (!out.includes('</head>')) throw new Error('admin/index.html sem </head>');
    out = out.replace('</head>', `${SEED_LINK}</head>`);
  }
  if (!out.includes('id="cd-demo-aviso"')) {
    if (!out.includes('</body>')) throw new Error('admin/index.html sem </body>');
    out = out.replace('</body>', `${AVISO_DEMO}</body>`);
  }
  return out;
}

async function listar(dirAbs) {
  let entradas;
  try {
    entradas = await fs.readdir(dirAbs, { withFileTypes: true });
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
  const out = [];
  for (const e of entradas) {
    const abs = path.join(dirAbs, e.name);
    if (e.isDirectory()) out.push(...(await listar(abs)));
    else if (e.isFile()) out.push(abs);
  }
  return out;
}

/** Caminhos (relativos a raiz, com "/") que vao para o seed, em ordem. */
export async function arquivosDoSeed(root) {
  const files = [];
  for (const { dir, ext, skip = [] } of SEED_SOURCES) {
    for (const abs of await listar(path.join(root, dir))) {
      const nome = path.basename(abs);
      if (nome.startsWith('.') || skip.includes(nome)) continue;
      if (!ext.includes(path.extname(nome).toLowerCase())) continue;
      files.push(path.relative(root, abs).split(path.sep).join('/'));
    }
  }
  return files.sort();
}

/**
 * Gera o painel de demonstracao em `dist`. Devolve o que fez
 * ({ ativo: false } sem a variavel).
 * @param {{ root: string, dist?: string, env?: Record<string, string | undefined> }} opcoes
 */
export async function gerarDemoAdmin({ root, dist = path.join(root, 'dist'), env = process.env }) {
  if (!demoLigado(env)) return { ativo: false };

  // 1. config.yml com o Test Backend
  const yml = await fs.readFile(path.join(root, 'public/admin/config.yml'), 'utf8');
  await fs.mkdir(path.join(dist, 'admin'), { recursive: true });
  await fs.writeFile(path.join(dist, 'admin/config.yml'), configDemo(yml));

  // 2. link do seed e aviso no admin/index.html
  const htmlPath = path.join(dist, 'admin/index.html');
  const html = await fs.readFile(htmlPath, 'utf8');
  await fs.writeFile(htmlPath, adminHtmlDemo(html));

  // 3. arquivos do seed + manifest
  const seedDir = path.join(dist, 'seed');
  await fs.rm(seedDir, { recursive: true, force: true });
  const files = await arquivosDoSeed(root);
  for (const rel of files) {
    const destino = path.join(seedDir, ...rel.split('/'));
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.copyFile(path.join(root, ...rel.split('/')), destino);
  }
  await fs.writeFile(path.join(seedDir, 'manifest.json'), JSON.stringify({ files }, null, 2) + '\n');

  return { ativo: true, files };
}

// executado direto (node scripts/demo-admin.mjs)
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const r = await gerarDemoAdmin({ root });
  if (r.ativo) {
    console.log(`[demo-admin] modo demonstracao: painel com Test Backend e ${r.files.length} arquivos no seed`);
  }
}
