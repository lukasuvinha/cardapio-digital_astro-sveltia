// ESLint "flat config" (formato padrao desde o ESLint 9).
// Cada item do array e uma camada de regras; as de baixo sobrescrevem as de cima.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  // Pastas geradas ou de terceiros: nao faz sentido analisar.
  { ignores: ['dist/', '.astro/', 'node_modules/', '.wrangler/'] },

  // Regras recomendadas de JavaScript (erros comuns: variavel nao usada, etc.).
  js.configs.recommended,

  // Regras recomendadas de TypeScript (sem checagem de tipos — essa e do astro check).
  ...tseslint.configs.recommended,

  // Regras recomendadas para arquivos .astro (inclui o parser de .astro).
  ...astro.configs.recommended,

  // O codigo roda tanto no navegador (scripts do cliente) quanto no Node (build/testes).
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
];
