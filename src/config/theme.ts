// Partes do tema que vivem no HTML (e nao no CSS), lidas pelo BaseLayout.
// O resto do tema (cores, fontes, raios, sombras, movimento) fica nos
// arquivos de src/styles/ — veja o comentario no topo de
// src/styles/theme.css para criar um tema novo.
//
// TROCAR DE TEMA: mude ACTIVE_THEME abaixo. O BaseLayout marca
// <html data-ui-theme="..."> e carrega as fontes e o theme-color do tema.
//
// As cores da barra do navegador DEVEM bater com --hero (modo claro e modo
// escuro) do tema; tests/theme.test.ts confere isso para cada tema.

export interface ThemeConfig {
  /** Folha de estilo das fontes usadas em --font-head e --font-body. */
  fontsUrl: string;
  /** Cor da barra do navegador no celular (meta theme-color) = --hero claro. */
  colorLight: string;
  /** Idem no modo escuro = --hero escuro. */
  colorDark: string;
  /** Arquivo CSS do tema (so para documentacao e para o teste). */
  css: string;
}

export const THEMES = {
  // Padrao: Material You (Material 3), paleta quente de confeitaria.
  material: {
    fontsUrl:
      'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap',
    colorLight: '#FFD9DF',
    colorDark: '#3E1821',
    css: 'src/styles/theme.css',
  },
  // Alternativo: o visual anterior (verde, dourado e creme).
  confeitaria: {
    fontsUrl:
      'https://fonts.googleapis.com/css2?family=Yeseva+One&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
    colorLight: '#1F4D3A',
    colorDark: '#142A1F',
    css: 'src/styles/theme-confeitaria.css',
  },
} satisfies Record<string, ThemeConfig>;

export type ThemeName = keyof typeof THEMES;

/** Tema ativo do site inteiro. */
export const ACTIVE_THEME: ThemeName = 'material';

const ativo: ThemeConfig = THEMES[ACTIVE_THEME];

export const THEME_NAME: ThemeName = ACTIVE_THEME;
export const THEME_FONTS_URL = ativo.fontsUrl;
export const THEME_COLOR_LIGHT = ativo.colorLight;
export const THEME_COLOR_DARK = ativo.colorDark;
