"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * CINTURÓN DE ASTEROIDES: el espacio VIVO alrededor del grafo. Rocas 3D
 * procedurales (nada de sprites) que cruzan el encuadre a alta velocidad
 * girando sobre su propio eje aleatorio, con paralaje real por banda de
 * profundidad: las cercanas pasan rápido, las lejanas navegan majestuosas.
 * Al salir del volumen renacen con otra trayectoria, otro eje y otro tamaño:
 * siempre hay tránsito. La superficie es una FOTO de roca lunar (cráteres
 * reales, NASA) sobre siluetas deformadas por bandas de ruido: cada asteroide
 * es único y ninguno es esférico.
 */
const AST_TEX = "/textures/asteroide.jpg";

/** Cantidad de rocas en vuelo (menos en render por software). */
const COUNT_FULL = 12;
const COUNT_LITE = 5;
/** Banda de profundidad: distancia de máximo acercamiento al origen. El piso
 * queda por encima de la órbita más lejana de la cámara (~12.7 en mobile):
 * ningún asteroide se cruza jamás entre la cámara y el balón. */
const D_MIN = 16;
const D_MAX = 58;

/* PRNG determinístico (mulberry32): el cinturón es reproducible entre cargas,
 * pero cada asteroide sale con forma, ruta y giro propios. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Roca procedural: icosaedro subdividido + deformación radial multibanda
 * (lóbulos grandes = silueta de papa; bandas medias = crestas; alta frecuencia
 * = rugosidad) + aplaste anisotrópico. El desplazamiento depende SOLO de la
 * posición → sin costuras; con los vértices soldados antes (mergeVertices),
 * las normales recalculadas quedan suaves. */
function makeAsteroidGeometry(rand: () => number): THREE.BufferGeometry {
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, 3), 1e-4);
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const bands: [number, number][] = [
    [1.4, 0.3],
    [2.9, 0.16],
    [6.5, 0.07],
    [11, 0.035],
  ];
  const dirs: THREE.Vector3[] = [];
  const freqs: number[] = [];
  const amps: number[] = [];
  const phases: number[] = [];
  for (const [f, a] of bands) {
    dirs.push(
      new THREE.Vector3(
        rand() * 2 - 1,
        rand() * 2 - 1,
        rand() * 2 - 1,
      ).normalize(),
    );
    freqs.push(f * (0.8 + rand() * 0.5));
    amps.push(a * (0.7 + rand() * 0.6));
    phases.push(rand() * Math.PI * 2);
  }
  const sy = 0.62 + rand() * 0.34;
  const sz = 0.72 + rand() * 0.4;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let r = 1;
    for (let j = 0; j < dirs.length; j++) {
      r += amps[j] * Math.sin(freqs[j] * v.dot(dirs[j]) + phases[j]);
    }
    pos.setXYZ(i, v.x * r, v.y * r * sy, v.z * r * sz);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** Estado de vuelo de una roca. */
type Flight = {
  vel: THREE.Vector3;
  axis: THREE.Vector3; // eje de giro propio, aleatorio por vida
  spin: number; // rad/s
  ttl: number; // segundos hasta renacer con otra trayectoria
};

const _p0 = new THREE.Vector3();
const _tmp = new THREE.Vector3();

/** (Re)lanza un asteroide: banda de profundidad al azar, punto de máximo
 * acercamiento sobre esa esfera y rumbo TANGENCIAL → cruza el encuadre en
 * línea recta y nunca apunta al centro. `warm` lo suelta en un punto aleatorio
 * del recorrido (primer poblado: el cinturón nace ya en tránsito). */
function launchAsteroid(
  m: THREE.Mesh,
  st: Flight,
  rand: () => number,
  warm: boolean,
) {
  const d = D_MIN + rand() * (D_MAX - D_MIN);
  // Punto sobre la esfera de radio d, SESGADO al hemisferio -z (la cámara vive
  // en el cono frontal +z mirando al origen: -z es el fondo visible detrás del
  // balón). 70% de los pasos suceden donde se ven; el resto, donde toque.
  const z =
    rand() < 0.7 ? -(0.1 + 0.9 * rand()) : rand() * 2 - 1;
  const th = rand() * Math.PI * 2;
  const rxy = Math.sqrt(1 - z * z);
  _p0.set(rxy * Math.cos(th), rxy * Math.sin(th), z).multiplyScalar(d);
  // Rumbo tangencial (perpendicular al radio) con roll aleatorio.
  _tmp.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
  _tmp.crossVectors(_tmp, _p0);
  if (_tmp.lengthSq() < 1e-8) _tmp.set(-_p0.y, _p0.x, 0); // paralelo: fallback ⊥
  _tmp.normalize();
  const speed = 6 + (d - D_MIN) * 0.25 + rand() * 5;
  st.vel.copy(_tmp).multiplyScalar(speed);
  // Recorrido completo: entra lejos, roza el punto de acercamiento y sale.
  const L = d * 1.5 + 20;
  const done = warm ? rand() : 0; // fracción ya recorrida
  m.position
    .copy(_p0)
    .addScaledVector(_tmp, -L + 2 * L * done);
  st.ttl = ((2 * L) / speed) * (1 - done);
  // Giro propio: eje aleatorio; un cuarto de las rocas tumbea rápido.
  st.axis
    .set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1)
    .normalize();
  st.spin = (0.4 + rand() * 1.8) * (rand() < 0.25 ? 2.2 : 1);
  // Tamaño por banda (las lejanas son más grandes: paralaje verosímil).
  m.scale.setScalar(d * 0.045 * (0.7 + rand() * 0.9));
  m.rotation.set(rand() * Math.PI * 2, rand() * Math.PI * 2, 0);
}

/** Avance por frame: traslación recta + giro sobre el eje propio; al agotar el
 * recorrido, renace con otra trayectoria (mutación fuera del componente). */
function flyAsteroids(
  meshes: (THREE.Mesh | null)[],
  states: Flight[],
  rand: () => number,
  delta: number,
) {
  for (let i = 0; i < states.length; i++) {
    const m = meshes[i];
    if (!m) continue;
    const st = states[i];
    m.position.addScaledVector(st.vel, delta);
    m.rotateOnAxis(st.axis, st.spin * delta);
    st.ttl -= delta;
    if (st.ttl <= 0) launchAsteroid(m, st, rand, false);
  }
}

export function Asteroids({
  lite,
  reduced,
}: {
  lite: boolean;
  reduced: boolean;
}) {
  const count = lite ? COUNT_LITE : COUNT_FULL;
  const tex = useTexture(AST_TEX);

  // 4 siluetas base × 4 materiales (tinte + ventana distinta de la foto de
  // roca) = 16 combinaciones: con escala y giro propios, ninguna roca se
  // parece a otra. Geometrías y materiales COMPARTIDOS entre instancias.
  const geos = useMemo(() => {
    const rand = mulberry32(0x5eed);
    return Array.from({ length: 4 }, () => makeAsteroidGeometry(rand));
  }, []);
  const mats = useMemo(() => {
    const rand = mulberry32(0xa57e);
    const tints = ["#c9c3b8", "#b6afa5", "#a9a9ae", "#bdb1a1"];
    return tints.map((c) => {
      const t = tex.clone();
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.repeat.set(1 + rand() * 1.5, 1 + rand());
      t.offset.set(rand(), rand());
      return new THREE.MeshStandardMaterial({
        map: t,
        color: c,
        roughness: 0.95,
        metalness: 0.04,
        envMapIntensity: lite ? 0 : 0.35,
      });
    });
  }, [tex, lite]);
  useEffect(() => {
    return () => {
      for (const g of geos) g.dispose();
      for (const m of mats) {
        m.map?.dispose();
        m.dispose();
      }
    };
  }, [geos, mats]);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const randRef = useRef(mulberry32(20260712));
  const states = useMemo<Flight[]>(
    () =>
      Array.from({ length: count }, () => ({
        vel: new THREE.Vector3(),
        axis: new THREE.Vector3(0, 1, 0),
        spin: 0,
        ttl: 0,
      })),
    [count],
  );

  // Primer poblado: cada roca nace ya en tránsito, repartida por su recorrido.
  useEffect(() => {
    const rand = randRef.current;
    for (let i = 0; i < states.length; i++) {
      const m = meshRefs.current[i];
      if (m) launchAsteroid(m, states[i], rand, true);
    }
  }, [states]);

  useFrame((_, delta) => {
    if (reduced) return; // reduced-motion: cinturón estático, sin tránsito
    flyAsteroids(meshRefs.current, states, randRef.current, Math.min(delta, 0.1));
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          geometry={geos[i % geos.length]}
          material={mats[(i * 7 + 3) % mats.length]}
        />
      ))}
    </group>
  );
}
