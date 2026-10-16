/**
 * El mail de Felipe NO está en el HTML ni en el contenido: se arma recién en
 * el clic, desde partes sueltas (anti-scraping, pedido de Felipe).
 */
const PARTES = [["felipe", "ferrari", "doval"], ["gmail", "com"]] as const;

export const armarMail = () => `${PARTES[0].join("")}@${PARTES[1].join(".")}`;

/** Abre el programa de mail con asunto y saludo listos (un <a> que no queda en el DOM). */
export function abrirMail(asunto: string, cuerpo: string) {
  const a = document.createElement("a");
  a.href = `mailto:${armarMail()}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  a.click();
}
