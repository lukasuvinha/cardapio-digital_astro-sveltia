// Utilitarios de formatacao reutilizaveis em todo o projeto.

/**
 * Formata um valor numerico em reais no padrao brasileiro.
 * Ex.: 14 -> "R$ 14,00" | 4.5 -> "R$ 4,50"
 *
 * Mantido identico ao helper usado nos designs preliminares para preservar
 * consistencia visual dos precos.
 */
export function formatPrice(value: number): string {
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}
