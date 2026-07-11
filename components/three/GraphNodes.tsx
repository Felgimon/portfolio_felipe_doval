"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { nodos } from "@/lib/navigation";
import { BALL_R } from "./Lattice";
import {
  makeSunMaterial,
  makeCoronaTexture,
  advanceSuns,
  spinSun,
  burst,
} from "./sun";

const GROW = 0.5; // escala extra del sol activo
const BRIGHT_0 = 1.1; // brillo en reposo
const BRIGHT_1 = 1.5; // brillo activo
/** Easing del "crecimiento épico": ~95% del camino en 0.7s (rápido, no abrupto). */
const FOCUS_BASE = 0.014;

/* Aplica el estado de foco (0..1) + la ráfaga periódica (0..1) a un sol:
 * escala, brillo del plasma y corona crecen JUNTOS con la misma curva; la
 * erupción suma un latigazo breve de brillo/corona (mutación imperativa). */
function applyFocus(
  mesh: THREE.Mesh | null,
  sprite: THREE.Sprite | null,
  mat: THREE.ShaderMaterial,
  base: number,
  f: number,
  b: number,
) {
  if (mesh) mesh.scale.setScalar(1 + GROW * f + 0.06 * b);
  mat.uniforms.uBright.value = BRIGHT_0 + (BRIGHT_1 - BRIGHT_0) * f + 0.3 * b;
  if (sprite) {
    const s = base * (4.2 + 2.8 * f + 1.6 * b);
    sprite.scale.set(s, s, 1);
    (sprite.material as THREE.SpriteMaterial).opacity =
      0.5 + 0.35 * f + 0.25 * b;
  }
}

/* La luz cálida VIAJA hacia el sol activo (y se apaga en la portada): nunca
 * aparece/desaparece de golpe. */
function moveLight(
  light: THREE.PointLight | null,
  target: THREE.Vector3 | null,
  k: number,
) {
  if (!light) return;
  if (target) {
    light.position.lerp(target, k);
    light.intensity += (2.4 - light.intensity) * k;
  } else {
    light.intensity += (0 - light.intensity) * k;
  }
}

/**
 * Las 5 esferas-nodo como MINI-SOLES: plasma animado (shader `sun`, HDR → el
 * bloom los hace encandilar) + corona aditiva + una luz puntual que viaja al
 * sol activo. El foco (tamaño + brillo + corona + luz) crece GRADUALMENTE
 * (~1s): una etapa de crecimiento épica, no un salto. Cada sol tiene su propio
 * material para poder animar el brillo por-nodo.
 */
export function GraphNodes({
  activeIndex,
  lite,
  reduced,
}: {
  activeIndex: number;
  lite: boolean;
  reduced: boolean;
}) {
  const radius = BALL_R;
  // Los soles orbitan DESPEGADOS del contenedor (halo alrededor del vidrio).
  const positions = useMemo(
    () =>
      nodos.map((n) =>
        new THREE.Vector3(...n.dir).normalize().multiplyScalar(radius * 1.32),
      ),
    [radius],
  );
  const base = radius * 0.085;

  const mats = useMemo(
    () =>
      nodos.map(() =>
        makeSunMaterial({ bright: BRIGHT_0, invR: 1 / base, animated: !lite }),
      ),
    [base, lite],
  );
  const corona = useMemo(() => makeCoronaTexture(), []);
  useEffect(() => {
    return () => {
      for (const m of mats) m.dispose();
      corona.dispose();
    };
  }, [mats, corona]);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const spriteRefs = useRef<(THREE.Sprite | null)[]>([]);
  const lightRef = useRef<THREE.PointLight>(null);
  const focus = useRef<number[]>(nodos.map(() => 0));
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!reduced) {
      timeRef.current += Math.min(delta, 0.1);
      advanceSuns(delta, ...mats);
    }
    // reduced: snap instantáneo (sin animación); si no, easing exponencial.
    const k = reduced ? 1 : 1 - Math.pow(FOCUS_BASE, Math.min(delta, 0.1));
    const f = focus.current;
    for (let i = 0; i < nodos.length; i++) {
      f[i] += ((i === activeIndex ? 1 : 0) - f[i]) * k;
      // Erupción periódica propia de cada sol (períodos/fases distintos →
      // nunca en sincronía, como estrellas reales).
      const b = reduced ? 0 : burst(timeRef.current, 6 + i * 1.3, i * 0.37);
      applyFocus(
        meshRefs.current[i],
        spriteRefs.current[i],
        mats[i],
        base,
        f[i],
        b,
      );
      const m = meshRefs.current[i];
      if (!reduced && m) spinSun(m, 0.22, delta);
    }
    moveLight(
      lightRef.current,
      activeIndex >= 0 ? positions[activeIndex] : null,
      k,
    );
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
          <sprite
            ref={(el) => {
              spriteRefs.current[i] = el;
            }}
            scale={[base * 4.2, base * 4.2, 1]}
          >
            <spriteMaterial
              map={corona}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              transparent
              opacity={0.5}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}
      {/* La luz que baña el contenedor: viaja con el foco, intensidad 0 en la
          portada (siempre montada → sin pops). */}
      <pointLight
        ref={lightRef}
        color="#ffbe6a"
        intensity={0}
        distance={radius * 2.6}
        decay={1.6}
      />
    </>
  );
}
