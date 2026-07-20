/**
 * LIQUID GLASS — la lente que dobla el fondo, con aberración cromática.
 *
 * Porteado de github.com/srdavo/liquid-glass (web component de Salvador
 * Camacho), que a su vez adapta el enfoque del artículo de ekino-France
 * (medium.com/ekino-france/liquid-glass-in-css-and-svg). Es la receta que se ve
 * como el material real de iOS 26, y difiere de nuestro intento anterior (un
 * bisel de Snell angosto) en tres cosas que resultaron ser TODO el efecto:
 *
 *  1. El mapa de desplazamiento cubre el ELEMENTO ENTERO: dos gradientes
 *     lineales (rojo → x, verde → y) que van de borde a borde, con un
 *     rectángulo NEUTRO (#808080) redondeado y desenfocado en el medio que
 *     apaga la distorsión en el interior. Resultado: el centro se ve limpio y
 *     el borde MAGNIFICA como una lupa, con una transición del ancho de
 *     `depth`. Nuestro bisel angosto doblaba 2px y no se veía.
 *  2. ABERRACIÓN CROMÁTICA: el fondo se desplaza TRES veces (escalas
 *     strength+2ca / strength+ca / strength), cada pasada aislada a un canal
 *     (R/G/B) con feColorMatrix, y se recombinan con feBlend screen. Ese
 *     desfase de color en el borde es la firma visual del vidrio real.
 *  3. La ESCALA: strength 40..70 según el tamaño. Con menos de ~25 el ojo no
 *     registra la distorsión y todo el sistema es ruido.
 *
 * El filtro viaja como data URI (`url('data:image/svg+xml;...#displace')`):
 * no hace falta ningún <svg> en el DOM ni canvas. Solo Chromium aplica filtros
 * SVG en backdrop-filter; quién recibe la lente y quién el fallback lo decide
 * LiquidGlass.tsx.
 */

export type ParamsLente = {
  width: number;
  height: number;
  radius: number;
  /** Ancho de la zona de lente del borde (el "espesor" del vidrio), en px. */
  depth: number;
  /** Cuántos px se desplaza el fondo como máximo. */
  strength: number;
  /** Desfase extra de los canales R/G (el fringe de color), en px. */
  chromaticAberration: number;
};

/**
 * El mapa de desplazamiento. Codificación de feDisplacementMap: R = eje x,
 * G = eje y, 128 = quieto. Gradientes de borde a borde + interior neutro
 * redondeado y desenfocado (la transición mide `depth`).
 */
export function mapaDesplazamiento({
  width,
  height,
  radius,
  depth,
}: Omit<ParamsLente, "strength" | "chromaticAberration">): string {
  const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>.mix { mix-blend-mode: screen; }</style>
        <defs>
            <linearGradient id="Y" x1="0" x2="0"
              y1="${Math.ceil((radius / height) * 15)}%"
              y2="${Math.floor(100 - (radius / height) * 15)}%">
                <stop offset="0%" stop-color="#0F0" />
                <stop offset="100%" stop-color="#000" />
            </linearGradient>
            <linearGradient id="X"
              x1="${Math.ceil((radius / width) * 15)}%"
              x2="${Math.floor(100 - (radius / width) * 15)}%"
              y1="0" y2="0">
                <stop offset="0%" stop-color="#F00" />
                <stop offset="100%" stop-color="#000" />
            </linearGradient>
        </defs>
        <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
        <g filter="blur(2px)">
          <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
          <rect x="0" y="0" height="${height}" width="${width}" fill="url(#Y)" class="mix" />
          <rect x="0" y="0" height="${height}" width="${width}" fill="url(#X)" class="mix" />
          <rect x="${depth}" y="${depth}"
                height="${height - 2 * depth}" width="${width - 2 * depth}"
                fill="#808080" rx="${radius}" ry="${radius}" filter="blur(${depth}px)" />
        </g>
    </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/**
 * El filtro completo como data URI listo para `backdrop-filter: url(...)`.
 *
 * COSTO (medido, ver DECISIONS v5.14): cada `feDisplacementMap` reprocesa el
 * ÁREA ENTERA del elemento, así que la cadena es LINEAL en pasadas — ~30ms por
 * pasada con los vidrios de la sección Trabajo. Y como el canvas 3D repinta
 * detrás, el backdrop se invalida y todo esto se recalcula POR FRAME.
 *
 * Por eso hay dos calidades, siguiendo la división que ya existía:
 *  - `chromaticAberration > 0` (vidrio FLOTANTE: HUD, CTAs, chips) → las 3
 *    pasadas con la aberración cromática completa. Son elementos CHICOS, así
 *    que las 3 pasadas cuestan centavos, y es donde el efecto luce.
 *  - `chromaticAberration === 0` (vidrio en FLUJO: cards de las grillas) → UNA
 *    sola pasada. Conserva la REFRACCIÓN íntegra (el doblez de las líneas del
 *    piso, que es el efecto que se ve) y sólo resigna el fringe de color, que
 *    en estas cards ya era de 2px — invisible. Son las que aportan ~90% del
 *    área filtrada de la página: acá está el grueso del ahorro.
 */
export function filtroLente({
  width,
  height,
  radius,
  depth,
  strength,
  chromaticAberration,
}: ParamsLente): string {
  const mapa = mapaDesplazamiento({ width, height, radius, depth });
  const desplazar =
    chromaticAberration > 0
      ? `<feDisplacementMap in="SourceGraphic" in2="displacementMap"
                    scale="${strength + chromaticAberration * 2}"
                    xChannelSelector="R" yChannelSelector="G" />
                <feColorMatrix type="matrix"
                    values="1 0 0 0 0
                            0 0 0 0 0
                            0 0 0 0 0
                            0 0 0 1 0" result="displacedR" />
                <feDisplacementMap in="SourceGraphic" in2="displacementMap"
                    scale="${strength + chromaticAberration}"
                    xChannelSelector="R" yChannelSelector="G" />
                <feColorMatrix type="matrix"
                    values="0 0 0 0 0
                            0 1 0 0 0
                            0 0 0 0 0
                            0 0 0 1 0" result="displacedG" />
                <feDisplacementMap in="SourceGraphic" in2="displacementMap"
                    scale="${strength}"
                    xChannelSelector="R" yChannelSelector="G" />
                <feColorMatrix type="matrix"
                    values="0 0 0 0 0
                            0 0 0 0 0
                            0 0 1 0 0
                            0 0 0 1 0" result="displacedB" />
                <feBlend in="displacedR" in2="displacedG" mode="screen"/>
                <feBlend in2="displacedB" mode="screen"/>`
      : `<feDisplacementMap in="SourceGraphic" in2="displacementMap"
                    scale="${strength}"
                    xChannelSelector="R" yChannelSelector="G" />`;
  const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="displace" color-interpolation-filters="sRGB">
                <feImage x="0" y="0" height="${height}" width="${width}" href="${mapa}" result="displacementMap" />
                ${desplazar}
            </filter>
        </defs>
    </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg) + "#displace";
}

/**
 * Parámetros según el tamaño del elemento, calibrados contra el video del
 * componente: los elementos chicos piden strength ~40% o "se forma un borde
 * raro alrededor" (sic); los grandes aguantan más. `depth` es el espesor
 * óptico: mucho depth = zoom exagerado.
 *
 * `suave` es para el vidrio EN FLUJO (cards adentro de una grilla): la lente
 * plena en una card de ~90px trae a la card VECINA adentro — con strength 68
 * el borde muestra lo que hay hasta 68px afuera, y la vecina está a 12px. En
 * el stack de Perfil eso se veía como cards fantasma superpuestas (bug que
 * reportó Felipe). El vidrio que FLOTA (HUD, CTAs, chips) mantiene la lente
 * plena: no tiene vecinos pegados y es donde el efecto luce.
 */
export function paramsPara(
  w: number,
  h: number,
  radius: number,
  suave = false,
): ParamsLente {
  const lado = Math.min(w, h);
  const chico = lado < 30;
  if (suave) {
    return {
      width: Math.round(w),
      height: Math.round(h),
      radius: Math.round(Math.min(radius, lado / 2)),
      depth: Math.round(Math.min(Math.max(lado * 0.22, 5), 14)),
      strength: Math.round(Math.min(Math.max(lado * 0.34, 14), 26)),
      // CA 0 = UNA sola pasada de desplazamiento (ver filtroLente). Estas cards
      // son las grandes: aportan ~90% del área filtrada y las 3 pasadas se
      // pagaban por frame. La refracción queda intacta; el fringe que se
      // resigna medía 2px sobre una card de 300px — no se veía.
      chromaticAberration: 0,
    };
  }
  return {
    width: Math.round(w),
    height: Math.round(h),
    radius: Math.round(Math.min(radius, lado / 2)),
    // `depth` es el ANCHO de la banda donde el borde hace de lupa. Con 12px en
    // un botón de 50 el doblez quedaba escondido en el filo y no se leía; con
    // ~30% del lado la lente ocupa una franja visible y el fondo se curva de
    // verdad (el techo evita el "zoom exagerado" que advierte el video).
    depth: Math.round(Math.min(Math.max(lado * 0.3, 6), 22)),
    strength: Math.round(Math.min(Math.max(lado * 1.2, 26), 68)),
    chromaticAberration: chico ? 2 : 4,
  };
}
