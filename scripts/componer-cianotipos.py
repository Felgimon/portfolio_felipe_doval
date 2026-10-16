"""
COMPOSICIONES GRANDES de los cianotipos (v8.3), para escritorio.

De cada original en brand/cianotipos/<nombre>.jpg (una fila de objetos en
knolling) se recortan los objetos uno por uno y se vuelven a acomodar, grandes,
con la forma del lugar vacío de su sección: una fila debajo de la bio (Perfil),
una grilla de 2x2 en la columna libre (Recorrido), etc. Siempre a 90 grados y
con la misma separación, como en el original.

Sale public/assets/cianotipos/<seccion>-grande.webp: el mismo mapa de luz que
scripts/gen-cianotipos.mjs (celeste fijo, la luz en el alfa).

    python3 scripts/componer-cianotipos.py
"""
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

ORIGEN = "brand/cianotipos"
DESTINO = "public/assets/cianotipos"
LUZ = (168, 191, 255)
ANCHO_FUENTE = 2000


def mapa_de_luz(nombre):
    """El alfa: lo que está más claro que el papel (igual que gen-cianotipos.mjs)."""
    img = Image.open(f"{ORIGEN}/{nombre}.jpg").convert("L")
    if img.width != ANCHO_FUENTE:
        img = img.resize((ANCHO_FUENTE, round(img.height * ANCHO_FUENTE / img.width)), Image.LANCZOS)
    g = np.asarray(img, dtype=np.float32)
    p50, p995 = np.percentile(g, 50), np.percentile(g, 99.5)
    bajo = p50 + 10
    alto = max(p995, bajo + 40)
    a = np.clip(((g - bajo) / (alto - bajo) - 0.05) / 0.95, 0, 1) ** 0.9
    return (a * 255).astype(np.uint8)


def objetos(alfa, umbral=90):
    """Cajas de los objetos, de izquierda a derecha (componentes conexos del alfa;
    las partes de un mismo objeto que casi se tocan, como dos zapatillas o dos
    columnas de teclas, quedan juntas)."""
    h, w = alfa.shape
    k = 4
    m = Image.fromarray(((alfa > umbral) * 255).astype("uint8")).resize((w // k, h // k)).filter(ImageFilter.MaxFilter(3))
    b = np.asarray(m) > 0
    vis = np.zeros_like(b, bool)
    cajas = []
    for y in range(b.shape[0]):
        for x in range(b.shape[1]):
            if not b[y, x] or vis[y, x]:
                continue
            q = deque([(y, x)])
            vis[y, x] = True
            ys, xs = [y], [x]
            while q:
                cy, cx = q.popleft()
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < b.shape[0] and 0 <= nx < b.shape[1] and b[ny, nx] and not vis[ny, nx]:
                        vis[ny, nx] = True
                        q.append((ny, nx))
                        ys.append(ny)
                        xs.append(nx)
            if len(ys) > 400:
                pad = 3 * k
                cajas.append((max(0, min(xs) * k - pad), max(0, min(ys) * k - pad), min(w, (max(xs) + 1) * k + pad), min(h, (max(ys) + 1) * k + pad)))
    junto = True
    while junto:
        junto = False
        for i in range(len(cajas)):
            for j in range(i + 1, len(cajas)):
                a, b2 = cajas[i], cajas[j]
                if a[0] - 4 <= b2[2] and b2[0] - 4 <= a[2] and a[1] - 4 <= b2[3] and b2[1] - 4 <= a[3]:
                    cajas[i] = (min(a[0], b2[0]), min(a[1], b2[1]), max(a[2], b2[2]), max(a[3], b2[3]))
                    del cajas[j]
                    junto = True
                    break
            if junto:
                break
    return sorted(cajas, key=lambda c: (c[0], c[1]))


def componer(nombre, filas, escala, separacion, salida, alinear="centro", umbral=90):
    """filas: listas de índices de objeto (de izquierda a derecha en el original)."""
    alfa = mapa_de_luz(nombre)
    cajas = objetos(alfa, umbral)
    piezas = [Image.fromarray(alfa[y0:y1, x0:x1]) for x0, y0, x1, y1 in cajas]
    piezas = [p.resize((max(1, round(p.width * escala)), max(1, round(p.height * escala))), Image.LANCZOS) for p in piezas]
    anchos = [sum(piezas[i].width for i in fila) + separacion * (len(fila) - 1) for fila in filas]
    altos = [max(piezas[i].height for i in fila) for fila in filas]
    margen = separacion
    W = max(anchos) + 2 * margen
    H = sum(altos) + separacion * (len(filas) - 1) + 2 * margen
    lienzo = Image.new("L", (W, H), 0)
    y = margen
    for fila, ancho, alto in zip(filas, anchos, altos):
        x = margen + (W - 2 * margen - ancho) // 2 if alinear == "centro" else margen
        for i in fila:
            p = piezas[i]
            lienzo.paste(p, (x, y + (alto - p.height) // 2))
            x += p.width + separacion
        y += alto + separacion
    rgba = Image.new("RGBA", (W, H), LUZ + (0,))
    rgba.putalpha(lienzo)
    rgba.save(f"{DESTINO}/{salida}.webp", quality=60, method=6)
    print(f"{salida}: {W}x{H} ({len(cajas)} objetos en {nombre})")


def recortar(nombre, salida, margen=60):
    """Cuando la composición original ya sirve (las tazas en espejo): sólo se
    recorta al contenido, sin el papel de más."""
    alfa = mapa_de_luz(nombre)
    cajas = [c for c in objetos(alfa) if (c[2] - c[0]) * (c[3] - c[1]) > 40000]
    x0 = max(0, min(c[0] for c in cajas) - margen)
    y0 = max(0, min(c[1] for c in cajas) - margen)
    x1 = min(alfa.shape[1], max(c[2] for c in cajas) + margen)
    y1 = min(alfa.shape[0], max(c[3] for c in cajas) + margen)
    rgba = Image.new("RGBA", (x1 - x0, y1 - y0), LUZ + (0,))
    rgba.putalpha(Image.fromarray(alfa[y0:y1, x0:x1]))
    rgba.save(f"{DESTINO}/{salida}.webp", quality=60, method=6)
    print(f"{salida}: {x1 - x0}x{y1 - y0} (recorte de {nombre})")


# Perfil: la lupa, el lápiz, la protoboard y la lamparita, en fila debajo de la bio
componer("curiosidad", [[0, 1, 2, 3]], 1.0, 90, "perfil-grande")
# Enfoque: el juego de dibujo entero (la regla arriba y debajo las cuatro piezas)
componer("enfoque", [[0], [1, 2, 3, 4]], 1.0, 50, "enfoque-grande")
# Trabajo: la libreta, los anteojos, el cable y las teclas, en una fila larga
componer("herramientas", [[0, 1, 2, 3]], 1.0, 110, "trabajo-grande")
# Recorrido: 2x2 en la columna libre (zapatillas y pelota; llaves y tarjeta)
componer("movimiento", [[0, 3], [1, 2]], 1.0, 80, "recorrido-grande")
# Contacto: las dos tazas y el azúcar, en espejo
recortar("gente", "contacto-grande")
