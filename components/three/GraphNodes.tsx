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
      uCore: { value: new THREE.Color("#fff6e2") },
      uMid: { value: new THREE.Color("#ffb43f") },
      uEdge: { value: new THREE.Color("#e06a12") },
    },
  });
}

/** Textura de corona: destello radial cálido generado en canvas (una textura,
 * no un post-proceso). Con blending aditivo sobre el cielo, el sol "encandila"
 * de verdad — luz que satura a blanco en el centro y se disipa. */
function makeCoronaTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,248,230,0.98)");
  g.addColorStop(0.14, "rgba(255,222,140,0.66)");
  g.addColorStop(0.38, "rgba(255,164,60,0.26)");
  g.addColorStop(0.7, "rgba(255,120,34,0.08)");
  g.addColorStop(1, "rgba(255,110,28,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Las 5 esferas-nodo como MINI-SOLES: superficie shader (núcleo blanco-caliente,
 * plasma, limbo naranja) + CORONA aditiva (textura radial) que encandila + una
 * LUZ PUNTUAL en el sol activo que baña el balón de luz cálida — la reacción
 * física en el modelo, no un glow pegado. Todo estático → el canvas puede
 * pausarse en reposo (on-demand) y el costo es trivial.
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
  const base = radius * 0.062;

  const matNormal = useMemo(() => makeSunMaterial(1.35), []);
  const matActive = useMemo(() => makeSunMaterial(2.0), []);
  const corona = useMemo(() => makeCoronaTexture(), []);
  useEffect(() => {
    return () => {
      matNormal.dispose();
      matActive.dispose();
      corona.dispose();
    };
  }, [matNormal, matActive, corona]);

  return (
    <>
      {positions.map((p, i) => {
        const active = i === activeIndex;
        return (
          <group key={nodos[i].id} position={p}>
            <mesh scale={active ? 1.5 : 1} material={active ? matActive : matNormal}>
              <sphereGeometry args={[base, 24, 24]} />
            </mesh>
            <sprite scale={active ? base * 7.6 : base * 4.6}>
              <spriteMaterial
                map={corona}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                transparent
                opacity={active ? 0.95 : 0.6}
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
