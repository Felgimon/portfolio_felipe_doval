"use client";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GraphNodes } from "./GraphNodes";
import { heroBgVertex, heroBgFragment } from "./shaders";

const MODEL = "/models/pelota-estructura-transformed.glb";

type MousePos = { x: number; y: number };

/** Puntero normalizado (-1..1) desde `window` (el canvas es pointer-none). */
function useMouseTracker(): RefObject<MousePos> {
  const mouse = useRef<MousePos>({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return mouse;
}

/** Luz verde agua que persigue al puntero: enciende los struts cercanos. */
function CursorLight({ mouse }: { mouse: RefObject<MousePos> }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const mx = mouse.current?.x ?? 0;
    const my = mouse.current?.y ?? 0;
    l.position.x += (mx * 3.2 - l.position.x) * 0.09;
    l.position.y += (my * 2.2 - l.position.y) * 0.09;
  });
  return (
    <pointLight
      ref={light}
      color="#b7f0da"
      intensity={22}
      distance={9}
      position={[0, 0, 2.6]}
    />
  );
}

/** Campo shader de fondo (ruido verde agua sutil con viñeta hacia el balón). */
function BgField() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#8fe3c6") },
      uFocus: { value: new THREE.Vector2(0.58, 0.52) },
    }),
    [],
  );
  useFrame((_, delta) => {
    const m = mat.current;
    if (m) m.uniforms.uTime.value += Math.min(delta, 0.05);
  });
  return (
    <mesh position={[0, 0, -3]} scale={[20, 20, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={heroBgVertex}
        fragmentShader={heroBgFragment}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/** Malla del balón (icosaedro truncado): verde agua emisivo. */
function BalonMesh() {
  const { nodes } = useGLTF(MODEL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  return (
    <mesh geometry={nodes.geometry_0.geometry}>
      <meshStandardMaterial
        color="#14352c"
        emissive="#8fe3c6"
        emissiveIntensity={0.9}
        metalness={0.55}
        roughness={0.32}
      />
    </mesh>
  );
}

/**
 * El grafo completo (balón + nodos) en un grupo que rota. En esta fase el grupo
 * oscila alrededor del frente (parallax al mouse + sway) para que los 5 nodos
 * queden siempre de cara a la cámara; la rotación dirigida al nodo activo según
 * el scroll llega en la Fase D.
 */
function GraphGroup({
  mouse,
  activeIndex,
  scale,
  position,
}: {
  mouse: RefObject<MousePos>;
  activeIndex: number;
  scale: number;
  position: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const mx = mouse.current?.x ?? 0;
    const my = mouse.current?.y ?? 0;
    const targetY = mx * 0.35 + Math.sin(t * 0.3) * 0.06;
    const targetX = -my * 0.2 + Math.sin(t * 0.24) * 0.04;
    g.rotation.y += (targetY - g.rotation.y) * 0.05 * (d / 0.016);
    g.rotation.x += (targetX - g.rotation.x) * 0.05 * (d / 0.016);
    g.position.y = position[1] + Math.sin(t * 0.5) * 0.04;
  });
  return (
    <group ref={group} scale={scale} position={position}>
      <BalonMesh />
      <GraphNodes activeIndex={activeIndex} />
    </group>
  );
}

/** Escala/posición del grafo según el ancho del canvas (responsive). */
function ResponsiveGraph({
  mouse,
  activeIndex,
  baseScale,
  basePosition,
}: {
  mouse: RefObject<MousePos>;
  activeIndex: number;
  baseScale: number;
  basePosition: [number, number, number];
}) {
  const width = useThree((s) => s.size.width);
  const narrow = width < 820;
  const scale = baseScale * (narrow ? 0.82 : 1);
  const position: [number, number, number] = narrow
    ? [0, basePosition[1] + 0.1, basePosition[2]]
    : basePosition;
  return (
    <GraphGroup
      mouse={mouse}
      activeIndex={activeIndex}
      scale={scale}
      position={position}
    />
  );
}

function SignalReady({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

export type GraphCanvasProps = {
  tier?: number;
  activeIndex?: number;
  ballScale?: number;
  ballPosition?: [number, number, number];
  paused?: boolean;
  onReady?: () => void;
};

export default function GraphCanvas({
  tier = 3,
  activeIndex = -1,
  ballScale = 1.9,
  ballPosition = [0.55, 0, 0],
  paused = false,
  onReady,
}: GraphCanvasProps) {
  const mouse = useMouseTracker();
  const dpr: [number, number] = tier >= 3 ? [1, 2] : [1, 1.5];

  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      dpr={dpr}
      camera={{ position: [0, 0, 5.6], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color="#dff7ec" />
      <CursorLight mouse={mouse} />
      <Suspense fallback={null}>
        <BgField />
        <ResponsiveGraph
          mouse={mouse}
          activeIndex={activeIndex}
          baseScale={ballScale}
          basePosition={ballPosition}
        />
        <SignalReady onReady={onReady} />
      </Suspense>
      <EffectComposer>
        <Bloom
          intensity={0.95}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={0.72}
        />
      </EffectComposer>
    </Canvas>
  );
}
