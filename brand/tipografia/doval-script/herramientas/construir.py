# Construye "Doval Script" a partir de Norican (SIL OFL 1.1).
#
# Cambios:
#  1. Enderezado: sesgo horizontal de -SKEW grados alrededor de y=Y0 (altura de
#     las uniones), así las conexiones entre letras quedan donde estaban.
#  2. Engrosado anisotrópico: offset del contorno de AH unidades en horizontal y
#     AV en vertical (escala y -> offset redondo -> desescala), para engordar las
#     astas más que los trazos horizontales y conservar el contraste.
#  3. Avance +2*AH y corrimiento +AH: los márgenes laterales y el kerning quedan
#     iguales, y las uniones (que en Norican se solapan con la letra siguiente)
#     siguen funcionando.
#  4. Compuestos (acentos) recalculados; acentos superiores elevados RAISE
#     unidades para que no se peguen a la letra engrosada.
#  5. Anclas GPOS (mark/mkmk), carets de ligadura y métricas OS/2 ajustados.
#  6. Formas finales (.fina) activadas por defecto vía 'calt' al final de cada
#     palabra (y .init para U V W al inicio); se agregan finales acentuadas
#     (á é ó ú...) para el español.
#  7. Sin hinting; nombres nuevos.
import argparse
import math
import unicodedata

import pathops
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables import otTables as ot
from fontTools.ttLib.tables._g_l_y_f import GlyphComponent
from fontTools.ttLib.tables.ttProgram import Program

ap = argparse.ArgumentParser()
ap.add_argument("base")
ap.add_argument("salida")
ap.add_argument("--ah", type=float, default=26)
ap.add_argument("--av", type=float, default=15)
ap.add_argument("--skew", type=float, default=4.0)
ap.add_argument("--y0", type=float, default=400)
ap.add_argument("--raise", dest="subir", type=float, default=None)
ap.add_argument("--version", default="1.000")
args = ap.parse_args()

AH, AV, Y0 = args.ah, args.av, args.y0
T = math.tan(math.radians(args.skew))
K = AH / AV if AV else 1.0
RAISE = round(1.5 * AV) if args.subir is None else args.subir

f = TTFont(args.base)
glyf = f["glyf"]
hmtx = f["hmtx"]
orden = f.getGlyphOrder()
gdef = f["GDEF"].table
clases = gdef.GlyphClassDef.classDefs
gs_orig = f.getGlyphSet()

orig_adv = {n: hmtx[n][0] for n in orden}
es_marca = {n: clases.get(n) == 3 for n in orden}
# marca superior = su tinta está arriba de la altura x/2
marca_sup = {}
for n in orden:
    if es_marca[n]:
        g = glyf[n]
        g.recalcBounds(glyf)
        marca_sup[n] = getattr(g, "yMin", 0) > 400
    else:
        marca_sup[n] = False


def corrimiento(n):
    # glifos con avance (no marcas de ancho cero) se corren AH a la derecha
    return AH if orig_adv[n] > 0 else 0


def contorno_nuevo(n):
    """Devuelve el pathops.Path transformado (enderezado + engrosado + corrido)."""
    p = pathops.Path()
    tp = TransformPen(p.getPen(), (1, 0, -T, K, T * Y0, 0))
    gs_orig[n].draw(tp)
    p = pathops.simplify(p, fix_winding=True)
    if AH > 0:
        trazo = pathops.Path(p)
        trazo.stroke(2 * AH, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
        trazo.convertConicsToQuads(0.25)
        r = pathops.op(p, trazo, pathops.PathOp.UNION)
    else:
        r = p
    r = r.transform(1, 0, 0, 1 / K, corrimiento(n), 0)
    r.convertConicsToQuads(0.25)
    r = pathops.simplify(r, fix_winding=True, keep_starting_points=False, clockwise=True)
    return r


nuevos = {}
for n in orden:
    g = glyf[n]
    if g.isComposite():
        continue
    if g.numberOfContours == 0:
        continue
    r = contorno_nuevo(n)
    pen = TTGlyphPen(None)
    r.draw(Cu2QuPen(pen, max_err=0.6, reverse_direction=False))
    nuevos[n] = pen.glyph()

for n, g in nuevos.items():
    glyf[n] = g

# compuestos
for n in orden:
    g = glyf[n]
    if not g.isComposite():
        continue
    sC = corrimiento(n)
    espaciadores = sorted(
        [c for c in g.components if orig_adv[c.glyphName] > 0 and not es_marca[c.glyphName]],
        key=lambda c: c.x,
    )
    rango = {id(c): i for i, c in enumerate(espaciadores)}
    for c in g.components:
        assert not hasattr(c, "transform"), (n, c.glyphName)
        extra = 2 * AH * rango.get(id(c), 0)
        x = c.x - T * c.y + sC - corrimiento(c.glyphName) + extra
        y = c.y + (RAISE if marca_sup[c.glyphName] else 0)
        c.x, c.y = round(x), round(y)
    if hasattr(g, "program"):
        g.program = Program()
        g.program.fromBytecode(b"")
    n_esp = max(1, len(espaciadores))
    if orig_adv[n] > 0:
        hmtx[n] = (round(orig_adv[n] + 2 * AH * n_esp), hmtx[n][1])

for n in orden:
    g = glyf[n]
    if not g.isComposite() and orig_adv[n] > 0 and g.numberOfContours != 0:
        hmtx[n] = (round(orig_adv[n] + 2 * AH), hmtx[n][1])

# espacio de palabra un poco más ancho: con el trazo más pesado, el espacio
# original de Norican (389) se veía apretado
for u in (0x20, 0xA0):
    n = f.getBestCmap().get(u)
    if n:
        hmtx[n] = (round(orig_adv[n] + 2.5 * AH), 0)

# --- finales acentuadas para el español -----------------------------------
gsub = f["GSUB"].table
fina_lk = gsub.LookupList.Lookup[15].SubTable[0].mapping
init_lk = gsub.LookupList.Lookup[14].SubTable[0].mapping
agregados = []
for n in list(orden):
    g = glyf[n]
    if not g.isComposite():
        continue
    base = g.components[0].glyphName
    resto = g.components[1:]
    if base not in fina_lk or not resto:
        continue
    if not all(marca_sup.get(c.glyphName) for c in resto):
        continue
    nuevo = n + ".fina"
    if nuevo in glyf:
        continue
    ng = type(g)()
    ng.numberOfContours = -1
    comps = []
    for i, c in enumerate(g.components):
        nc = GlyphComponent()
        nc.glyphName = fina_lk[base] if i == 0 else c.glyphName
        nc.x, nc.y = c.x, c.y
        nc.flags = c.flags & ~0x200  # sin USE_MY_METRICS
        comps.append(nc)
    ng.components = comps
    glyf[nuevo] = ng
    hmtx[nuevo] = hmtx[fina_lk[base]]
    clases[nuevo] = 1
    fina_lk[n] = nuevo
    agregados.append(nuevo)
orden = list(dict.fromkeys(list(orden) + agregados))
f.setGlyphOrder(orden)
glyf.glyphOrder = orden
f.getReverseGlyphMap(rebuild=True)

# --- sin hinting ---------------------------------------------------------
for t in ("fpgm", "prep", "cvt "):
    if t in f:
        del f[t]
for n in orden:
    g = glyf[n]
    if hasattr(g, "program"):
        g.program = Program()
        g.program.fromBytecode(b"")
prep = newTable("prep")
prep.program = Program()
prep.program.fromAssembly(["PUSHW[ ]", "511", "SCANCTRL[ ]", "PUSHB[ ]", "4", "SCANTYPE[ ]"])
f["prep"] = prep
f["gasp"].gaspRange = {0xFFFF: 0x000F}
maxp = f["maxp"]
for a in ("maxZones", "maxTwilightPoints", "maxStorage", "maxFunctionDefs", "maxInstructionDefs", "maxStackElements", "maxSizeOfInstructions"):
    setattr(maxp, a, 0 if a != "maxZones" else 1)
maxp.maxStackElements = 6

# lsb desde las cajas nuevas
for n in orden:
    g = glyf[n]
    g.recalcBounds(glyf) if g.isComposite() else g.recalcBounds(glyf)
    xmin = getattr(g, "xMin", 0) if (g.isComposite() or g.numberOfContours) else 0
    hmtx[n] = (hmtx[n][0], xmin)

# --- GPOS: anclas -----------------------------------------------------------
def mover_ancla(a, s, bajar=0):
    if a is None:
        return
    x, y = a.XCoordinate, a.YCoordinate
    a.XCoordinate = round(x - T * (y - Y0) + s)
    a.YCoordinate = round(y - bajar)
    if a.Format == 2:
        a.Format = 1
        del a.AnchorPoint


gpos = f["GPOS"].table
for lk in gpos.LookupList.Lookup:
    for st in lk.SubTable:
        if lk.LookupType == 9:
            st = st.ExtSubTable
        if st.LookupType == 4:  # mark a base
            for g, rec in zip(st.MarkCoverage.glyphs, st.MarkArray.MarkRecord):
                mover_ancla(rec.MarkAnchor, corrimiento(g), RAISE if marca_sup[g] else 0)
            for g, rec in zip(st.BaseCoverage.glyphs, st.BaseArray.BaseRecord):
                for a in rec.BaseAnchor:
                    mover_ancla(a, corrimiento(g))
        elif st.LookupType == 5:  # mark a ligadura
            for g, rec in zip(st.MarkCoverage.glyphs, st.MarkArray.MarkRecord):
                mover_ancla(rec.MarkAnchor, corrimiento(g), RAISE if marca_sup[g] else 0)
            for g, att in zip(st.LigatureCoverage.glyphs, st.LigatureArray.LigatureAttach):
                for comp in att.ComponentRecord:
                    for a in comp.LigatureAnchor:
                        mover_ancla(a, corrimiento(g))
        elif st.LookupType == 6:  # mark a mark
            for g, rec in zip(st.Mark1Coverage.glyphs, st.Mark1Array.MarkRecord):
                mover_ancla(rec.MarkAnchor, corrimiento(g), RAISE if marca_sup[g] else 0)
            for g, rec in zip(st.Mark2Coverage.glyphs, st.Mark2Array.Mark2Record):
                for a in rec.Mark2Anchor:
                    mover_ancla(a, corrimiento(g))

# carets de ligadura
if gdef.LigCaretList:
    for g, lg in zip(gdef.LigCaretList.Coverage.glyphs, gdef.LigCaretList.LigGlyph):
        for cv in lg.CaretValue:
            if cv.Format == 1:
                cv.Coordinate = round(cv.Coordinate + AH)

# --- GSUB: 'calt' con finales e iniciales contextuales -------------------
cmap = f.getBestCmap()
codificados = set(cmap.values())
letras = {g for u, g in cmap.items() if unicodedata.category(chr(u)).startswith("L")}
letras |= {g for g in orden if g not in codificados and not es_marca.get(g, clases.get(g) == 3) and g != ".notdef"}
letras = sorted(letras, key=f.getGlyphID)


def cobertura(glifos):
    c = ot.Coverage()
    c.glyphs = sorted(set(glifos), key=f.getGlyphID)
    return c


def regla(entrada, atras=(), adelante=(), lookup=None):
    st = ot.ChainContextSubst()
    st.Format = 3
    st.BacktrackCoverage = [cobertura(x) for x in atras]
    st.InputCoverage = [cobertura(entrada)]
    st.LookAheadCoverage = [cobertura(x) for x in adelante]
    recs = []
    if lookup is not None:
        r = ot.SubstLookupRecord()
        r.SequenceIndex = 0
        r.LookupListIndex = lookup
        recs.append(r)
    st.SubstLookupRecord = recs
    st.BacktrackGlyphCount = len(st.BacktrackCoverage)
    st.InputGlyphCount = 1
    st.LookAheadGlyphCount = len(st.LookAheadCoverage)
    st.SubstCount = len(recs)
    return st


def lookup_cadena(subtablas):
    lk = ot.Lookup()
    lk.LookupType = 6
    lk.LookupFlag = 0x0008  # IgnoreMarks
    lk.SubTable = subtablas
    lk.SubTableCount = len(subtablas)
    return lk


fina_src = list(fina_lk.keys())
init_src = list(init_lk.keys())
lks = gsub.LookupList.Lookup
lks.append(lookup_cadena([regla(fina_src, adelante=[letras]), regla(fina_src, lookup=15)]))
idx_fina = len(lks) - 1
lks.append(lookup_cadena([regla(init_src, atras=[letras]), regla(init_src, lookup=14)]))
idx_init = len(lks) - 1
gsub.LookupList.LookupCount = len(lks)

feat = ot.Feature()
feat.FeatureParams = None
feat.LookupListIndex = [idx_fina, idx_init]
feat.LookupCount = 2
fr = ot.FeatureRecord()
fr.FeatureTag = "calt"
fr.Feature = feat
viejos = gsub.FeatureList.FeatureRecord
todos = list(enumerate(viejos)) + [(None, fr)]
todos.sort(key=lambda x: x[1].FeatureTag)
remap = {old: new for new, (old, _) in enumerate(todos) if old is not None}
idx_calt = [new for new, (old, _) in enumerate(todos) if old is None][0]
gsub.FeatureList.FeatureRecord = [r for _, r in todos]
gsub.FeatureList.FeatureCount = len(todos)
for sr in gsub.ScriptList.ScriptRecord:
    langs = [sr.Script.DefaultLangSys] + [l.LangSys for l in sr.Script.LangSysRecord]
    for ls in langs:
        if ls is None:
            continue
        ls.FeatureIndex = sorted([remap[i] for i in ls.FeatureIndex] + [idx_calt])
        ls.FeatureCount = len(ls.FeatureIndex)

# --- métricas ---------------------------------------------------------------
os2 = f["OS/2"]
os2.sxHeight = round(os2.sxHeight + AV)
os2.sCapHeight = round(os2.sCapHeight + AV)
os2.recalcAvgCharWidth(f)
os2.achVendID = "NONE"
os2.fsType = 0
os2.usWeightClass = 400

# --- nombres -------------------------------------------------------------
FAM = "Doval Script"
PS = "DovalScript-Regular"
ver = args.version
cop = ("Copyright 2011 The Norican Project Authors (https://github.com/googlefonts/NoricanFont). "
       "Modifications © 2026 Felipe Doval.")
nombres = {
    0: cop,
    1: FAM,
    2: "Regular",
    3: f"{ver};NONE;{PS}",
    4: f"{FAM} Regular",
    5: f"Version {ver}; derived from Norican 1.100",
    6: PS,
    8: "Felipe Doval",
    9: "Vernon Adams (Norican); modifications by Felipe Doval",
    10: ("Doval Script is a modified version of Norican by Vernon Adams (SIL OFL 1.1): "
         "emboldened, slightly straightened, word-final forms on by default. Not affiliated with any other typeface."),
    11: "https://felipedoval.com",
    12: "https://felipedoval.com",
    13: ("This Font Software is licensed under the SIL Open Font License, Version 1.1. "
         "This license is available with a FAQ at: https://openfontlicense.org"),
    14: "https://openfontlicense.org",
}
name = f["name"]
name.names = [r for r in name.names if r.nameID not in nombres and r.nameID != 7 and r.nameID < 16]
for nid, s in nombres.items():
    name.setName(s, nid, 3, 1, 0x409)
f["head"].fontRevision = float(ver)

# winAscent/winDescent cubren la caja real (Windows recorta fuera de ellos)
ymax = max(getattr(glyf[n], "yMax", 0) for n in orden)
ymin = min(getattr(glyf[n], "yMin", 0) for n in orden)
os2.usWinAscent = max(os2.usWinAscent, ymax)
os2.usWinDescent = max(os2.usWinDescent, -ymin)

f.save(args.salida)
print("ok", args.salida, len(orden), "glifos; finales nuevas:", agregados)
