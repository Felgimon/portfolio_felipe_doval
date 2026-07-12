"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * BÓVEDA DE ESTRELLAS PROCEDURALES: puntos 3D reales sobre una esfera lejana,
 * POR ENCIMA del panorama fotográfico. El skybox (una foto estirada a todo el
 * encuadre) nunca puede dar estrellas nítidas a fov angosto; estos puntos se
 * rasterizan a resolución NATIVA en cualquier pantalla: la nitidez percibida
 * del cielo sale de acá. Colores por temperatura (azul-blanco con un puñado
 * cálido), brillos y tamaños con distribución realista (muchas débiles, pocas
 * brillantes), determinístico. Gira junto con la deriva del skybox.
 */

/** Deriva del cielo (rad/s): compartida por el skybox y las estrellas
 * (vuelta completa ≈ 21 min). */
export const SKY_DRIFT = 0.005;

const N_FULL = 2600;
const N_LITE = 800;
const R_DOME = 90; // radio de la bóveda (detrás de asteroides y balón)

/* PRNG determinístico (mulberry32): el cielo es el mismo en cada visita. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStarsGeometry(n: number): THREE.BufferGeometry {
  const rand = mulberry32(0x57a2);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const size = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    // Punto uniforme sobre la esfera.
    const z = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const rxy = Math.sqrt(1 - z * z);
    pos[i * 3] = rxy * Math.cos(th) * R_DOME;
    pos[i * 3 + 1] = z * R_DOME;
    pos[i * 3 + 2] = rxy * Math.sin(th) * R_DOME;
    // Tamaño: ley de potencias (mayoría débiles, pocas protagonistas).
    size[i] = 0.6 + Math.pow(rand(), 3) * 3.2;
    // Temperatura: ~12% cálidas (K/M), el resto azul-blancas; brillo variable.
    const warm = rand() < 0.12;
    const b = 0.5 + rand() * 0.55;
    if (warm) {
      col[i * 3] = b;
      col[i * 3 + 1] = b * 0.82;
      col[i * 3 + 2] = b * 0.62;
    } else {
      const t = 0.75 + rand() * 0.25;
      col[i * 3] = b * t;
      col[i * 3 + 1] = b * (0.88 + 0.12 * t);
      col[i * 3 + 2] = b;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.computeBoundingSphere();
  return g;
}

const starsVertex = /* glsl */ `
  attribute float aSize;
  uniform float uPx;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPx * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
/* Disco suave: núcleo pleno + caída rápida (sin halos grandes: puntos, no
 * "bokeh"). Sin tonemapping (ShaderMaterial crudo): quedan nítidas. */
const starsFragment = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

export function Stars({ lite, reduced }: { lite: boolean; reduced: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => makeStarsGeometry(lite ? N_LITE : N_FULL), [lite]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uPx: { value: 1 } },
        vertexShader: starsVertex,
        fragmentShader: starsFragment,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => {
    mat.uniforms.uPx.value = dpr;
  }, [mat, dpr]);
  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((_, delta) => {
    if (!reduced && group.current) {
      group.current.rotation.y += SKY_DRIFT * Math.min(delta, 0.1);
    }
  });

  return (
    <group ref={group}>
      <points geometry={geo} material={mat} frustumCulled={false} />
    </group>
  );
}
