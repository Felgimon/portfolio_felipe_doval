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
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BalonGrafo, type MousePos } from "./BalonGrafo";
import { heroBgVertex, heroBgFragment } from "./shaders";

/** Puntero normalizado (-1..1) desde `window` — funciona aunque el canvas
 * tenga pointer-events:none (el texto queda seleccionable por encima). */
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

/** Luz agua que persigue al puntero: enciende los nodos cercanos. */
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

/** Campo shader de fondo (ruido agua sutil). */
function BgField() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#8fe3c6") },
      uFocus: { value: new THREE.Vector2(0.6, 0.55) },
    }),
    [],
  );
  useFrame((_, delta) => {
    const m = mat.current;
    if (m) m.uniforms.uTime.value += Math.min(delta, 0.05);
  });
  return (
    <mesh position={[0, 0, -3]} scale={[18, 18, 1]}>
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

/** Ajusta escala/posición del balón según el ancho del canvas (responsive). */
function ResponsiveBall({
  mouse,
  baseScale,
  basePosition,
}: {
  mouse: RefObject<MousePos>;
  baseScale: number;
  basePosition: [number, number, number];
}) {
  const width = useThree((s) => s.size.width);
  const narrow = width < 700;
  const scale = baseScale * (narrow ? 0.82 : 1);
  const position: [number, number, number] = narrow
    ? [basePosition[0] * 0.5, basePosition[1] + 0.15, basePosition[2]]
    : basePosition;
  return <BalonGrafo mouse={mouse} scale={scale} position={position} />;
}

/** Avisa cuando el contenido del Suspense (glb) ya montó = terminó de cargar. */
function SignalReady({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

export type HeroCanvasProps = {
  tier?: number;
  ballScale?: number;
  ballPosition?: [number, number, number];
  /** true → pausa el render (hero fuera del viewport) */
  paused?: boolean;
  /** se llama cuando el glb terminó de cargar */
  onReady?: () => void;
};

export default function HeroCanvas({
  tier = 3,
  ballScale = 2.05,
  ballPosition = [0, 0, 0],
  paused = false,
  onReady,
}: HeroCanvasProps) {
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
      <directionalLight
        position={[3, 4, 5]}
        intensity={0.9}
        color="#dff7ec"
      />
      <CursorLight mouse={mouse} />
      <Suspense fallback={null}>
        <BgField />
        <ResponsiveBall
          mouse={mouse}
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
