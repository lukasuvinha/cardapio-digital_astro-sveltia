# Bugs e correções — Doçuras da Nina

Registro dos problemas encontrados ao longo do projeto e como cada um foi
resolvido. A maioria apareceu **em produção** (o CMS só dá para testar de verdade
no ar), então cada correção veio junto de uma blindagem para não repetir.

---

## 1. Build quebrava por causa das fotos (`image()` do Astro) — 3 incidentes

**Sintoma:** o deploy falhava sempre que a Nina subia uma foto pelo CMS.

**Causa:** as fotos passavam pelo `image()`/`<Picture>` do Astro, que otimiza a
imagem **no build**. Se qualquer imagem não resolvesse (caminho, formato estranho,
HEIC de iPhone etc.), o `image()` **falha o build inteiro** — e o site saía do ar.

**Correção:**
- A foto virou uma **string de URL pública** (`/uploads/foo.webp`), servida direto
  de `/public`. O build **nunca** processa a imagem, então um upload ruim não tem
  como quebrar o deploy.
- A otimização (WebP + resize) passou a acontecer **no navegador, no upload**, pelo
  próprio Sveltia (`media_libraries.transformations` no `config.yml`).
- O widget de imagem só aceita `image/jpeg|png|webp` (bloqueia HEIC etc.).

**Blindagem:** `tests/produtos-structure.test.ts` — guarda de regressão que falha se
alguma foto voltar a apontar para `/src/...` ou usar formato não suportado, e
garante entradas planas (sem subpastas/imagens dentro de `src/content/produtos`).

**Onde ver:** `src/components/ProductImage.astro`, `src/content/produto-schema.ts`,
`public/admin/config.yml`.

---

## 2. Painel do CMS fora do ar: "The configuration file could not be parsed"

**Sintoma:** depois de adicionar a collection de cupons, o painel inteiro parou de
abrir com "The configuration file could not be parsed".

**Causa:** o campo `tipo` do cupom tinha uma **lista em bloco** (`options:` com `-`)
**dentro de um mapping em fluxo** `{ ... }` no `config.yml`. Isso é **YAML inválido**
(`Block collections are not allowed within flow collections`), e um único campo
inválido derruba o parse do arquivo **inteiro**.

**Correção:** o campo `tipo` foi reescrito em **estilo bloco** (sem as chaves `{ }`),
o que torna a lista de `options` válida.

**Blindagem:** comentário no `config.yml` avisando do risco; correção validada com
dois parsers YAML (js-yaml e o `eemeli/yaml`, que é o que o Sveltia usa).

---

## 3. Painel do CMS: "The deprecated Date field type is not supported"

**Sintoma:** resolvido o item 2, o painel passou a recusar o campo `validade` do
cupom.

**Causa:** o widget `date` foi **removido** no Sveltia CMS 0.10 / Decap 3.0.

**Correção:** `validade` passou a usar `widget: datetime` com `type: date` e
`format: "YYYY-MM-DD"` (data pura, gravada como string `YYYY-MM-DD`).

**Blindagem (defesa em profundidade):** como só dá para testar em produção, o código
tolera qualquer forma que o CMS venha a gravar a data:
- `cupom-schema` normaliza a validade para os 10 primeiros caracteres
  (`YYYY-MM-DD`), seja `Date`, string ISO com horário/fuso, ou já pronta.
- `coupon.isExpired` usa só a parte da data.
- Testes em `tests/cupom-schema.test.ts` cobrem os dois formatos.

---

## 4. Linha de desconto "fantasma" no carrinho

**Sintoma:** sem cupom aplicado, aparecia uma linha "Desconto −R$ 0,00".

**Causa:** o atributo `[hidden]` das linhas de desconto era **vencido** pelo
`display:flex` das classes (`.dn-drawer__line` / `.dn-summary__row`), então o
elemento "escondido" continuava visível.

**Correção:** regra `[hidden] { display: none }` mais específica para essas classes.

**Onde ver:** `src/components/CartDrawer.astro`. Descoberto em verificação no
navegador real, não pelos testes.

---

## 5. Guarda de produtos falhava com produto sem foto

**Sintoma:** teste `produtos-structure` falhava depois que a Nina cadastrou um
produto **sem foto** (`foto: ''`).

**Causa:** a guarda exigia que todo campo `foto` fosse uma URL começando com `/`,
sem tratar o caso legítimo de foto vazia.

**Correção:** a guarda passou a tratar `foto: ''` como "produto sem foto"
(permitido), pulando a verificação de URL. Não enfraquece a proteção contra
caminhos inválidos.

---

## 6. Placeholder "Foto em breve" vazando através da foto (produto esgotado)

**Sintoma:** em produto **esgotado com foto**, o texto "Foto em breve" aparecia por
baixo da imagem.

**Causa:** para esmaecer o produto esgotado, a foto recebia `opacity: 0.72`. Como o
placeholder fica **atrás** da imagem, a opacidade deixava ele **vazar** através da
foto (28%).

**Correção:** a foto do produto esgotado passou a ser esmaecida com **`filter`**
(`saturate`/`brightness`) em vez de `opacity`. Com `filter` a imagem continua
**opaca**, então o placeholder não vaza; e o selo "Esgotado" (elemento irmão) e o
texto do placeholder (quando não há foto) mantêm contraste total.

**Onde ver:** `src/components/ProductCard.astro`. Descoberto em revisão visual da
fase final.

---

## 7. Hover "grudado" nos botões no celular

**Sintoma:** no mobile, ao tocar em botões (ex.: tema, carrinho, chips de
categoria), o fundo ficava aceso (verde mais claro) **como se o cursor estivesse
sempre ali**. No desktop não acontecia.

**Causa:** telas de toque **mantêm o estado `:hover`** no último elemento tocado
até tocar em outro lugar. Regras como `.dn-header__cart:hover { background: … }`
"grudavam" após o toque.

**Correção:** todas as regras `:hover` que mudam aparência foram envolvidas em
`@media (hover: hover)`, que só se aplica a dispositivos com cursor real (mouse).
No toque, o hover simplesmente não existe.

**Onde ver:** `Header.astro`, `ThemeToggle.astro`, `CategoryNav.astro`,
`ProductCard.astro`, `CartDrawer.astro`, `404.astro`, `produto/[id].astro`.

---

## 8. Painel do CMS recusava salvar o cupom com o campo "Hora" vazio

**Sintoma:** em produção, ao deixar o campo opcional "Hora de expiração" em
branco (para o cupom valer o dia todo), o painel **não deixava salvar** —
mostrava "Use o formato HH:MM, ex.: 14:30" mesmo sem nada digitado.

**Causa:** bug conhecido, herdado do Decap CMS (mesma família do Sveltia):
quando um campo tem `pattern` **e** `required: false`, o painel ainda assim
valida o `pattern` contra o valor vazio — e como o regex antigo
(`^([01]?[0-9]|2[0-3]):[0-5][0-9]$`) não casa com string vazia, o campo
"opcional" virava obrigatório na prática. `required: false` só torna o valor
opcional na hora de checar se o campo foi preenchido; não isenta o `pattern`
de rodar em cima de uma string vazia.

**Correção:** o regex passou a aceitar string vazia também, com uma
alternância no início: `^$|^([01]?[0-9]|2[0-3]):[0-5][0-9]$`. Isso resolve o
bug **na raiz** (sem mudar o comportamento documentado: campo em branco
continua significando "vale o dia todo") — o formato `HH:MM` continua sendo
exigido normalmente quando algo é digitado.

**Blindagem:** `tests/cms-config.test.ts` tem um teste dedicado que aplica o
regex do `pattern` (lido direto do `config.yml`) contra `''`, formatos
válidos e inválidos — falha se alguém tirar o `^$|` sem querer.

**Onde ver:** `public/admin/config.yml`, campo `hora` da collection `cupons`.

---

## 9. Painel fora do ar em produção: "The `accept` option must be a string"

**Sintoma:** o painel parou de abrir (nem a tela de login aparecia), mostrando
"Há um erro na configuração do CMS" com o detalhe **"coleção Produto, campo
`foto`: The `accept` option must be a string"**.

**Causa:** o campo `foto` usava `accept` como **lista**
(`accept: ["image/jpeg", "image/png", "image/webp"]`). O Sveltia espera uma
**string separada por vírgulas**, igual ao atributo `accept` do
`<input type="file">` do HTML.

**O detalhe importante:** essa linha estava assim **desde a integração do CMS** e
funcionava. Ninguém mexeu nela — o painel quebrou sozinho, sem nenhum commit
no repositório. O motivo é que o Sveltia é carregado da CDN **sem versão fixa**
(`https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js`), ou seja, o site sempre
pega a **última versão**. Uma release nova apertou a validação desse campo, e o
que antes passava virou erro fatal de config da noite para o dia.

**Correção:** `accept: "image/jpeg,image/png,image/webp"` (string). A proteção
continua a mesma — segue bloqueando HEIC do iPhone e outros formatos que a
otimização não processa.

**Blindagem:** `tests/cms-config.test.ts` tem um teste que lê o `config.yml`
real e falha se o `accept` voltar a ser uma lista (`typeof === 'string'`).

> ⚠️ **Risco que continua em aberto (decisão do dono do projeto):** enquanto o
> `<script>` de `src/pages/admin/index.astro` apontar para a CDN **sem número
> de versão**, esse tipo de quebra pode acontecer de novo a qualquer momento,
> sem aviso e sem commit. Fixar a versão (ex.:
> `https://unpkg.com/@sveltia/cms@X.Y.Z/dist/sveltia-cms.js`) elimina a
> surpresa, com o custo de precisar atualizar à mão para receber correções.
> **Não fixei um número aqui de propósito:** este ambiente não alcança a CDN
> para conferir qual é a versão boa mais recente, e chutar uma versão que não
> existe derrubaria o painel por completo — pior que o problema original.

---

## Padrão que se repetiu

O CMS **só valida a config no próprio painel** (que roda no navegador, carregando
o Sveltia por CDN) e reporta **um erro de cada vez**. Como o ambiente de
desenvolvimento não alcança essa CDN, a estratégia foi: (1) validar tudo o que dá
localmente (parsers YAML, build, testes), (2) seguir à risca a mensagem de erro do
Sveltia + documentação oficial, e (3) deixar o código **tolerante** a variações,
para um detalhe de serialização não virar incidente.
