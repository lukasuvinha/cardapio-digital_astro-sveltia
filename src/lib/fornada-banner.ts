// Logica pura do banner "Próxima fornada" (sem DOM), testavel com Vitest.
// Quem administra o site configura pelo CMS (collection "fornada", arquivo singleton
// src/content/configuracoes/fornada.json): liga/desliga o banner inteiro,
// escolhe entre uma data exata (com hora opcional) ou o aviso coringa "em
// preparação" para quando ainda não há data definida. Ver
// docs/CUPONS-E-PEDIDOS.md, seção "Próxima fornada".

export type FornadaModo = 'data' | 'em_breve';

export interface FornadaConfigInput {
  banner_habilitado?: boolean;
  modo?: FornadaModo;
  /** 'YYYY-MM-DD' */
  data?: string;
  /** 'HH:mm' */
  hora?: string;
}

export interface FornadaBanner {
  visivel: boolean;
  texto: string;
}

const TEXTO_EM_PREPARACAO = 'Próxima fornada: Em preparação';

// Dias e meses com INICIAL MAIUSCULA de proposito: em portugues a regra
// gramatical e minuscula ("domingo", "agosto"), mas aqui o texto aparece
// depois de "Próxima fornada:" — quase um titulo/rotulo — e a maiuscula
// deixa o banner com um ar mais caprichado. E uma escolha de estilo da
// marca, nao um descuido.
const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Formata 'YYYY-MM-DD' (+ 'HH:mm' opcional) em texto legível, em português
 * (ex.: "sábado, 1 de agosto às 14h30"). Retorna '' se a data for inválida.
 */
export function formatFornadaData(data: string, hora?: string): string {
  // "Thh:mm" sem fuso faz o Date interpretar como HORÁRIO LOCAL, evitando o
  // erro classico de "new Date('YYYY-MM-DD')" cair um dia antes por UTC
  // (mesma tecnica usada em src/lib/coupon.ts, isExpired).
  const d = new Date(`${data}T${hora || '00:00'}`);
  if (Number.isNaN(d.getTime())) return '';
  const dia = DIAS_SEMANA[d.getDay()];
  const mes = MESES[d.getMonth()];
  let texto = `${dia}, ${d.getDate()} de ${mes}`;
  if (hora) {
    const [hh, mm] = hora.split(':');
    texto += ` às ${hh}h${mm}`;
  }
  return texto;
}

/**
 * Deriva o que mostrar no banner a partir da config bruta do CMS. Nunca
 * lança: config inválida/incompleta só faz o banner ficar invisível (ou cair
 * no aviso genérico), nunca quebra o build nem o site.
 */
export function resolveFornadaBanner(raw: FornadaConfigInput | undefined): FornadaBanner {
  if (!raw?.banner_habilitado) {
    return { visivel: false, texto: '' };
  }
  if (raw.modo === 'data' && raw.data) {
    const dataFormatada = formatFornadaData(raw.data, raw.hora);
    if (dataFormatada) {
      return { visivel: true, texto: `Próxima fornada: ${dataFormatada}` };
    }
  }
  // Sem data válida (modo "em_breve", ou modo "data" sem data preenchida
  // ainda): mostra o aviso genérico em vez de esconder o banner ou de
  // mostrar uma data quebrada.
  return { visivel: true, texto: TEXTO_EM_PREPARACAO };
}
