"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { nodos } from "@/lib/navigation";
import { makeSunMaterial, makeCoronaTexture, tickSuns } from "./sun";

const MODEL = "/models/pelota-estructura-transformed.glb";

/**
 * Las 5 esferas-nodo como MINI-SOLES: plasma animado con domain-warping (shader
 * `sun`, HDR → el bloom los hace encandilar de verdad) + corona aditiva + una
 * LUZ PUNTUAL en el sol activo que baña los struts del balón (reacción física
 * real). La animación corre solo en frames renderizados (render on-demand).
 */
export function GraphNodes({
  activeIndex,
  lite,
}: {
  activeIndex: number;
  lite: boolean;
}) {
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
        new THREE.Vector3(...n.dir).normalize().multiplyScalar(radius * 1.04),
      ),
    [radius],
  );
  const base = radius * 0.062;

  const matNormal = useMemo(
    () => makeSunMaterial({ bright: 1.1, invR: 1 / base, animated: !lite }),
    [base, lite],
  );
  const matActive = useMemo(
    () => makeSunMaterial({ bright: 1.45, invR: 1 / base, animated: !lite }),
    [base, lite],
  );
  const corona = useMemo(() => makeCoronaTexture(), []);
  useEffect(() => {
    return () => {
      matNormal.dispose();
      matActive.dispose();
      corona.dispose();
    };
  }, [matNormal, matActive, corona]);

  useFrame((s) => tickSuns(s.clock.elapsedTime, matNormal, matActive));

  return (
    <>
      {positions.map((p, i) => {
        const active = i === activeIndex;
        return (
          <group key={nodos[i].id} position={p}>
            <mesh scale={active ? 1.5 : 1} material={active ? matActive : matNormal}>
              <sphereGeometry args={[base, 24, 24]} />
            </mesh>
            <sprite scale={active ? base * 7 : base * 4.2}>
              <spriteMaterial
                map={corona}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                transparent
                opacity={active ? 0.85 : 0.5}
                toneMapped={false}
              />
            </sprite>
          </group>
        );
      })}
      {/* El sol activo ILUMINA el balón: los struts cercanos se tiñen de luz
          cálida (reacción real del material, como una luz en Blender). */}
      {activeIndex >= 0 && activeIndex < positions.length && (
        <pointLight
          position={positions[activeIndex]}
          color="#ffbe6a"
          intensity={2.4}
          distance={radius * 2.6}
          decay={1.6}
        />
      )}
    </>
  );
}

useGLTF.preload(MODEL);
