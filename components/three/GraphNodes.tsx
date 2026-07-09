"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { nodos } from "@/lib/navigation";

const MODEL = "/models/pelota-estructura-transformed.glb";

/** Radio del balón (bounding sphere de la malla). Los nodos se apoyan un pelín
 * afuera de la superficie. */
export function useBallRadius(): number {
  const { nodes } = useGLTF(MODEL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const geometry = nodes.geometry_0.geometry;
  return useMemo(() => {
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    return geometry.boundingSphere?.radius ?? 1;
  }, [geometry]);
}

/** Posiciones locales de los nodos (dirección unitaria × radio). Compartido con
 * la proyección 2D de las etiquetas (Fase D). */
export function nodePositions(radius: number): THREE.Vector3[] {
  return nodos.map((n) =>
    new THREE.Vector3(...n.dir).normalize().multiplyScalar(radius * 1.02),
  );
}

/**
 * Las 5 esferas-nodo sobre el balón: verde agua emisivo (glow con el bloom). La
 * activa crece y brilla más; todas pulsan suave. Son hijas del grupo que rota,
 * así que acompañan al balón.
 */
export function GraphNodes({ activeIndex }: { activeIndex: number }) {
  const radius = useBallRadius();
  const positions = useMemo(() => nodePositions(radius), [radius]);
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < positions.length; i++) {
      const g = refs.current[i];
      if (!g) continue;
      const active = i === activeIndex;
      const pulse = 1 + Math.sin(t * 2 + i * 1.7) * (active ? 0.16 : 0.07);
      const target = (active ? 1.4 : 1) * pulse;
      g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, target, 0.12));
    }
  });

  const base = radius * 0.058;

  return (
    <>
      {positions.map((p, i) => (
        <group
          key={nodos[i].id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={p}
        >
          <mesh>
            <sphereGeometry args={[base, 16, 16]} />
            <meshStandardMaterial
              color="#b7f0da"
              emissive="#8fe3c6"
              emissiveIntensity={i === activeIndex ? 2.4 : 1.5}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

useGLTF.preload(MODEL);
