"use client";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

const MODEL = "/models/pelota-estructura-transformed.glb";

export type MousePos = { x: number; y: number };

type BalonGrafoProps = {
  mouse: RefObject<MousePos>;
  animate?: boolean;
  scale?: number;
  position?: [number, number, number];
};

/**
 * El balón-grafo: la red de nodos y struts (icosaedro truncado = pelota de
 * fútbol × red de pases × red neuronal). Material verde agua emisivo que brilla
 * con el bloom del canvas. Rota lento y hace parallax hacia el mouse.
 */
export function BalonGrafo({
  mouse,
  animate = true,
  scale = 1,
  position = [0, 0, 0],
}: BalonGrafoProps) {
  const group = useRef<THREE.Group>(null);
  const { nodes } = useGLTF(MODEL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const geometry = nodes.geometry_0.geometry;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05); // clamp para pestañas en 2º plano

    if (animate) {
      g.rotation.y += d * 0.16;
      g.position.y = position[1] + Math.sin(t * 0.6) * 0.06;
    }

    // Parallax suave hacia el puntero (lerp sobre refs, sin setState)
    const mx = mouse.current?.x ?? 0;
    const my = mouse.current?.y ?? 0;
    const targetX = my * 0.22;
    const targetZ = mx * 0.16;
    g.rotation.x += (targetX - g.rotation.x) * 0.045;
    g.rotation.z += (targetZ - g.rotation.z) * 0.045;
  });

  return (
    <group ref={group} scale={scale} position={position}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#14352c"
          emissive="#8fe3c6"
          emissiveIntensity={0.9}
          metalness={0.55}
          roughness={0.32}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL);
