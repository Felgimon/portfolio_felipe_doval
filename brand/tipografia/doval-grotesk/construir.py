"""Doval Grotesk: Archivo (OFL 1.1, sin Reserved Font Name) renombrada,
con flechas propias variables en peso y ancho (Archivo no trae flechas)."""
import math, sys
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib.tables.TupleVariation import TupleVariation
from fontTools.varLib import instancer

SRC, OUT = sys.argv[1], sys.argv[2]
f = TTFont(SRC)
f.ensureDecompiled()

# medidas por master, tomadas de la propia Archivo (guion y H)
def medir(wght, wdth):
    g = instancer.instantiateVariableFont(TTFont(SRC), {'wght': wght, 'wdth': wdth})
    gs = g.getGlyphSet(); cm = g.getBestCmap()
    from fontTools.pens.boundsPen import BoundsPen
    p = BoundsPen(gs); gs[cm[ord('-')]].draw(p); x0, y0, x1, y1 = p.bounds
    return dict(t=y1 - y0, c=(y0 + y1) / 2, sb=x0, wf=g['hmtx'][cm[ord('H')]][0] / 732)
MASTERS = {'base': (600, 100), 'wght-': (100, 100), 'wght+': (900, 100), 'wdth-': (600, 62), 'wdth+': (600, 125)}
M = {k: medir(*v) for k, v in MASTERS.items()}

def flecha_derecha(m):
    """Flecha → como un solo contorno de 9 puntos (asta + cabeza en chevrón)."""
    t, c, wf = m['t'], m['c'], m['wf']
    L = (520 + 1.2 * t) * (0.55 + 0.45 * wf)
    a = 150 + 0.75 * t
    x0, x1 = 0.0, L
    r2 = math.sqrt(2)
    return [(x1, c), (x1 - a, c - a), (x1 - a - t / r2, c - a + t / r2),
            (x1 - r2 * t - t / 2, c - t / 2), (x0, c - t / 2), (x0, c + t / 2),
            (x1 - r2 * t - t / 2, c + t / 2), (x1 - a - t / r2, c + a - t / r2), (x1 - a, c + a)]

def rotar(pts, ang, c):
    cx = sum(p[0] for p in pts) / len(pts)
    ca, sa = math.cos(ang), math.sin(ang)
    return [(cx + (x - cx) * ca - (y - c) * sa, c + (x - cx) * sa + (y - c) * ca) for x, y in pts]

def glifo(m, ang):
    pts = flecha_derecha(m)
    if ang: pts = rotar(pts, ang, m['c'])
    xmin = min(p[0] for p in pts)
    sb = m['sb'] * 1.2
    pts = [(round(x - xmin + sb), round(y)) for x, y in pts]
    if ang in (math.pi,):  # espejo: mantener sentido horario
        pass
    adv = round(max(p[0] for p in pts) + sb)
    return pts, adv

FLECHAS = {'arrowright': (0x2192, 0), 'arrowupright': (0x2197, math.pi / 4), 'arrowup': (0x2191, math.pi / 2),
           'arrowleft': (0x2190, math.pi), 'arrowdown': (0x2193, -math.pi / 2), 'arrowdownright': (0x2198, -math.pi / 4)}
TUPLAS = {'wght-': {'wght': (-1, -1, 0)}, 'wght+': {'wght': (0, 1, 1)}, 'wdth-': {'wdth': (-1, -1, 0)}, 'wdth+': {'wdth': (0, 1, 1)}}

orden = f.getGlyphOrder()
for nombre, (cp, ang) in FLECHAS.items():
    pts, adv = glifo(M['base'], ang)
    pen = TTGlyphPen(None); pen.moveTo(pts[0]); [pen.lineTo(p) for p in pts[1:]]; pen.closePath()
    g = pen.glyph(); g.recalcBounds(f['glyf'])
    f['glyf'][nombre] = g
    if nombre not in orden: orden.append(nombre)
    f['hmtx'][nombre] = (adv, g.xMin)
    vars_ = []
    for k, ejes in TUPLAS.items():
        p2, adv2 = glifo(M[k], ang)
        deltas = [(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, p2)] + [(0, 0), (adv2 - adv, 0), (0, 0), (0, 0)]
        vars_.append(TupleVariation(ejes, deltas))
    f['gvar'].variations[nombre] = vars_
    for st in f['cmap'].tables:
        if st.isUnicode(): st.cmap[cp] = nombre
f.setGlyphOrder(orden)
f['maxp'].numGlyphs = len(orden)
if 'post' in f and hasattr(f['post'], 'extraNames'): pass
# HVAR no conoce los glifos nuevos: sin HVAR, los motores usan los puntos fantasma de gvar
del f['HVAR']

# nombres: Archivo -> Doval Grotesk
for r in f['name'].names:
    s = r.toUnicode()
    if r.nameID in (0, 13, 14): continue
    s = s.replace('Archivo-', 'DovalGrotesk-').replace('ArchivoRoman', 'DovalGroteskRoman').replace('Archivo', 'Doval Grotesk')
    r.string = s
f['name'].setName('Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo). Doval Grotesk: modificaciones 2026 Felipe Doval.', 0, 3, 1, 0x409)
f['name'].setName('Doval Grotesk es una versión modificada de Archivo (SIL OFL 1.1): renombrada, recortada a latín y con flechas propias variables.', 10, 3, 1, 0x409)
for nid, val in ((1, 'Doval Grotesk'), (2, 'Regular'), (4, 'Doval Grotesk'), (6, 'DovalGrotesk-Regular'), (16, 'Doval Grotesk'), (17, 'Regular'), (25, 'DovalGrotesk')):
    f['name'].removeNames(nameID=nid)
    f['name'].setName(val, nid, 3, 1, 0x409)
    f['name'].setName(val, nid, 1, 0, 0)
# instancias con nombre para todo el eje de ancho (Figma y apps de escritorio las listan)
from fontTools.ttLib.tables._f_v_a_r import NamedInstance
PESOS = [(100,'Thin'),(200,'ExtraLight'),(300,'Light'),(400,'Regular'),(500,'Medium'),(600,'SemiBold'),(700,'Bold'),(800,'ExtraBold'),(900,'Black')]
ANCHOS = [(62,'ExtraCondensed'),(75,'Condensed'),(87.5,'SemiCondensed'),(100,''),(112.5,'SemiExpanded'),(125,'Expanded')]
inst = []
for w, wn in ANCHOS:
    for p, pn in PESOS:
        nombre = (wn + ' ' + pn).strip() if not (wn and pn == 'Regular') else wn
        ni = NamedInstance()
        ni.coordinates = {'wght': p, 'wdth': w}
        ni.subfamilyNameID = f['name'].addMultilingualName({'en': nombre}, mac=False)
        ni.postscriptNameID = f['name'].addMultilingualName({'en': 'DovalGrotesk-' + nombre.replace(' ', '')}, mac=False)
        inst.append(ni)
f['fvar'].instances = inst
f['head'].fontRevision = 1.0
f.flavor = None; f.save(OUT + '.ttf')
f.flavor = 'woff2'; f.save(OUT + '.woff2')
print('ok', len(orden))
