import medidas from "./poses.generado.json";

/**
 * FELI: las fotos de Felipe que acompañan la visita (v7).
 *
 * Feli no habla: no hay globos ni frases (pedido de Felipe: "guiar" es que haya
 * fotos suyas que te acompañen mientras navegás, no comentarios). Cada parada
 * que tiene foto declara acá qué pose usa.
 *
 * Mientras no esté la sesión de fotos nueva, cada pose apunta al recorte
 * interino más parecido. Cuando lleguen las fotos: recorte con fondo
 * transparente en contenido/guia/<archivo>.png → `node scripts/gen-guia.mjs`
 * → acá, apuntar la pose a su archivo. Ver TODO-FELI.md.
 */

type Archivo = keyof typeof medidas;

export const POSES = {
  inicio: "apoyado", // FALTA foto: de frente, apoyado en los antebrazos, sonrisa leve
  perfil: "piensa", // FALTA foto: sentado, mano en el mentón, mirando a cámara
  recorrido: "parado", // FALTA foto: de perfil, cuerpo entero, caminando
  contacto: "cruzado", // FALTA foto: tres cuartos, brazos cruzados, mirando a cámara
  perdida: "parado", // FALTA foto: encogido de hombros, palmas arriba
} as const satisfies Record<string, Archivo>;

export type PoseId = keyof typeof POSES;

export function pose(id: PoseId) {
  const archivo = POSES[id];
  const { w, h } = medidas[archivo];
  return { src: `/assets/guia/${archivo}.webp`, w, h };
}
