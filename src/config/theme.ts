// Partes do tema que vivem no HTML (e nao no CSS), lidas pelo BaseLayout.
// O resto do tema (cores, fontes, raios, sombras) fica em src/styles/theme.css
// — veja o comentario no topo daquele arquivo para criar um tema novo.
//
// As cores abaixo DEVEM bater com os tokens do theme.css (--brand do modo
// claro e --bg do modo escuro); tests/theme.test.ts confere isso.

export const THEME_NAME = 'confeitaria';

// Folha de estilo das fontes usadas em --font-head e --font-body.
export const THEME_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Yeseva+One&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap';

// Cor da barra do navegador no celular (meta theme-color).
export const THEME_COLOR_LIGHT = '#1F4D3A'; // = --brand (modo claro)
export const THEME_COLOR_DARK = '#0f1d16'; // = --bg (modo escuro)
