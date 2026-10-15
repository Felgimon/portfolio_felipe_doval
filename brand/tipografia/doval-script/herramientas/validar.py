# Validación: cobertura, ida y vuelta fontTools, woff2, OTS y shaping con HarfBuzz.
import io, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import decompress

REQ = [chr(c) for c in range(0x20, 0x7F)] + list("áéíóúÁÉÍÓÚñÑüÜ¿¡«»–—“”‘’€")
ok = True
for ruta in sys.argv[1:]:
    if ruta.endswith(".woff2"):
        buf = io.BytesIO(); decompress(ruta, buf); buf.seek(0)
        f = TTFont(buf); print(f"[woff2] {ruta}: descomprime OK, {len(f.getGlyphOrder())} glifos, flavor->{'glyf' in f and 'glyf' or 'CFF'}")
    else:
        f = TTFont(ruta)
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    faltan = [c for c in REQ if ord(c) not in cmap]
    vacios = []
    for c in REQ:
        if c == " " or ord(c) not in cmap: continue
        from fontTools.pens.boundsPen import BoundsPen
        bp = BoundsPen(gs); gs[cmap[ord(c)]].draw(bp)
        if bp.bounds is None: vacios.append(c)
    # ida y vuelta
    b = io.BytesIO(); f.save(b); b.seek(0); f2 = TTFont(b)
    for t in f2.keys(): f2[t]  # fuerza decompilar todo
    rt = f2.getGlyphOrder() == f.getGlyphOrder() and f2.getBestCmap() == cmap
    print(f"{ruta.split('/')[-1]}: glifos={len(f.getGlyphOrder())} faltan={''.join(faltan)!r} vacios={vacios} ida_y_vuelta={'OK' if rt else 'FALLA'}")
    print("   nombres:", f['name'].getDebugName(1), "|", f['name'].getDebugName(2), "|", f['name'].getDebugName(4), "|", f['name'].getDebugName(6), "|", f['name'].getDebugName(3))
    ok &= not faltan and not vacios and rt
    if not ruta.endswith(".woff2"):
        blob = hb.Blob.from_file_path(ruta); face = hb.Face(blob); font = hb.Font(face)
        for txt in ["Artisan Script", "diseño", "acción está", "Felipe Doval", "portfolio", "¿Qué tal?", "«Ñandú» €12–15"]:
            buf = hb.Buffer(); buf.add_str(txt); buf.guess_segment_properties()
            hb.shape(font, buf, {})
            nombres = [font.glyph_to_string(i.codepoint) for i in buf.glyph_infos]
            if ".notdef" in nombres: ok = False
            print("   ", txt, "->", " ".join(nombres))
print("TODO OK" if ok else "HAY PROBLEMAS")
