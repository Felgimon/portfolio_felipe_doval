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
import { GraphNodes, useBallRadius, nodePositions } from "./GraphNodes";
import { heroBgVertex, heroBgFragment } from "./shaders";

const MODEL = "/models/pelota-estructura-transformed.glb";

type MousePos = { x: number; y: number };

/** Proyección 2D de un nodo (px de viewport) + si mira a la cámara. */
export type NodeProj = { x: number; y: number; front: boolean };

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
        color="#123028"
        emissive="#59c9a6"
        emissiveIntensity={0.5}
        metalness={0.5}
        roughness={0.4}
      />
    </mesh>
  );
}

// Temporales reutilizados en la proyección (sin allocs por frame).
const _v = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _center = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _zAxis = new THREE.Vector3(0, 0, 1);

/**
 * Grupo del grafo. `sway` (exterior) hace parallax + sway; `aim` (interior)
 * ROTA para encarar el nodo activo a la cámara (según el scroll). Además
 * proyecta las posiciones 2D de los nodos a `projRef` para los labels
 * clickeables del overlay.
 */
function GraphGroup({
  mouse,
  activeIndex,
  scale,
  position,
  onProject,
}: {
  mouse: RefObject<MousePos>;
  activeIndex: number;
  scale: number;
  position: [number, number, number];
  onProject?: (p: NodeProj[]) => void;
}) {
  const sway = useRef<THREE.Group>(null);
  const aim = useRef<THREE.Group>(null);
  const buf = useRef<NodeProj[]>([]);
  const radius = useBallRadius();
  const positions = useMemo(() => nodePositions(radius), [radius]);
  const { camera, size } = useThree();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);

    const s = sway.current;
    if (s) {
      const mx = mouse.current?.x ?? 0;
      const my = mouse.current?.y ?? 0;
      const ty = mx * 0.22 + Math.sin(t * 0.25) * 0.04;
      const tx = -my * 0.14 + Math.sin(t * 0.2) * 0.03;
      s.rotation.y += (ty - s.rotation.y) * 0.06;
      s.rotation.x += (tx - s.rotation.x) * 0.06;
      s.position.y = position[1] + Math.sin(t * 0.5) * 0.03;
    }

    const a = aim.current;
    if (!a) return;

    // Encarar el nodo activo (o identidad en la portada).
    if (activeIndex >= 0 && activeIndex < positions.length) {
      _dir.copy(positions[activeIndex]).normalize();
      _q.setFromUnitVectors(_dir, _zAxis);
    } else {
      _q.identity();
    }
    a.quaternion.slerp(_q, 1 - Math.pow(0.0016, d));

    // Proyección 2D de cada nodo para el overlay clickeable. Se muta un ref
    // PROPIO (permitido) y se entrega por callback.
    if (onProject) {
      a.updateWorldMatrix(true, false);
      a.getWorldPosition(_center);
      const b = buf.current;
      for (let i = 0; i < positions.length; i++) {
        _v.copy(positions[i]).applyMatrix4(a.matrixWorld);
        const front = _v.z > _center.z;
        _v.project(camera);
        b[i] = {
          x: ((_v.x + 1) / 2) * size.width,
          y: (1 - (_v.y + 1) / 2) * size.height,
          front,
        };
      }
      onProject(b);
    }
  });

  return (
    <group ref={sway} scale={scale} position={position}>
      <group ref={aim}>
        <BalonMesh />
        <GraphNodes activeIndex={activeIndex} />
      </group>
    </group>
  );
}

/** Escala/posición del grafo según el ancho del canvas (responsive). */
function ResponsiveGraph({
  mouse,
  activeIndex,
  baseScale,
  basePosition,
  onProject,
}: {
  mouse: RefObject<MousePos>;
  activeIndex: number;
  baseScale: number;
  basePosition: [number, number, number];
  onProject?: (p: NodeProj[]) => void;
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
      onProject={onProject}
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
  onProject?: (p: NodeProj[]) => void;
};

export default function GraphCanvas({
  tier = 3,
  activeIndex = -1,
  ballScale = 1.6,
  ballPosition = [0.72, 0, 0],
  paused = false,
  onReady,
  onProject,
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
          onProject={onProject}
        />
        <SignalReady onReady={onReady} />
      </Suspense>
      <EffectComposer>
        <Bloom
          intensity={0.82}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.4}
          mipmapBlur
          radius={0.7}
        />
      </EffectComposer>
    </Canvas>
  );
}
