# Auditoria de dívida técnica — 2026-11-24

> Projeto: cardápio digital (Astro 5 + Sveltia CMS + Cloudflare Workers)
> Comando: `npm run auditoria` (branch `auditoria`)
> **Nenhum código do projeto foi alterado** — só foram criadas configs e o script.

---

## 1. Resumo em português simples

O projeto está **saudável no que mais importa**: os 274 testes passam (`npx vitest run`), não há
arquivos `.svelte`, e o código já faz coisas cuidadosas (por exemplo, escapa o `<` ao embutir JSON
em `<script>`, o que evita XSS). A dívida técnica encontrada se concentra em quatro áreas:

| Área                            | O que achamos                                                                                       | Gravidade      |
| ------------------------------- | --------------------------------------------------------------------------------------------------- | -------------- |
| **Dependências (npm audit)**    | 15 vulnerabilidades conhecidas (3 críticas, 10 altas), principalmente no `astro` 5 e no `vitest` 3   | 🔴 crítico     |
| **Versões (npm outdated)**      | `astro` está 2 versões *major* atrás (5 → 7); `vitest` também (3 → 5)                                | 🟠 importante  |
| **Tipos (astro check)**         | 60 erros, mas **quase todos têm uma única causa**: falta o pacote `@types/node`                      | 🟠 importante  |
| **Código morto (knip)**         | 1 arquivo desativado, 8 exports e 10 tipos exportados que ninguém usa                                | 🟡 cosmético   |
| **Boas práticas (eslint)**      | 45 avisos: 33 `any` nos testes, 11 variáveis não usadas, 1 `let` que deveria ser `const`             | 🟡 cosmético   |
| **Formatação (prettier)**       | 54 arquivos fora do padrão (nunca foi rodado um formatador no projeto)                              | 🟡 cosmético   |

**Em uma frase:** atualize o Astro (segurança), instale `@types/node` (deixa o `astro check` limpo),
e depois trate o resto com calma — é limpeza, não incêndio.

---

## 2. Como a auditoria foi montada

### Pacotes instalados (devDependencies)

| Pacote                  | Pedido? | Por quê                                                                                                                                |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint`                | sim     | O "linter": procura padrões de código problemáticos.                                                                                  |
| `eslint-plugin-astro`   | sim     | Ensina o ESLint a ler arquivos `.astro`.                                                                                              |
| `eslint-plugin-svelte`  | **não** | Não existe nenhum arquivo `.svelte` no projeto (o Sveltia CMS é carregado pronto, por CDN), então não foi instalado.                   |
| `prettier`              | sim     | O formatador: padroniza espaços, quebras de linha, aspas.                                                                             |
| `prettier-plugin-astro` | sim     | Ensina o Prettier a formatar `.astro`.                                                                                                |
| `knip`                  | sim     | Encontra arquivos, exports e dependências que ninguém usa.                                                                           |
| `@astrojs/check`        | sim     | Motor do `astro check` (checagem de tipos TypeScript em `.astro` e `.ts`).                                                           |
| `typescript`            | extra   | Exigido pelo `@astrojs/check` (é uma *peer dependency*: sem ele o `astro check` não roda).                                            |
| `@eslint/js`            | extra   | Fornece o conjunto de regras "recomendadas" de JavaScript. Desde o ESLint 9 ele vem separado.                                         |
| `typescript-eslint`     | extra   | Permite ao ESLint entender a sintaxe TypeScript (`: string`, `as Tipo`…). Sem ele, o ESLint dá erro de sintaxe em todo arquivo `.ts`. |
| `globals`               | extra   | Lista de variáveis globais (`window`, `document`, `process`…), para o ESLint não acusar "variável não definida".                     |

### Arquivos de configuração criados

**`eslint.config.js`** — formato "flat config" (padrão desde o ESLint 9): um array de camadas.

1. `ignores`: pula `dist/`, `.astro/`, `node_modules/`, `.wrangler/` (arquivos gerados).
2. `js.configs.recommended`: regras básicas de JS (ex.: `no-unused-vars`).
3. `tseslint.configs.recommended`: regras básicas de TS **sem** checagem de tipos (isso é trabalho do `astro check`; evitamos duplicar).
4. `astro.configs.recommended`: parser e regras de `.astro`.
5. `globals.browser` + `globals.node`: o projeto tem código que roda no navegador (scripts dos componentes) e no Node (testes, `scripts/demo-admin.mjs`).

**`.prettierrc.json`** — três opções:

- `plugins: ["prettier-plugin-astro"]`: ativa o suporte a `.astro`.
- `singleQuote: true` e `printWidth: 120`: **não são o padrão do Prettier**, mas espelham o estilo que o
  código já usa (aspas simples, linhas longas). Com o padrão puro, o Prettier acusava 102 arquivos — ou
  seja, ruído. Com o estilo do próprio projeto, sobram 54, que são inconsistências *de verdade*.

**`.prettierignore`** — pastas geradas, o `package-lock.json` (gerado pelo npm) e a pasta `relatorios/`.

**`knip.json`** — o Knip detecta sozinho Astro, Vitest e TypeScript (pelos plugins internos). Só foi
preciso dizer que `scripts/*.mjs` também é ponto de entrada (é chamado pelo `npm run build`, que o Knip
não interpreta como import).

### O script `auditoria`

```json
"auditoria": "astro check ; eslint . ; prettier --check . ; knip ; npm audit ; npm outdated"
```

Os comandos são separados por `;` (e não `&&`) de propósito: cada ferramenta "falha" quando acha
problemas, e com `&&` a primeira falha interromperia as outras. Com `;` todas rodam sempre.
⚠️ `;` funciona em shells tipo bash (Linux, macOS, Git Bash/WSL no Windows). No `cmd.exe` puro do
Windows, não funciona.

---

## 3. Problemas por ferramenta e gravidade

### 🔴 CRÍTICO

#### 3.1 `npm audit` — vulnerabilidades conhecidas nas dependências

**O que significa:** o npm compara as versões instaladas com um banco público de falhas de segurança
(GitHub Advisories). Resultado: **15 vulnerabilidades (3 críticas, 10 altas, 1 moderada, 1 baixa)**.

**Por que importa:** são falhas *publicadas* — qualquer pessoa sabe que existem. Elas se dividem em dois grupos
com riscos bem diferentes:

| Pacote (como entra no projeto)                       | Gravidade | Afeta o site publicado?                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `astro` 5.18.2 (dependência direta)                   | crítica   | **Parcialmente.** São 13 avisos, muitos de XSS ao gerar HTML (ex.: `define:vars`, atributos via spread, nomes de slot). Como o site é 100% estático, vários (SSRF, server islands, `@astrojs/node`) não se aplicam, mas os de geração de HTML sim — e o conteúdo vem de um CMS editável. |
| `zod`, `sharp`, `esbuild`, `devalue`, `svgo`, `postcss`, `nanoid`, `js-yaml`, `source-map-js`, `vite` (dentro do astro) | alta      | Na maior parte, só no momento do **build** ou do `npm run dev`. Ex.: `vite`/`esbuild` só importam com o servidor de desenvolvimento aberto.                                                                                                                                  |
| `vitest` 3 → `tinypool`, `@vitest/mocker`             | crítica   | **Não** — só roda nos testes, na sua máquina. Risco baixo na prática, mas a classificação é crítica.                                                                                                                                                                                                                  |
| `js-yaml` 5.2.1 (dependência direta, usada nos testes) | alta     | Não — só nos testes.                                                                                                                                                                                                                                                                                                  |

**Exemplo do aviso:**

```
astro  <=7.4.6
Severity: critical
Astro: XSS in define:vars via incomplete </script> tag sanitization
Astro: XSS via Unescaped Attribute Names in Spread Props
...
fix available via `npm audit fix --force`
Will install astro@7.4.13, which is a breaking change
```

**Ponto positivo encontrado:** o projeto já se protege no lugar mais sensível. Em
`src/components/CartDrawer.astro:36` o JSON vindo do CMS é escapado antes de ir para um `<script>`:

```ts
const catalogoJson = JSON.stringify(catalogo).replace(/</g, '\\u003c');
```

Isso impede que um nome de produto como `</script><script>alert(1)` quebre a página.

**Como resolver (quando for corrigir):** `npm audit fix` resolve os itens "sem breaking change"
(devalue, js-yaml, nanoid, postcss, svgo, source-map-js, vite). O `astro` e o `vitest` exigem subir
de versão *major* — ver 3.2.

---

### 🟠 IMPORTANTE

#### 3.2 `npm outdated` — dependências desatualizadas

**O que significa:**

| Pacote       | Instalado | "Wanted" (máx. que o `^` do package.json permite) | Mais recente |
| ------------ | --------- | -------------------------------------------------- | ------------ |
| `astro`      | 5.18.2    | 5.18.2                                             | **7.4.13**   |
| `vitest`     | 3.2.7     | 3.2.7                                              | **5.1.1**    |
| `typescript` | 5.9.3     | 5.9.3                                              | 7.0.2        |
| `js-yaml`    | 5.2.1     | 5.5.0                                              | 5.5.0        |

- **Wanted = Latest** (`js-yaml`): atualização simples, `npm update` resolve.
- **Wanted ≠ Latest** (`astro`, `vitest`, `typescript`): o `^5.14.1` só aceita versões 5.x. Ir para 7.x
  é uma *major*, que por definição (SemVer) pode quebrar coisas.

**Por que importa:** quanto mais versões *major* se acumulam, mais caro fica pular. O Astro 5 já não
recebe as correções de segurança da seção 3.1. Duas majors de uma vez exigem ler dois guias de migração.

**Exemplo do código afetado** (`package.json`):

```json
"dependencies": {
  "astro": "^5.14.1"
}
```

> O `typescript` 5.9.3 foi instalado nesta auditoria, na versão compatível com o `@astrojs/check`;
> não é dívida antiga do projeto.

#### 3.3 `astro check` — 60 erros de tipo (com uma causa só)

**O que significa:** o `astro check` roda o compilador TypeScript em modo estrito (`astro/tsconfigs/strict`)
sobre todo o projeto, **incluindo a pasta `tests/`** (porque o `tsconfig.json` inclui `"**/*"`). Os erros:

| Código TS | Quantidade | Mensagem                                                     |
| --------- | ---------- | ------------------------------------------------------------ |
| `ts(2307)` | 26        | `Cannot find module 'node:fs'` (ou `node:path`, `node:os`)    |
| `ts(2580)` | 26        | `Cannot find name 'process'`                                  |
| `ts(7006)` | 8         | `Parameter 'e' implicitly has an 'any' type`                  |

**Todos os 60 estão em `tests/`** e todos vêm da **mesma raiz**: o pacote `@types/node` (as "definições de
tipo" do Node.js) não está instalado. Sem ele, o TypeScript não sabe o que é `process` nem `node:fs`. Os
8 erros `ts(7006)` são efeito colateral: como `readdirSync` ficou sem tipo, o parâmetro do `.filter()`
também ficou.

**Por que importa:** os testes *rodam* (o Vitest não checa tipos), então nada quebra hoje. Mas:

1. o `astro check` fica permanentemente "vermelho", e um erro **novo e real** se esconde entre 60 falsos;
2. o editor não oferece autocompletar/checagem nos testes.

**Exemplo** (`tests/produtos-structure.test.ts:2-24`):

```ts
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'; // ts(2307)
const entriesDir = join(process.cwd(), 'src/content/produtos');             // ts(2580)
const imagens = entradas.filter((e) => IMG.test(e));                        // ts(7006) — "e" ficou any
```

**Como resolver:** `npm i -D @types/node` deve zerar os 60 de uma vez.

**Hints (2) — falso positivo.** Em `src/layouts/BaseLayout.astro:78`:

```astro
onload="this.onload=null;this.rel='stylesheet'"
```

O TS acha que `onload`/`rel` são variáveis não lidas, mas é o truque padrão para carregar CSS de fontes
sem bloquear a página. Pode ser ignorado.

---

### 🟡 COSMÉTICO

#### 3.4 `knip` — código morto

**O que significa:** o Knip monta o "mapa de imports" a partir dos pontos de entrada (páginas do Astro,
testes, `scripts/`) e lista o que ninguém alcança.

| Tipo                    | Itens                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Arquivo não usado (1)   | `src/pages/_desenvolvedor.astro`                                                                                         |
| Exports não usados (8)  | `DEV_GITHUB_URL`, `DEV_LINKEDIN_URL` (site.ts), `rotuloDia` (rodape-schema.ts), `porId` (menu-helpers.ts), `nextOrderNumber` (order-number.ts), `abrirCarrinho` (product-detail.ts), `CHAVE_TEMA`, `ehTema` (theme.ts) |
| Tipos não usados (10)   | `CategoriaBase`, `EntregaConfigBase`, `CupomBase`, `FornadaConfigBase`, `ProdutoBase`, `DiaSemana`, `CouponType`, `CouponApplied`, `CouponRejected`, `FornadaModo` |
| Export duplicado (1)    | `ACTIVE_THEME` e `THEME_NAME` em `src/config/theme.ts` são o mesmo valor com dois nomes                                    |

**Por que importa:** código morto confunde quem lê ("isto é usado? posso mexer?") e engorda o projeto.
**Mas atenção — aqui vários são intencionais**, e é importante aprender a ler o Knip com senso crítico:

- **`_desenvolvedor.astro` é desativado de propósito.** O Astro ignora páginas com `_` no início, e o
  próprio arquivo explica como reativar. Um teste (`tests/paginas-institucionais.test.ts:127`) garante
  que ele continue existindo. Por consequência, `DEV_GITHUB_URL` e `DEV_LINKEDIN_URL` aparecem como "não
  usados" (só essa página desativada os importa).
- **`nextOrderNumber`** está guardado para uma funcionalidade comentada em `CartDrawer.astro:829`
  (`// import { nextOrderNumber } from '../lib/order-number';`).
- **`porId`, `abrirCarrinho`, `ehTema`, `CHAVE_TEMA`**: são usados *dentro do próprio arquivo*; o que
  sobra é só a palavra `export`. Ex. (`src/lib/product-detail.ts:9`):

  ```ts
  export function abrirCarrinho(): void {   // export desnecessário…
    document.dispatchEvent(new CustomEvent('cd:open-cart'));
  }
  // …porque só é usado logo abaixo, no mesmo arquivo:
  showSnackbar(`${nome} adicionado`, { label: 'Ver', onClick: abrirCarrinho });
  ```

- **Tipos `*Base`** (ex. `ProdutoBase`) são tipos derivados de schemas Zod exportados "por precaução".

**Como resolver:** decidir caso a caso. Para o que é intencional, o melhor é *dizer isso ao Knip*
(ex.: `"ignore": ["src/pages/_desenvolvedor.astro"]` no `knip.json`), para o relatório ficar só com o
que é dívida de verdade.

#### 3.5 `eslint` — 45 avisos de boas práticas

Todos aparecem como `error` porque é assim que as regras "recomendadas" vêm configuradas, mas **nenhum é
um bug** — por isso a classificação cosmético.

**a) `@typescript-eslint/no-explicit-any` — 33 ocorrências, todas em `tests/`**

*O que significa:* usar `any` desliga a checagem de tipo daquela variável.
*Por que importa:* em testes é tolerável (estão lendo YAML/JSON sem formato fixo), mas um `any` "vaza":
tudo que deriva dele também perde tipo.
*Exemplo* (`tests/categoria-cor.test.ts:63-64`):

```ts
const config = load(readFileSync(join(process.cwd(), 'public/admin/config.yml'), 'utf8')) as any;
const cats = config.collections.find((c: any) => c.name === 'categorias');
```

*Alternativa comum:* `unknown` + validação, ou desligar a regra só para `tests/` na config do ESLint.

**b) `@typescript-eslint/no-unused-vars` — 11 ocorrências**

*Caso 1 — `catch (e)` sem usar o `e`* (3×: `src/lib/cart-store.ts:29` e `:41`, `src/lib/theme.ts:102`):

```ts
} catch (e) {
  /* localStorage indisponivel ou JSON invalido: comeca vazio */
}
```

*Por que importa:* pouco. Desde o ES2019 dá para escrever só `catch {`, deixando claro que o erro é
ignorado de propósito.

*Caso 2 — desestruturação para "remover" campos* (8×, `tests/demo-admin.test.ts:24-25`, `tests/menu.test.ts:134,147`):

```ts
const { backend: _a, media_folder: _b, public_folder: _c, ...restoDemo } = demo;
```

*Por que importa:* aqui o padrão é **intencional** (o prefixo `_` já sinaliza isso). É um caso de
*ajustar a regra*, não o código: a opção `varsIgnorePattern: "^_"` da regra resolve. É um bom exemplo
de que linter também precisa de calibragem.

**c) `prefer-const` — 1 ocorrência** (`src/components/CartDrawer.astro:935`)

```ts
let selecionado = { fulfillment: fulfillmentPadrao, payment: 'pix' as Payment };
```

*O que significa:* a variável nunca é *reatribuída* (só as propriedades do objeto mudam), então pode ser
`const`. *Por que importa:* `const` comunica ao leitor "este nome sempre aponta para o mesmo objeto".
É o único item que o `eslint --fix` corrige sozinho.

#### 3.6 `prettier --check` — 54 arquivos fora do padrão

**O que significa:** o Prettier reformataria esses arquivos. Distribuição:

| Pasta            | Arquivos |
| ---------------- | -------- |
| `src/components` | 16       |
| `tests`          | 13       |
| documentação (`README.md`, `CHANGELOG.md`, `docs/*`) | 7 |
| `src/pages`      | 5        |
| `src/content`    | 4        |
| `src/styles`     | 3        |
| `src/lib`        | 2        |
| `src/config`, `src/layouts`, `public/admin/config.yml`, `wrangler.jsonc` | 1 cada |

**Por que importa:** formatação não muda o comportamento. O custo real aparece no futuro: se cada editor
formata de um jeito, os *diffs* do Git ficam cheios de mudanças de espaço, escondendo a mudança que
importa.

**Exemplo** (`src/components/Header.astro`) — o Prettier quebraria o `<svg>` de 180+ caracteres em várias
linhas:

```astro
<!-- hoje -->
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<!-- depois do prettier --write -->
<svg
  width="22"
  height="22"
  ...
```

**Dica ao corrigir:** faça `prettier --write .` num **commit separado e só com isso**, para não misturar
"mudou formatação" com "mudou lógica".

---

## 4. Lista priorizada do que corrigir primeiro

| #  | O quê                                                                                    | Por que nesta posição                                                            | Esforço        |
| -- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------- |
| 1  | `npm audit fix` (sem `--force`)                                                          | Resolve várias vulnerabilidades altas sem breaking change. Rodar os testes depois. | 5 min          |
| 2  | Atualizar **Astro 5 → 7** (seguindo os guias de migração 5→6 e 6→7)                       | Fecha as vulnerabilidades críticas que afetam o HTML gerado. É o maior risco real. | horas          |
| 3  | `npm i -D @types/node`                                                                   | Zera os 60 erros do `astro check` de uma vez; volta a ser um alarme útil.          | 2 min          |
| 4  | Atualizar **Vitest 3 → 5**                                                               | Vulnerabilidades críticas, mas só no ambiente de teste.                           | 30 min – 1 h   |
| 5  | Calibrar as ferramentas: `varsIgnorePattern: "^_"` no ESLint; marcar no Knip o que é intencional (`_desenvolvedor.astro`, `nextOrderNumber`) | Tira ruído; o relatório passa a mostrar só dívida real. | 15 min |
| 6  | Pequenos ajustes de ESLint: `catch {` (3×), `prefer-const` (1×), remover `export` que sobram (Knip) | Limpeza rápida e de baixo risco.                                                  | 15 min         |
| 7  | Decidir sobre os `any` dos testes (tipar ou desligar a regra em `tests/`)                 | Melhora o editor nos testes; nenhum impacto no site.                              | 30 min         |
| 8  | `prettier --write .` em commit separado                                                   | Puramente estético; fazer por último evita conflitos com as mudanças acima.        | 5 min          |
| 9  | (Opcional) Rodar `npm run auditoria` no CI (GitHub Actions)                               | Evita que a dívida volte a crescer sem ninguém perceber.                          | 30 min         |

---

## Apêndice — saída bruta resumida

<details>
<summary>astro check (final)</summary>

```
Result (90 files):
- 60 errors
- 0 warnings
- 2 hints
```

Todos os 60 erros: `tests/*.test.ts` — `ts(2307)` Cannot find module 'node:fs'/'node:path'/'node:os';
`ts(2580)` Cannot find name 'process'; `ts(7006)` Parameter implicitly has an 'any' type.

</details>

<details>
<summary>eslint</summary>

```
src/components/CartDrawer.astro
  935:9   error  'selecionado' is never reassigned. Use 'const' instead  prefer-const
src/lib/cart-store.ts
  29:12   error  'e' is defined but never used  @typescript-eslint/no-unused-vars
  41:12   error  'e' is defined but never used  @typescript-eslint/no-unused-vars
src/lib/theme.ts
  102:12  error  'e' is defined but never used  @typescript-eslint/no-unused-vars
tests/categoria-cor.test.ts      4x no-explicit-any
tests/cms-config.test.ts        16x no-explicit-any
tests/demo-admin.test.ts         3x no-explicit-any, 6x no-unused-vars (_a.._f)
tests/menu.test.ts               2x no-unused-vars (disponivel, nome)
tests/redesign-ui.test.ts        1x no-explicit-any
tests/rodape.test.ts             9x no-explicit-any

✖ 45 problems (45 errors, 0 warnings)
  1 error and 0 warnings potentially fixable with the `--fix` option.
```

</details>

<details>
<summary>knip</summary>

```
Unused files (1)
src/pages/_desenvolvedor.astro
Unused exports (8)
DEV_GITHUB_URL              src/config/site.ts:76:14
DEV_LINKEDIN_URL            src/config/site.ts:77:14
rotuloDia         function  src/content/rodape-schema.ts:58:17
porId             function  src/data/menu-helpers.ts:63:17
nextOrderNumber   function  src/lib/order-number.ts:35:17
abrirCarrinho     function  src/lib/product-detail.ts:9:17
CHAVE_TEMA                  src/lib/theme.ts:20:14
ehTema            function  src/lib/theme.ts:23:17
Unused exported types (10)
CategoriaBase      type       src/content/categoria-schema.ts:23:13
EntregaConfigBase  type       src/content/configuracoes-schema.ts:21:13
CupomBase          type       src/content/cupom-schema.ts:34:13
FornadaConfigBase  type       src/content/fornada-schema.ts:35:13
ProdutoBase        type       src/content/produto-schema.ts:32:13
DiaSemana          type       src/content/rodape-schema.ts:41:13
CouponType         type       src/lib/coupon.ts:4:13
CouponApplied      interface  src/lib/coupon.ts:20:18
CouponRejected     interface  src/lib/coupon.ts:28:18
FornadaModo        type       src/lib/fornada-banner.ts:8:13
Duplicate exports (1)
ACTIVE_THEME|THEME_NAME  src/config/theme.ts
```

</details>

<details>
<summary>npm audit (resumo)</summary>

```
@vitest/mocker <=4.1.11   moderate  (via vitest)
astro          <=7.4.6    critical  13 advisories (XSS, SSRF, RCE em AVIF, ...)
devalue        <=5.9.2    high
esbuild        0.27.3-0.28.0        (dev server no Windows)
js-yaml        5.0.0-5.4.0 high
nanoid         <=3.3.17   high
postcss        <=8.5.22   high
sharp          <=0.35.5-rc.1 high
source-map-js  1.0.0-1.2.1 high
svgo           4.0.0-4.0.2 high
tinypool       <=2.1.1    critical  (via vitest)
vite           <=6.4.3    high
zod            <4.6.6     high      (via astro)

15 vulnerabilities (1 low, 1 moderate, 10 high, 3 critical)
```

</details>

<details>
<summary>npm outdated</summary>

```
Package     Current  Wanted  Latest
astro        5.18.2  5.18.2  7.4.13
js-yaml       5.2.1   5.5.0   5.5.0
typescript    5.9.3   5.9.3   7.0.2
vitest        3.2.7   3.2.7   5.1.1
```

</details>
