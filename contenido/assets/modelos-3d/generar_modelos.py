# Generador de modelos 3D (.glb) para el hero del portfolio — 100% procedural, licencia CC0 (son tuyos).
# 1) pelota-facetada.glb   → icosaedro truncado: la geometría clásica del balón de fútbol.
# 2) pelota-estructura.glb → el mismo poliedro como red de nodos y aristas (fútbol × ML/redes).
# 3) esfera-lowpoly.glb    → icoesfera facetada, alternativa más abstracta.
import numpy as np
import trimesh
from itertools import product

OUT = "/home/claude/contenido/assets/modelos-3d"
PHI = (1 + 5 ** 0.5) / 2

# --- Vértices del icosaedro truncado: permutaciones cíclicas con todos los signos ---
bases = [(0.0, 1.0, 3 * PHI), (1.0, 2 + PHI, 2 * PHI), (2.0, 1 + 2 * PHI, PHI)]
verts = set()
for b in bases:
    ciclicas = [(b[0], b[1], b[2]), (b[1], b[2], b[0]), (b[2], b[0], b[1])]
    for (x, y, z) in ciclicas:
        for sx, sy, sz in product([1, -1], repeat=3):
            verts.add((round(sx * x, 9), round(sy * y, 9), round(sz * z, 9)))
verts = np.array(sorted(verts))
verts = verts / np.linalg.norm(verts, axis=1).max()  # radio 1
assert len(verts) == 60, f"esperaba 60 vértices, hay {len(verts)}"

# --- 1) Pelota facetada (hull del poliedro) ---
pelota = trimesh.Trimesh(vertices=verts).convex_hull
pelota.export(f"{OUT}/pelota-facetada.glb")

# --- 2) Estructura: aristas reales (no las diagonales de la triangulación) como cilindros ---
ang = pelota.face_adjacency_angles
aristas = pelota.face_adjacency_edges[ang > 1e-4]
aristas = np.unique(np.sort(aristas, axis=1), axis=0)
print(f"vertices: {len(pelota.vertices)}, aristas reales: {len(aristas)}")  # 60 / 90 esperado

R_STRUT, R_NODO = 0.022, 0.036
partes = []
for a, b in aristas:
    seg = np.array([pelota.vertices[a], pelota.vertices[b]])
    partes.append(trimesh.creation.cylinder(radius=R_STRUT, segment=seg, sections=8))
for v in pelota.vertices:
    s = trimesh.creation.icosphere(subdivisions=1, radius=R_NODO)
    s.apply_translation(v)
    partes.append(s)
estructura = trimesh.util.concatenate(partes)
estructura.export(f"{OUT}/pelota-estructura.glb")

# --- 3) Esfera low-poly ---
esfera = trimesh.creation.icosphere(subdivisions=2, radius=1.0)
esfera.export(f"{OUT}/esfera-lowpoly.glb")

# --- Verificación: recargar cada glb y reportar ---
print("\nVerificación (recarga de cada .glb):")
for nombre in ["pelota-facetada", "pelota-estructura", "esfera-lowpoly"]:
    m = trimesh.load(f"{OUT}/{nombre}.glb", force="mesh")
    ok = m.is_watertight if nombre != "pelota-estructura" else "n/a (concatenado)"
    print(f"  {nombre}: {len(m.vertices)} verts, {len(m.faces)} tris, watertight={ok}, bounds_r={np.abs(m.bounds).max():.2f}")

# --- Previews con matplotlib ---
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def plot(ax, mesh, titulo, color, edge):
    v, f = mesh.vertices, mesh.faces
    ax.plot_trisurf(v[:, 0], v[:, 1], f, v[:, 2], color=color, edgecolor=edge, linewidth=0.35, shade=True)
    ax.set_title(titulo, fontsize=11, pad=8)
    ax.set_axis_off()
    ax.set_box_aspect([1, 1, 1])
    ax.view_init(elev=18, azim=32)

fig = plt.figure(figsize=(13, 4.6), dpi=150)
fig.patch.set_facecolor("#F6F4F0")
modelos = [
    (trimesh.load(f"{OUT}/pelota-facetada.glb", force="mesh"), "pelota-facetada.glb", "#74ACDF", "#0E1116"),
    (trimesh.load(f"{OUT}/pelota-estructura.glb", force="mesh"), "pelota-estructura.glb", "#0E1116", "#0E1116"),
    (trimesh.load(f"{OUT}/esfera-lowpoly.glb", force="mesh"), "esfera-lowpoly.glb", "#74ACDF", "#0E1116"),
]
for i, (m, t, c, e) in enumerate(modelos, 1):
    plot(fig.add_subplot(1, 3, i, projection="3d"), m, t, c, e)
plt.tight_layout()
plt.savefig("/home/claude/modelos-preview.png", bbox_inches="tight")
for m, t, c, e in modelos:
    f2 = plt.figure(figsize=(4.5, 4.5), dpi=130)
    f2.patch.set_facecolor("#F6F4F0")
    plot(f2.add_subplot(111, projection="3d"), m, t, c, e)
    f2.savefig(f"{OUT}/previews/{t.replace('.glb', '')}.png", bbox_inches="tight")
    plt.close(f2)
print("\nPreviews generadas.")
