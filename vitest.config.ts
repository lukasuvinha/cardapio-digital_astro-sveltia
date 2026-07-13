/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

// Usamos getViteConfig do Astro para que os testes consigam importar e
// renderizar componentes .astro (via Container API). Os utilitarios TS puros
// continuam rodando normalmente.
export default getViteConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
  },
});
