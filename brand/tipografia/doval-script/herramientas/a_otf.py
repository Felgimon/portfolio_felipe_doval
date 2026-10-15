# Convierte el TTF final (cuadráticas) a OTF/CFF (cúbicas exactas) con subrutinas.
import sys
import cffsubr
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.ttLib import TTFont

ttf = TTFont(sys.argv[1]); salida = sys.argv[2]
orden = ttf.getGlyphOrder()
gs = ttf.getGlyphSet()
hmtx = ttf["hmtx"]
charstrings = {}
for n in orden:
    pen = T2CharStringPen(hmtx[n][0], gs)
    # CFF usa sentido antihorario para contornos externos
    gs[n].draw(ReverseContourPen(pen))
    charstrings[n] = pen.getCharString()

name = ttf["name"]
ps = name.getDebugName(6)
fb = FontBuilder(ttf["head"].unitsPerEm, isTTF=False)
fb.setupGlyphOrder(orden)
fb.setupCharacterMap(ttf.getBestCmap())
fb.setupCFF(ps, {
    "FullName": name.getDebugName(4),
    "FamilyName": name.getDebugName(1),
    "Weight": "Regular",
    "Notice": name.getDebugName(0),
    "version": "%.3f" % ttf["head"].fontRevision,
    "isFixedPitch": 0,
    "ItalicAngle": ttf["post"].italicAngle,
}, charstrings, {})
fb.setupHorizontalMetrics({n: hmtx[n] for n in orden})
hh = ttf["hhea"]
fb.setupHorizontalHeader(ascent=hh.ascent, descent=hh.descent, lineGap=hh.lineGap,
                         caretSlopeRise=hh.caretSlopeRise, caretSlopeRun=hh.caretSlopeRun)
fb.setupPost(keepGlyphNames=False, italicAngle=ttf["post"].italicAngle,
             underlinePosition=ttf["post"].underlinePosition, underlineThickness=ttf["post"].underlineThickness)
fb.setupMaxp()
otf = fb.font
for tag in ("name", "OS/2", "GDEF", "GSUB", "GPOS", "cmap"):
    otf[tag] = ttf[tag]
head_src, head = ttf["head"], otf["head"]
for a in ("fontRevision", "created", "modified", "macStyle", "lowestRecPPEM", "fontDirectionHint"):
    setattr(head, a, getattr(head_src, a))
head.flags = head_src.flags & ~(1 << 3) & ~(1 << 4) | 0x3
cffsubr.subroutinize(otf)
otf.save(salida)
print("ok", salida)
