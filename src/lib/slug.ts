// Utilitario reutilizavel: transforma um texto em slug seguro para ids/ancoras.
// Ex.: "Bolo de Pote" -> "bolo-de-pote"
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (marcas combinantes)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
