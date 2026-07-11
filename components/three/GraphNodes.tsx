"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { nodos } from "@/lib/navigation";
import { BALL_R } from "./Lattice";
import { makeSunMaterial, makeCoronaTexture, tickSuns } from "./sun";

/**
 * Las 5 esferas-nodo como MINI-SOLES: plasma animado con domain-warping (shader
 * `sun`, HDR → el bloom los hace encandilar de verdad) + corona aditiva + una
 * LUZ PUNTUAL en el sol activo que baña el contenedor (reacción física real).
 * En GPU real el canvas corre continuo → el plasma hierve a framerate completo;
 * en lite/reduced el sol es estático.
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

  useFrame((s) => {
    if (!reduced) tickSuns(s.clock.elapsedTime, matNormal, matActive);
  });

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
      {/* El sol activo ILUMINA el contenedor: los struts cercanos se tiñen de
          luz cálida (reacción real del material, como una luz en Blender). */}
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
