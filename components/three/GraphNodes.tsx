"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { nodos } from "@/lib/navigation";

const MODEL = "/models/pelota-estructura-transformed.glb";

/**
 * Las 5 esferas-nodo sobre el balón: verde agua emisivo (glow con el bloom). La
 * activa crece y brilla más. Sin animación continua (tamaño/brillo por prop) →
 * compatible con el render on-demand: solo redibuja cuando cambia el nodo activo.
 */
export function GraphNodes({ activeIndex }: { activeIndex: number }) {
  const { nodes } = useGLTF(MODEL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const geometry = nodes.geometry_0.geometry;
  const radius = useMemo(() => {
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    return geometry.boundingSphere?.radius ?? 1;
  }, [geometry]);

  const positions = useMemo(
    () =>
      nodos.map((n) =>
        new THREE.Vector3(...n.dir).normalize().multiplyScalar(radius * 1.02),
      ),
    [radius],
  );
  const base = radius * 0.058;

  return (
    <>
      {positions.map((p, i) => {
        const active = i === activeIndex;
        return (
          <mesh key={nodos[i].id} position={p} scale={active ? 1.5 : 1}>
            <sphereGeometry args={[base, 16, 16]} />
            <meshStandardMaterial
              color="#b7f0da"
              emissive="#8fe3c6"
              emissiveIntensity={active ? 2.4 : 1.5}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </>
  );
}

useGLTF.preload(MODEL);
