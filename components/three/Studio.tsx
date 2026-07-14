"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BALL_R, GRAPH_SCALE } from "./scene-config";

/**
 * ESTUDIO BLANCO 3D: reemplaza al espacio. El sol flota en una cúpula blanca
 * (pared al fondo + piso, tipo ciclorama de fotografía de producto) y proyecta
 * su SOMBRA suave en el piso. Da un aire limpio y profesional, como un render
 * de producto sobre fondo infinito.
 *
 * - Cúpula: una esfera enorme (BackSide) con un shader de gradiente basado en la
 *   ALTURA (piso luminoso abajo → pared clara arriba). Es camera-robusta: la
 *   cámara orbita adentro y siempre ve blanco, sin costuras ni horizonte duro.
 * - Sombra: un óvalo suave (textura radial) tumbado bajo el sol; en perspectiva
 *   se lee como la sombra apoyada en el piso (el óvalo del dibujo de Feli).
 *
 * Los soles son shaders sin iluminar → el estudio no necesita luces (más barato
 * y sin materiales PBR que tonemapear distinto). */

/** Radio del sol central en unidades de mundo (SunCore usa BALL_R*0.5). */
const SUN_WORLD_R = BALL_R * 0.5 * GRAPH_SCALE;
/** Altura del piso: por debajo del mini-sol más bajo (Contacto) y su sombra. */
const FLOOR_Y = -BALL_R * 0.86 * GRAPH_SCALE - SUN_WORLD_R * 0.55;

const domeVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
/* Gradiente de ciclorama: piso casi blanco → pared gris muy claro, con un
 * apenas-más-oscuro en el rincón inferior (la unión piso-pared). Sin tonemap
 * (shader crudo) → el blanco se mantiene blanco. */
const domeFragment = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  void main() {
    float y = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0); // 0 abajo .. 1 arriba
    vec3 floorC = vec3(0.972, 0.980, 0.990);
    vec3 wallC  = vec3(0.843, 0.874, 0.912);
    vec3 c = mix(floorC, wallC, smoothstep(0.30, 1.0, y));
    c = mix(c, wallC * 0.965, smoothstep(0.24, 0.0, y) * 0.5);
    gl_FragColor = vec4(c, 1.0);
  }
`;

/** Textura de sombra: óvalo radial oscuro-frío que se desvanece a transparente
 * (blur suave). Se compone en Normal sobre el piso claro → lo oscurece. */
function makeShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(28, 42, 60, 0.42)");
  g.addColorStop(0.45, "rgba(30, 44, 62, 0.26)");
  g.addColorStop(0.75, "rgba(32, 46, 64, 0.08)");
  g.addColorStop(1, "rgba(32, 46, 64, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Studio() {
  const dome = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: domeVertex,
        fragmentShader: domeFragment,
        side: THREE.BackSide,
        depthWrite: true,
        toneMapped: false,
      }),
    [],
  );
  const shadowTex = useMemo(() => makeShadowTexture(), []);
  useEffect(() => {
    return () => {
      dome.dispose();
      shadowTex.dispose();
    };
  }, [dome, shadowTex]);

  return (
    <group>
      {/* Cúpula infinita: la cámara orbita adentro (radio 44 >> distancia máxima
          de cámara ~9). */}
      <mesh material={dome} renderOrder={-10}>
        <sphereGeometry args={[44, 32, 24]} />
      </mesh>
      {/* Sombra del sol en el piso: óvalo suave tumbado (rotado horizontal). En
          perspectiva se ve elíptico, apoyado en el suelo, bajo el sol. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y, 0]}
        renderOrder={-5}
      >
        <planeGeometry args={[SUN_WORLD_R * 4.4, SUN_WORLD_R * 4.4]} />
        <meshBasicMaterial
          map={shadowTex}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
