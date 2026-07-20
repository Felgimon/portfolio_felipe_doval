"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture, Billboard } from "@react-three/drei";
import { nodos } from "@/lib/navigation";
import { BALL_R, NODE_RING } from "./scene-config";
import {
  SUN_TEX,
  prepSunTexture,
  makeSunMaterial,
  advanceSuns,
  spinSun,
  burst,
} from "./sun";

/* Las ETIQUETAS de cada sol ya no viven acá (v5.5). Estaban hechas con
 * geometría 3D, así que su tamaño lo decidía la distancia de la cámara: 12.5px
 * en 1920 y ~5px en un celular (donde toda la escena entra en 289px). No hay
 * encuadre que arregle eso — para que el texto se leyera en el celular, el
 * cúmulo tendría que medir 640px de ancho en una pantalla de 390.
 * Ahora son UI de vidrio REAL (HTML) que sigue a cada sol por la proyección de
 * la cámara: legible en cualquier pantalla, y de paso la etiqueta y su zona
 * clickeable pasaron a ser la MISMA cosa. Ver NodeOverlay en GraphHome. */

const GROW = 0.5; // escala extra del sol activo
const BRIGHT_0 = 1.1; // brillo en reposo
const BRIGHT_1 = 1.5; // brillo activo
/** Easing del foco (~95% en 0.7s) y del hover (~95% en 0.25s, respuesta viva). */
const FOCUS_BASE = 0.014;
const HOVER_BASE = 0.0000045;

/* Aplica foco (0..1) + hover (0..1) + ráfaga (0..1) a un sol: escala y brillo
 * del plasma reaccionan JUNTOS (mutación fuera del componente). El resplandor
 * lo pone el bloom sobre el núcleo HDR — sin sprites aditivos (invisibles sobre
 * el estudio blanco). */
function applyFocus(
  mesh: THREE.Mesh | null,
  mat: THREE.ShaderMaterial,
  f: number,
  h: number,
  b: number,
) {
  if (mesh) mesh.scale.setScalar(1 + GROW * f + 0.12 * h + 0.06 * b);
  mat.uniforms.uBright.value =
    BRIGHT_0 + (BRIGHT_1 - BRIGHT_0) * f + 0.5 * h + 0.3 * b;
}

/* Onda expansiva del hover (la "mini-implosión"): un anillo 3D que estalla
 * desde el sol, se expande y se desvanece — una vez por hover. */
function updateShock(
  m: THREE.Mesh | null,
  start: number,
  now: number,
  base: number,
) {
  if (!m) return;
  const mat = m.material as THREE.MeshBasicMaterial;
  const T = 0.7;
  const dt = now - start;
  if (start < 0 || dt < 0 || dt > T) {
    mat.opacity = 0;
    return;
  }
  const p = dt / T;
  m.scale.setScalar(base * (1.7 + 3.6 * p));
  mat.opacity = 0.6 * (1 - p) * (1 - p);
}

/**
 * Las 5 esferas-nodo como MINI-SOLES clickeables: superficie fotográfica
 * hirviendo (shader `sun`) + su resplandor HDR (bloom). El HOVER dispara una
 * mini-implosión (contracción de brillo + ONDA EXPANSIVA 3D) y el foco crece
 * gradualmente (~1s). Quietos en su órbita: cada sección tiene su lugar fijo.
 * La etiqueta de cada uno la pone NodeOverlay en HTML (ver nota de arriba).
 */
export function GraphNodes({
  activeIndex,
  hovered,
  lite,
  reduced,
  sinBloom = false,
}: {
  activeIndex: number;
  hovered: number;
  lite: boolean;
  reduced: boolean;
  /** No hay post-proceso: el shader compensa el recorte a 8 bits para que los
   * mini-soles tengan la misma gradación con y sin bloom. */
  sinBloom?: boolean;
}) {
  const radius = BALL_R;
  // Los mini-soles orbitan el sol central (anillo compartido con NodeProjector).
  const positions = useMemo(
    () =>
      nodos.map((n) =>
        new THREE.Vector3(...n.dir).normalize().multiplyScalar(radius * NODE_RING),
      ),
    [radius],
  );
  const base = radius * 0.085;

  const solTex = useTexture(SUN_TEX);
  useEffect(() => prepSunTexture(solTex), [solTex]);
  const mats = useMemo(
    () =>
      nodos.map(() =>
        makeSunMaterial({
          bright: BRIGHT_0,
          invR: 1 / base,
          animated: !lite,
          map: solTex,
          sinBloom,
        }),
      ),
    [base, lite, solTex, sinBloom],
  );

  useEffect(() => {
    return () => {
      for (const m of mats) m.dispose();
    };
  }, [mats]);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const focus = useRef<number[]>(nodos.map(() => 0));
  const hoverV = useRef<number[]>(nodos.map(() => 0));
  const shockStart = useRef<number[]>(nodos.map(() => -1));
  const prevHover = useRef(-1);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!reduced) {
      timeRef.current += Math.min(delta, 0.1);
      advanceSuns(delta, ...mats);
    }
    // Al ENTRAR el hover en un sol, dispara su onda expansiva.
    if (hovered !== prevHover.current) {
      if (hovered >= 0) shockStart.current[hovered] = timeRef.current;
      prevHover.current = hovered;
    }
    const k = reduced ? 1 : 1 - Math.pow(FOCUS_BASE, Math.min(delta, 0.1));
    const kh = reduced ? 1 : 1 - Math.pow(HOVER_BASE, Math.min(delta, 0.1));
    const f = focus.current;
    const hv = hoverV.current;
    for (let i = 0; i < nodos.length; i++) {
      f[i] += ((i === activeIndex ? 1 : 0) - f[i]) * k;
      hv[i] += ((i === hovered ? 1 : 0) - hv[i]) * kh;
      const b = reduced ? 0 : burst(timeRef.current, 6 + i * 1.3, i * 0.37);
      applyFocus(meshRefs.current[i], mats[i], f[i], hv[i], b);
      const m = meshRefs.current[i];
      if (!reduced && m) spinSun(m, 0.22, delta);
      updateShock(ringRefs.current[i], shockStart.current[i], timeRef.current, base);
    }
  });

  return (
    <>
      {positions.map((p, i) => (
        <group key={nodos[i].id} position={p}>
          <mesh
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            material={mats[i]}
          >
            <sphereGeometry args={[base, 24, 24]} />
          </mesh>
          {/* Onda expansiva del hover (anillo 3D, animado en updateShock). */}
          <Billboard>
            <mesh
              ref={(el) => {
                ringRefs.current[i] = el;
              }}
              scale={0.0001}
            >
              <ringGeometry args={[0.86, 1, 48]} />
              <meshBasicMaterial
                color="#f0a835"
                transparent
                opacity={0}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </Billboard>
        </group>
      ))}
    </>
  );
}
