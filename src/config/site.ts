// Configuracoes do site (dados publicos, nao sao segredos).
//
// IMPORTANTE: o numero do WhatsApp NAO e um segredo — ele e publico por
// natureza (o cliente precisa dele para mandar mensagem). Por isso pode ficar
// aqui no build estatico sem problema. Basta trocar o valor abaixo pelo numero
// real da Nina, no formato internacional, SO DIGITOS: 55 + DDD + numero.
// Ex.: (11) 91234-5678  ->  '5511912345678'
export const WHATSAPP_NUMBER = '5511999999999'; // numero de destino do pedido (WhatsApp da Nina)

export const SITE_NAME = 'Doçuras da Nina';
export const SITE_TAGLINE = 'Doceria Artesanal';

// ---------------------------------------------------------------------------
// Pagina "Contato" (/contato) — link do Instagram da Nina.
// Passo a passo em docs/PAGINAS-INSTITUCIONAIS.md.
export const INSTAGRAM_URL = 'https://www.instagram.com/seu_usuario';

// ---------------------------------------------------------------------------
// Pagina "Desenvolvedor" (/desenvolvedor) — alcancada por um link discreto no
// fim da pagina de Contato. Dados publicos de quem desenvolveu o site.
// Troque pelos seus dados (ou apague a secao se nao quiser assinar o template).
export const DEV_NAME = 'Seu Nome';
export const DEV_GITHUB_URL = 'https://github.com/seu_usuario';
export const DEV_LINKEDIN_URL = 'https://www.linkedin.com/in/seu_usuario/';
