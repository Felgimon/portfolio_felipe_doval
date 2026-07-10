"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { nodos } from "@/lib/navigation";
import { sunVertex, sunFragment } from "./sun";

const MODEL = "/models/pelota-estructura-transformed.glb";

/** Material de mini-sol (shader). Se comparten 2 instancias: normal y activa (más
 * brillante). Estático → compatible con el render on-demand. */
function makeSunMaterial(bright: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: sunFragment,
    toneMapped: false,
    uniforms: {
      uBright: { value: bright },
      uCore: { value: new THREE.Color("#fff4de") },
      uMid: { value: new THREE.Color("#ffb43f") },
      uEdge: { value: new THREE.Color("#df741a") },
    },
  });
}

/**
 * Las 5 esferas-nodo como MINI-SOLES realistas (shader `sun`): núcleo caliente,
 * plasma granulado y borde tipo corona — sin glow/bloom ni post-proceso. La
 * activa crece y brilla más (protagonista de la sección). Sin animación continua
 * → el canvas puede pausarse en reposo.
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
        new THREE.Vector3(...n.dir).normalize().multiplyScalar(radius * 1.04),
      ),
    [radius],
  );
  const base = radius * 0.065;

  const matNormal = useMemo(() => makeSunMaterial(1.12), []);
  const matActive = useMemo(() => makeSunMaterial(1.62), []);
  useEffect(() => {
    return () => {
      matNormal.dispose();
      matActive.dispose();
    };
  }, [matNormal, matActive]);

  return (
    <>
      {positions.map((p, i) => {
        const active = i === activeIndex;
        return (
          <mesh
            key={nodos[i].id}
            position={p}
            scale={active ? 1.55 : 1}
            material={active ? matActive : matNormal}
          >
            <sphereGeometry args={[base, 24, 24]} />
          </mesh>
        );
      })}
    </>
  );
}

useGLTF.preload(MODEL);
