"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture, Text, Billboard } from "@react-three/drei";
import { nodos } from "@/lib/navigation";
import { BALL_R } from "./Lattice";
import {
  SUN_TEX,
  prepSunTexture,
  makeSunMaterial,
  makeCoronaTexture,
  advanceSuns,
  spinSun,
  burst,
} from "./sun";

const LABEL_FONT = "/fonts/logo.ttf";

const GROW = 0.5; // escala extra del sol activo
const BRIGHT_0 = 1.1; // brillo en reposo
const BRIGHT_1 = 1.5; // brillo activo
/** Easing del foco (~95% en 0.7s) y del hover (~95% en 0.25s, respuesta viva). */
const FOCUS_BASE = 0.014;
const HOVER_BASE = 0.0000045;

/* Aplica foco (0..1) + hover (0..1) + ráfaga (0..1) a un sol: escala, brillo
 * del plasma y corona reaccionan JUNTOS (mutación fuera del componente). */
function applyFocus(
  mesh: THREE.Mesh | null,
  sprite: THREE.Sprite | null,
  mat: THREE.ShaderMaterial,
  base: number,
  f: number,
  h: number,
  b: number,
) {
  if (mesh) mesh.scale.setScalar(1 + GROW * f + 0.12 * h + 0.06 * b);
  mat.uniforms.uBright.value =
    BRIGHT_0 + (BRIGHT_1 - BRIGHT_0) * f + 0.5 * h + 0.3 * b;
  if (sprite) {
    const s = base * (4.2 + 2.8 * f + 1.3 * h + 1.6 * b);
    sprite.scale.set(s, s, 1);
    (sprite.material as THREE.SpriteMaterial).opacity =
      0.5 + 0.35 * f + 0.2 * h + 0.25 * b;
  }
}

/* La luz cálida VIAJA hacia el sol activo (y se apaga en la portada). */
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
  mat.opacity = 0.55 * (1 - p) * (1 - p);
}

/**
 * Las 5 esferas-nodo como MINI-SOLES clickeables: superficie fotográfica
 * hirviendo (shader `sun`) + corona + una luz que viaja al sol activo. El HOVER
 * dispara una mini-implosión (contracción de brillo + ONDA EXPANSIVA 3D) y el
 * foco crece gradualmente (~1s). Cada sol lleva su ETIQUETA 3D flotante
 * (billboard, texto claro con halo espacial oscuro) para saber a qué sección
 * lleva.
 */
export function GraphNodes({
  activeIndex,
  hovered,
  lite,
  reduced,
}: {
  activeIndex: number;
  hovered: number;
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
        }),
      ),
    [base, lite, solTex],
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
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lightRef = useRef<THREE.PointLight>(null);
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
      applyFocus(
        meshRefs.current[i],
        spriteRefs.current[i],
        mats[i],
        base,
        f[i],
        hv[i],
        b,
      );
      const m = meshRefs.current[i];
      if (!reduced && m) spinSun(m, 0.22, delta);
      updateShock(ringRefs.current[i], shockStart.current[i], timeRef.current, base);
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
                color="#ffd27a"
                transparent
                opacity={0}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </Billboard>
          {/* Etiqueta 3D flotante: a qué sección lleva este sol. */}
          <Billboard position={[0, -base * 2.4, 0]}>
            <Text
              font={LABEL_FONT}
              fontSize={base * 0.6}
              letterSpacing={0.08}
              anchorX="center"
              anchorY="middle"
              outlineWidth={base * 0.05}
              outlineColor="#050b14"
              outlineOpacity={0.85}
            >
              {nodos[i].label.toUpperCase()}
              <meshBasicMaterial color="#eaf4fc" transparent />
            </Text>
          </Billboard>
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
