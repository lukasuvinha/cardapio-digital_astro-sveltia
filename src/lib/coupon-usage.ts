// Registro (no NAVEGADOR) de cupons que o cliente ja usou, para bloquear reuso.
//
// LIMITE IMPORTANTE: o site e 100% estatico, sem servidor/banco. Entao o
// "ja usou" fica guardado no localStorage DESTE navegador. Isso impede o mesmo
// aparelho de reaplicar o cupom, mas nao impede a pessoa de trocar de aparelho
// ou limpar o navegador. Para um controle de uso realmente unico seria preciso
// um backend (fora do escopo atual). Ver docs/CUPONS-E-PEDIDOS.md.

const KEY = 'dn-cupons-usados';

const norm = (s: string) => (s || '').trim().toUpperCase();

/** Lista de codigos de cupom ja usados neste navegador (normalizados). */
export function getCuponsUsados(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map((c) => norm(String(c))) : [];
  } catch {
    return []; // localStorage indisponivel: nao trava, so nao lembra
  }
}

/** Marca um cupom como usado neste navegador (idempotente). */
export function marcarCupomUsado(codigo: string): void {
  const alvo = norm(codigo);
  if (!alvo) return;
  try {
    const atual = new Set(getCuponsUsados());
    atual.add(alvo);
    localStorage.setItem(KEY, JSON.stringify([...atual]));
  } catch {
    /* localStorage indisponivel: ignora silenciosamente */
  }
}
