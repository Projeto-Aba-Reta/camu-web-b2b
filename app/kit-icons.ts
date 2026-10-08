/**
 * Silhuetas dos objetos que saem de cada caixa (viewBox 24×24, preenchimento evenodd).
 * Viram máscara do `.kbox-shape`, então herdam o degradê e as camadas de impressão do CSS.
 */
const PATHS = {
  // boas-vindas
  cracha:
    "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  caneca:
    "M4 6h13v9a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 8h1.5a3 3 0 0 1 0 6H17v-2h1.5a1 1 0 0 0 0-2H17z",
  chave:
    "M8 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13.4 11H22v4h-2v-2h-2v2h-2v-2h-2.6z",
  // lançamento
  foguete:
    "M12 2c3 2.5 4.5 6 4.5 10l-2 2h-5l-2-2c0-4 1.5-7.5 4.5-10zM12 7.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM7.5 11l-3 5 3 1zM16.5 11l3 5-3 1zM10 15.5h4L12 21z",
  cubo: "M12 2.8L20 7.3 12 11.8 4 7.3zM3.5 8.2l7.8 4.4V21l-7.8-4.4zM20.5 8.2l-7.8 4.4V21l7.8-4.4z",
  estrela: "M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.1l-6.1 3.5 1.4-6.8L2.2 9.1l6.9-.8z",
  // PR box / influenciadores
  video:
    "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM10 9v6l5-3z",
  coracao: "M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z",
  camera:
    "M9 4h6l1.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  // presentes VIP
  trofeu:
    "M7 3h10v6a5 5 0 0 1-10 0zM7 5H3.5v2.5A3.5 3.5 0 0 0 7 11V9.5a2 2 0 0 1-2-2V6.5H7zM17 5h3.5v2.5A3.5 3.5 0 0 1 17 11V9.5a2 2 0 0 0 2-2V6.5H17zM11 14h2v3h-2zM8 18h8v3H8z",
  gema: "M6 3h12l3.6 5.4H2.4zM2.6 9.6h18.8L12 20.8z",
  coroa: "M3 18L2 7l5.5 4L12 4l4.5 7L22 7l-1 11zM3 20h18v2H3z",
  // eventos
  ingresso:
    "M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM14 7.5h1.5v2H14zM14 11h1.5v2H14zM14 14.5h1.5v2H14z",
  medalha:
    "M7 2h4l1 6-3 2zM17 2h-4l-1 6 3 2zM12 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
  engrenagem:
    "M10 2h4l.6 2.4 1.7.7 2.1-1.3 2.8 2.8-1.3 2.1.7 1.7L22 10v4l-2.4.6-.7 1.7 1.3 2.1-2.8 2.8-2.1-1.3-1.7.7L14 22h-4l-.6-2.4-1.7-.7-2.1 1.3-2.8-2.8 1.3-2.1-.7-1.7L2 14v-4l2.4-.6.7-1.7-1.3-2.1 2.8-2.8 2.1 1.3 1.7-.7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
} as const;

export type KitIcon = keyof typeof PATHS;

/** Path SVG cru do ícone (viewBox 24×24, fill-rule evenodd). */
export function iconPath(icon: KitIcon) {
  return PATHS[icon];
}

/** Valor de `mask-image` para o ícone. */
export function iconMask(icon: KitIcon) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill-rule="evenodd" d="${PATHS[icon]}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
