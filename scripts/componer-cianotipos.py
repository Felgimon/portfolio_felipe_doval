"""
COMPOSICIONES GRANDES de los cianotipos (v8.3; dispersas desde la v9.1).

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
MAXIMO = 1800


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


def dispersar(salida, ancho, alto, piezas, margen=40):
    """v9.1: ORDEN ADENTRO, DESORDEN AFUERA. Cada objeto sigue impecable (el
    cable enrollado y atado, los lápices derechos), pero la mesa no: cada uno
    va donde cayó, girado a su manera, como una idea que todavía no se acomodó.

    piezas: (original, índice del objeto, centro x, centro y en fracciones del
    lienzo, giro en grados, escala). Los objetos pueden tocarse apenas: se
    juntan con el máximo de luz, como dos objetos sobre el mismo papel."""
    lienzo = np.zeros((alto, ancho), np.uint8)
    cache = {}
    for nombre, i, cx, cy, giro, escala, *umbral in piezas:
        clave = (nombre, *umbral)
        if clave not in cache:
            alfa = mapa_de_luz(nombre)
            cache[clave] = (alfa, objetos(alfa, *umbral))
        alfa, cajas = cache[clave]
        x0, y0, x1, y1 = cajas[i]
        p = Image.fromarray(alfa[y0:y1, x0:x1])
        p = p.resize((max(1, round(p.width * escala)), max(1, round(p.height * escala))), Image.LANCZOS)
        p = p.rotate(giro, resample=Image.BICUBIC, expand=True)
        a = np.asarray(p)
        px, py = round(cx * ancho - a.shape[1] / 2), round(cy * alto - a.shape[0] / 2)
        # lo que se sale del lienzo se recorta (no debería: los márgenes lo evitan)
        sx0, sy0 = max(0, -px), max(0, -py)
        dx0, dy0 = max(0, px), max(0, py)
        w = min(a.shape[1] - sx0, ancho - dx0)
        h = min(a.shape[0] - sy0, alto - dy0)
        if w <= 0 or h <= 0:
            continue
        zona = lienzo[dy0:dy0 + h, dx0:dx0 + w]
        np.maximum(zona, a[sy0:sy0 + h, sx0:sx0 + w], out=zona)
    luz = Image.fromarray(lienzo)
    # en pantalla nunca pasa de ~900 px de ancho (1800 en una pantalla retina)
    if ancho > MAXIMO:
        luz = luz.resize((MAXIMO, round(alto * MAXIMO / ancho)), Image.LANCZOS)
    rgba = Image.new("RGBA", luz.size, LUZ + (0,))
    rgba.putalpha(luz)
    rgba.save(f"{DESTINO}/{salida}.webp", quality=60, alpha_quality=60, method=6)
    print(f"{salida}: {luz.width}x{luz.height} ({len(piezas)} objetos dispersos)")


CUR, ENF, HER, MOV, GEN = "curiosidad", "enfoque", "herramientas", "movimiento", "gente"
PIANO, LIB, MESA, MUS = "nuevos/piano", "nuevos/libros", "nuevos/mesa", "nuevos/musica"

# --- ESCRITORIO ---
# Portada: la música, a la medida del hero (1440x900 → el mismo lienzo), sólo
# donde la foto no tapa.
dispersar("musica-grande", 1600, 1000, [
    # el piano, acostado en el aire entre "Doval" y la bajada
    (PIANO, 0, 0.25, 0.62, 78, 0.5),
    # arriba, alrededor de la foto: los auriculares y el vinilo
    (MUS, 0, 0.66, 0.11, 16, 0.45),
    (MUS, 1, 0.88, 0.17, -21, 0.5),
    # y el metrónomo en el hueco entre la bajada y la foto
    (MESA, 3, 0.465, 0.89, 12, 0.5),
])
# Perfil: lo de curioso (la lupa, el lápiz, la protoboard, la lamparita), los libros y el cubo
dispersar("perfil-grande", 2700, 1150, [
    (CUR, 0, 0.08, 0.48, -21, 1.15),
    (CUR, 1, 0.21, 0.62, 63, 1.15),
    (LIB, 0, 0.37, 0.40, -8, 1.15),
    (CUR, 2, 0.53, 0.58, 14, 1.15),
    (MESA, 1, 0.66, 0.28, 23, 1.2),
    (CUR, 3, 0.77, 0.50, -27, 1.15),
    (LIB, 1, 0.93, 0.72, 11, 0.8),
])
# Enfoque: el juego de dibujo, cada pieza girada a su manera
dispersar("enfoque-grande", 1800, 1600, [
    (ENF, 0, 0.47, 0.17, 19, 1.05),
    (ENF, 1, 0.22, 0.58, -13, 1.05),
    (ENF, 2, 0.53, 0.60, 34, 1.05),
    (ENF, 3, 0.70, 0.43, -52, 1.05),
    (ENF, 4, 0.82, 0.75, 9, 1.05),
])
# Trabajo: la libreta, los anteojos, la laptop, el cable y las teclas
dispersar("trabajo-grande", 3200, 1000, [
    (HER, 0, 0.08, 0.52, -11, 1.2),
    (HER, 1, 0.26, 0.40, 15, 1.2),
    (MESA, 2, 0.48, 0.52, -6, 1.15),
    (HER, 2, 0.71, 0.44, 0, 1.2),
    (HER, 3, 0.90, 0.58, 24, 1.25),
])
# Recorrido: lo de moverse (zapatillas, llaves, tarjeta) y las dos pelotas
dispersar("recorrido-grande", 1500, 1600, [
    (MOV, 0, 0.30, 0.27, 13, 1.1),
    (MOV, 3, 0.75, 0.22, 0, 1.1),
    (LIB, 2, 0.70, 0.62, 0, 1.0),
    (MOV, 1, 0.20, 0.64, -36, 1.4),
    (MOV, 2, 0.42, 0.86, 21, 1.15),
])
# Contacto: las dos tazas, que ya no están en espejo, y el mate
dispersar("contacto-grande", 1800, 1000, [
    (GEN, 0, 0.22, 0.42, -14, 1.2),
    (GEN, 1, 0.58, 0.62, 22, 1.2),
    (MESA, 0, 0.86, 0.34, 11, 1.25),
])

# --- CELULAR: una franja arriba de cada título, con menos objetos y más grandes ---
dispersar("musica-m", 1600, 900, [
    (PIANO, 0, 0.30, 0.52, -12, 0.9),
    (MUS, 0, 0.70, 0.30, 16, 0.8),
    (MUS, 2, 0.82, 0.78, 27, 0.8),
])
dispersar("perfil-m", 1600, 760, [
    (CUR, 0, 0.12, 0.50, -21, 1.0),
    (LIB, 0, 0.38, 0.46, -8, 1.0),
    (MESA, 1, 0.60, 0.30, 23, 1.1),
    (CUR, 3, 0.83, 0.52, -27, 1.0),
])
dispersar("enfoque-m", 1600, 760, [
    (ENF, 1, 0.14, 0.52, -13, 0.85),
    (ENF, 2, 0.42, 0.50, 34, 0.85),
    (ENF, 3, 0.62, 0.48, -52, 0.85),
    (ENF, 4, 0.85, 0.52, 9, 0.8),
])
dispersar("trabajo-m", 1600, 760, [
    (HER, 1, 0.20, 0.36, 15, 1.0),
    (MESA, 2, 0.52, 0.56, -6, 0.9),
    (HER, 2, 0.84, 0.46, 0, 1.0),
])
dispersar("recorrido-m", 1600, 760, [
    (MOV, 0, 0.16, 0.52, 13, 1.0),
    (MOV, 1, 0.39, 0.50, -36, 1.2),
    (MOV, 3, 0.60, 0.48, 0, 0.95),
    (LIB, 2, 0.85, 0.52, 0, 0.9),
])
dispersar("contacto-m", 1600, 760, [
    (GEN, 0, 0.20, 0.50, -14, 1.0),
    (GEN, 1, 0.52, 0.52, 22, 1.0),
    (MESA, 0, 0.82, 0.48, 11, 1.05),
])
