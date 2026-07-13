// Logica pura de cupons de desconto (sem DOM), para ser facilmente testavel.
// Roda tambem no navegador (validacao do cupom no carrinho).

export type CouponType = 'percentual' | 'valor_fixo';

export interface Coupon {
  codigo: string;
  tipo: CouponType;
  /** percentual: 0-100 (ex.: 10 = 10%). valor_fixo: reais (ex.: 5 = R$ 5,00). */
  valor: number;
  /** data de validade inclusiva, 'YYYY-MM-DD' (valido ate o fim desse dia). */
  validade: string;
  /** hora exata de expiracao (opcional), 'HH:mm'. Se ausente, vale ate o fim
   *  do dia da validade (23:59:59). Se presente, expira nesse horario. */
  hora?: string;
}

export type CouponError = 'vazio' | 'inexistente' | 'expirado' | 'ja_usado';

export interface CouponApplied {
  ok: true;
  coupon: Coupon;
  /** desconto em reais, >= 0 e nunca maior que o subtotal */
  desconto: number;
  /** subtotal - desconto, nunca negativo */
  total: number;
}
export interface CouponRejected {
  ok: false;
  motivo: CouponError;
}
export type CouponResult = CouponApplied | CouponRejected;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const norm = (s: string) => (s || '').trim().toUpperCase();

/** Calcula o desconto em reais para um cupom sobre um subtotal. */
export function computeDesconto(coupon: Coupon, subtotal: number): number {
  const bruto =
    coupon.tipo === 'percentual' ? subtotal * (coupon.valor / 100) : coupon.valor;
  // nunca menor que 0 nem maior que o proprio subtotal
  return round2(Math.max(0, Math.min(bruto, subtotal)));
}

/** Normaliza uma hora 'H:mm' / 'HH:mm' / 'HH:mm:ss' para 'HH:mm:ss'. */
function horaCompleta(h: string): string | null {
  const m = String(h).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const hh = m[1].padStart(2, '0');
  return `${hh}:${m[2]}:${m[3] ?? '00'}`;
}

/**
 * true se o cupom ja passou da validade.
 * Sem `hora`: vale ate o FIM do dia da validade (23:59:59).
 * Com `hora` (HH:mm): expira exatamente naquele horario do dia da validade.
 */
export function isExpired(coupon: Coupon, now: Date = new Date()): boolean {
  if (!coupon.validade) return false; // sem validade definida = nao expira
  // usa so a parte da data (YYYY-MM-DD), mesmo se vier com horario/fuso.
  const dia = String(coupon.validade).slice(0, 10);
  const hora = (coupon.hora && horaCompleta(coupon.hora)) || '23:59:59';
  const fim = new Date(`${dia}T${hora}`);
  if (Number.isNaN(fim.getTime())) return false; // data invalida: nao trava
  return now.getTime() > fim.getTime();
}

/** Encontra um cupom pelo codigo (case-insensitive, ignora espacos). */
export function findCoupon(cupons: Coupon[], codigo: string): Coupon | undefined {
  const alvo = norm(codigo);
  return cupons.find((c) => norm(c.codigo) === alvo);
}

/**
 * Valida e aplica um cupom sobre um subtotal.
 * Retorna { ok:true, desconto, total } ou { ok:false, motivo } — nunca lanca,
 * para NAO travar a finalizacao do pedido.
 */
export function applyCoupon(
  cupons: Coupon[],
  codigoInput: string,
  subtotal: number,
  now: Date = new Date(),
  jaUsados: string[] = [],
): CouponResult {
  const codigo = norm(codigoInput);
  if (!codigo) return { ok: false, motivo: 'vazio' };

  const coupon = findCoupon(cupons, codigo);
  if (!coupon) return { ok: false, motivo: 'inexistente' };
  // ja usado neste navegador tem prioridade sobre "expirado" (mensagem mais util)
  if (jaUsados.some((c) => norm(c) === codigo)) return { ok: false, motivo: 'ja_usado' };
  if (isExpired(coupon, now)) return { ok: false, motivo: 'expirado' };

  const desconto = computeDesconto(coupon, subtotal);
  return { ok: true, coupon, desconto, total: round2(subtotal - desconto) };
}

/** Mensagem amigavel para cada motivo de recusa. */
export function couponErrorMessage(motivo: CouponError): string {
  switch (motivo) {
    case 'vazio':
      return 'Digite um código de cupom.';
    case 'expirado':
      return 'Este cupom está expirado.';
    case 'ja_usado':
      return 'Você já usou este cupom.';
    case 'inexistente':
    default:
      return 'Cupom inválido ou não encontrado.';
  }
}
