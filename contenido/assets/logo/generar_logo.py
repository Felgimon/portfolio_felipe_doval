# Generador del logo de Felipe Doval — tipografía + código, cero SVG a mano.
# Concepto: monograma "FD_" — las iniciales + cursor de terminal (el builder que está escribiendo).
# Tipografía: Archivo Black (Omnibus-Type, Buenos Aires). Acento: celeste bandera #74ACDF.
from PIL import Image, ImageDraw, ImageFont, ImageOps

FUENTES = "/home/claude/contenido/assets/fuentes"
OUT = "/home/claude/contenido/assets/logo"

INK = (14, 17, 22, 255)        # 0E1116
BLANCO = (245, 247, 250, 255)  # F5F7FA
CELESTE = (116, 172, 223, 255) # 74ACDF

BLACK = f"{FUENTES}/ArchivoBlack-Regular.ttf"
VARIABLE = f"{FUENTES}/Archivo-Variable.ttf"

def crop_alpha(img, pad_ratio=0.06):
    bbox = img.getbbox()
    img = img.crop(bbox)
    pad = int(max(img.size) * pad_ratio)
    canvas = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    canvas.paste(img, (pad, pad), img)
    return canvas

def render_text(chars_colors, font, tracking_em=0.0, size=1000):
    """Dibuja una secuencia [(texto, color), ...] sobre una misma baseline con tracking manual."""
    W = int(size * (sum(len(t) for t, _ in chars_colors) * 1.4 + 2))
    H = int(size * 2.4)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x, baseline = size * 0.5, size * 1.5
    tracking_px = tracking_em * size
    for texto, color in chars_colors:
        for ch in texto:
            d.text((x, baseline), ch, font=font, fill=color, anchor="ls")
            x += d.textlength(ch, font=font) + tracking_px
    return crop_alpha(img)

# ---------- Monograma FD_ ----------
f_black = ImageFont.truetype(BLACK, 1000)
def monograma(color_letras):
    return render_text([("FD", color_letras), ("_", CELESTE)], f_black, tracking_em=-0.015)

mono_ink = monograma(INK)
mono_blanco = monograma(BLANCO)
mono_ink.save(f"{OUT}/fd-monograma-ink.png")
mono_blanco.save(f"{OUT}/fd-monograma-blanco.png")

# ---------- Wordmark FELIPE DOVAL_ ----------
def fuente_wordmark(px):
    try:
        f = ImageFont.truetype(VARIABLE, px)
        ejes = f.get_variation_axes()
        vals = []
        for eje in ejes:
            tag = eje["name"] if isinstance(eje["name"], str) else eje["name"].decode()
            vals.append(120 if "wdth" in tag.lower() or "width" in tag.lower() else 640)
        f.set_variation_by_axes(vals)
        return f
    except Exception as e:
        print("variable fallback:", e)
        return ImageFont.truetype(BLACK, px)

f_word = fuente_wordmark(560)
def wordmark(color_letras):
    return render_text([("FELIPE DOVAL", color_letras), ("_", CELESTE)], f_word, tracking_em=0.055)

word_ink = wordmark(INK)
word_blanco = wordmark(BLANCO)
word_ink.save(f"{OUT}/wordmark-ink.png")
word_blanco.save(f"{OUT}/wordmark-blanco.png")

# ---------- Favicons (tile ink + FD_ blanco/celeste) ----------
def favicon(px):
    tile = Image.new("RGBA", (1024, 1024), INK)
    m = monograma(BLANCO)
    escala = int(1024 * 0.74 / m.width * m.width), None
    w = int(1024 * 0.74)
    h = int(m.height * w / m.width)
    m = m.resize((w, h), Image.LANCZOS)
    tile.paste(m, ((1024 - w) // 2, (1024 - h) // 2), m)
    return tile.resize((px, px), Image.LANCZOS)

favicon(512).save(f"{OUT}/favicon-512.png")
favicon(192).save(f"{OUT}/favicon-192.png")
favicon(180).save(f"{OUT}/apple-touch-icon-180.png")
favicon(32).save(f"{OUT}/favicon-32.png")

# ---------- Vista previa (mitad clara / mitad oscura) ----------
prev = Image.new("RGBA", (2000, 1200), (0, 0, 0, 0))
d = ImageDraw.Draw(prev)
d.rectangle([0, 0, 1000, 1200], fill=(246, 244, 240, 255))
d.rectangle([1000, 0, 2000, 1200], fill=INK)

def pegar(base, img, cx, cy, ancho):
    h = int(img.height * ancho / img.width)
    im = img.resize((ancho, h), Image.LANCZOS)
    base.paste(im, (cx - ancho // 2, cy - h // 2), im)

pegar(prev, mono_ink, 500, 430, 460)
pegar(prev, word_ink, 500, 820, 720)
pegar(prev, mono_blanco, 1500, 430, 460)
pegar(prev, word_blanco, 1500, 820, 720)
fav = favicon(120)
prev.paste(fav, (940, 1030), fav)
prev.convert("RGB").save("/home/claude/logo-preview.png", quality=95)

print("Logo generado:")
import os
for f in sorted(os.listdir(OUT)):
    print(" ", f, os.path.getsize(f"{OUT}/{f}") // 1024, "KB")
