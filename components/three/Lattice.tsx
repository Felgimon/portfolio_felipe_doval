"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Radio canónico del contenedor (unidades de escena, antes del scale global). */
export const BALL_R = 1;

/**
 * Contenedor del sol: ICOSAEDRO TRUNCADO (la pelota de fútbol — la marca de
 * Felipe) construido con la matemática exacta: 60 vértices / 90 aristas
 * (12 pentágonos + 20 hexágonos), orientado con un HEXÁGONO de frente → el sol
 * y el FD quedan en una ventana limpia, sin struts cruzando el centro.
 * Los struts son cilindros finos de cromo con juntas esféricas, mergeados en
 * UNA geometría (1 draw call); adentro, una esfera de vidrio físico.
 */
function truncatedIcosahedron(R: number): {
  verts: THREE.Vector3[];
  edges: [number, number][];
} {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw: [number, number, number][] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const base = raw.map((v) => new THREE.Vector3(...v).normalize());
  const faces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  // Aristas únicas + vecindad del icosaedro base.
  const edgeSet = new Set<string>();
  const neighbors = new Map<number, Set<number>>();
  for (const [a, b, c] of faces) {
    for (const [x, y] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      edgeSet.add(x < y ? `${x}-${y}` : `${y}-${x}`);
      if (!neighbors.has(x)) neighbors.set(x, new Set());
      if (!neighbors.has(y)) neighbors.set(y, new Set());
      neighbors.get(x)!.add(y);
      neighbors.get(y)!.add(x);
    }
  }

  // Truncado: un vértice a 1/3 de cada extremo de cada arista, sobre la esfera.
  const verts: THREE.Vector3[] = [];
  const idx = new Map<string, number>();
  const pKey = (a: number, b: number) => `${a}>${b}`;
  for (const e of edgeSet) {
    const [a, b] = e.split("-").map(Number);
    for (const [x, y] of [[a, b], [b, a]] as [number, number][]) {
      const p = base[x].clone().lerp(base[y], 1 / 3).normalize().multiplyScalar(R);
      idx.set(pKey(x, y), verts.length);
      verts.push(p);
    }
  }

  const edges: [number, number][] = [];
  // Struts "puente" (tercio medio de cada arista original): 30.
  for (const e of edgeSet) {
    const [a, b] = e.split("-").map(Number);
    edges.push([idx.get(pKey(a, b))!, idx.get(pKey(b, a))!]);
  }
  // Anillos pentagonales alrededor de cada vértice original: 12 × 5 = 60.
  const flat = new THREE.Vector3();
  const refY = new THREE.Vector3();
  for (const [v, ns] of neighbors) {
    const axis = base[v];
    const ring = [...ns].map((n) => {
      flat.copy(base[n]).addScaledVector(axis, -base[n].dot(axis)).normalize();
      return { n, d: flat.clone() };
    });
    refY.crossVectors(axis, ring[0].d);
    const ordered = ring
      .map(({ n, d }) => ({ n, ang: Math.atan2(d.dot(refY), d.dot(ring[0].d)) }))
      .sort((p, q) => p.ang - q.ang);
    for (let i = 0; i < ordered.length; i++) {
      const na = ordered[i].n;
      const nb = ordered[(i + 1) % ordered.length].n;
      edges.push([idx.get(pKey(v, na))!, idx.get(pKey(v, nb))!]);
    }
  }

  // Orientar un HEXÁGONO (cara del icosaedro base) hacia +z (la cámara de la
  // portada): la ventana limpia para el sol + FD.
  const centroid = new THREE.Vector3();
  const best = new THREE.Vector3(0, 0, 1);
  let bestZ = -2;
  for (const [a, b, c] of faces) {
    centroid.copy(base[a]).add(base[b]).add(base[c]).normalize();
    if (centroid.z > bestZ) {
      bestZ = centroid.z;
      best.copy(centroid);
    }
  }
  const q = new THREE.Quaternion().setFromUnitVectors(
    best,
    new THREE.Vector3(0, 0, 1),
  );
  for (const v of verts) v.applyQuaternion(q);

  return { verts, edges };
}

function buildLattice(
  R: number,
  strutR: number,
  jointR: number,
): THREE.BufferGeometry {
  const { verts, edges } = truncatedIcosahedron(R);
  const parts: THREE.BufferGeometry[] = [];
  const dir = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();

  for (const [i, j] of edges) {
    const a = verts[i];
    const b = verts[j];
    dir.subVectors(b, a);
    const len = dir.length();
    const cyl = new THREE.CylinderGeometry(strutR, strutR, len, 10, 1, true);
    q.setFromUnitVectors(up, dir.normalize());
    cyl.applyQuaternion(q);
    mid.addVectors(a, b).multiplyScalar(0.5);
    cyl.translate(mid.x, mid.y, mid.z);
    parts.push(cyl);
  }
  for (const v of verts) {
    const s = new THREE.SphereGeometry(jointR, 14, 14);
    s.translate(v.x, v.y, v.z);
    parts.push(s);
  }

  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  if (!merged) throw new Error("lattice: merge falló");
  return merged;
}

export function Lattice({ lite }: { lite: boolean }) {
  const geo = useMemo(
    () => buildLattice(BALL_R, BALL_R * 0.02, BALL_R * 0.042),
    [],
  );
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group>
      {/* Exo-lattice de cromo claro: refleja el cielo (envmap) y la luz cálida
          del sol. En lite (software) un metal simple iluminado por luces. */}
      <mesh geometry={geo}>
        {lite ? (
          <meshStandardMaterial color="#e7edf2" metalness={0.55} roughness={0.35} />
        ) : (
          <meshStandardMaterial
            color="#f2f6fa"
            metalness={0.9}
            roughness={0.22}
            envMapIntensity={1.5}
          />
        )}
      </mesh>
      {/* Esfera de vidrio físico: el sol se ve A TRAVÉS del vidrio y el cielo
          se refleja en su superficie. ior bajo = burbuja fina, sin efecto lupa.
          Solo en GPU real (la transmisión re-renderiza la escena). */}
      {!lite && (
        <mesh>
          <sphereGeometry args={[BALL_R * 0.94, 48, 48]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={1}
            thickness={0.05}
            roughness={0.05}
            ior={1.08}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.1}
            side={THREE.FrontSide}
          />
        </mesh>
      )}
    </group>
  );
}
