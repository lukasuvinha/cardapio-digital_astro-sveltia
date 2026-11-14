// Identidade da loja: TUDO o que muda de uma loja para outra fica aqui.
// O restante do codigo (layout, cabecalho, rodape, paginas, mensagem do
// WhatsApp, numero do pedido) le estes valores — nao ha nome de loja escrito
// direto nos componentes.
//
// Os valores abaixo sao de uma loja FICTICIA ("Doceria Exemplo"), usada como
// demonstracao do template. Troque todos ao adaptar para uma loja real.
// (A aparencia — cores e fontes — fica no tema: src/styles/theme.css.)

// ---------------------------------------------------------------------------
// Nome e textos da marca

/** Nome da loja: cabecalho, rodape, titulo das paginas, mensagem do WhatsApp. */
export const SITE_NAME = 'Doceria Exemplo';

/** Slogan curto, ao lado do nome no cabecalho e no rodape. */
export const SITE_TAGLINE = 'Doceria Artesanal';

/** Descricao para buscadores e para o preview de links (meta description). */
export const SITE_DESCRIPTION =
  'Cardápio da Doceria Exemplo: brownies, brigadeiros, bolos de pote e cookies artesanais. Peça pelo WhatsApp.';

/** Subtitulo do bloco do topo do cardapio (aparece no desktop, abaixo de "Cardápio"). */
export const MENU_SUBTITLE =
  'Doces artesanais feitos em pequenas fornadas. Monte seu pedido e envie pelo WhatsApp.';

/** Logo da loja (selo redondo da pagina 404). Caminho em public/. */
export const SITE_LOGO = '/logo.svg';

/** Imagem de preview ao compartilhar o link (1200x630). Caminho em public/. */
export const SITE_OG_IMAGE = '/og-image.png';

// ---------------------------------------------------------------------------
// Contato
//
// IMPORTANTE: o numero do WhatsApp NAO e um segredo — ele e publico por
// natureza (o cliente precisa dele para mandar mensagem). Formato
// internacional, SO DIGITOS: 55 + DDD + numero.
// Ex.: (11) 91234-5678  ->  '5511912345678'
export const WHATSAPP_NUMBER = '5511999999999'; // numero que recebe os pedidos

// Pagina "Contato" (/contato). Passo a passo em docs/PAGINAS-INSTITUCIONAIS.md.
export const INSTAGRAM_URL = 'https://www.instagram.com/seu_usuario';

// ---------------------------------------------------------------------------
// Pedido pelo WhatsApp

/** Primeira linha (em negrito) da mensagem do pedido enviada pelo WhatsApp. */
export const WHATSAPP_ORDER_TITLE = `Novo pedido — ${SITE_NAME}`;

/** Prefixo do numero do pedido (ex.: "DE" gera "DE1234"). Use 1 a 4 letras. */
export const ORDER_PREFIX = 'DE';

// ---------------------------------------------------------------------------
// Pagina "Desenvolvedor" (/desenvolvedor) — alcancada por um link discreto no
// fim da pagina de Contato. Dados publicos de quem desenvolveu o site.
// Troque pelos seus dados (ou apague a secao se nao quiser assinar o template).
export const DEV_NAME = 'Seu Nome';
export const DEV_GITHUB_URL = 'https://github.com/seu_usuario';
export const DEV_LINKEDIN_URL = 'https://www.linkedin.com/in/seu_usuario/';
