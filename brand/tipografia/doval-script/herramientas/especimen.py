# Espécimen de Doval Script: crema + azul cobalto.
import sys
from PIL import Image, ImageDraw, ImageFont

fuente, etiqueta_ttf, out = sys.argv[1], sys.argv[2], sys.argv[3]
CREMA = (241, 238, 228)
CREMA_OSC = (232, 227, 212)
AZUL = (22, 64, 168)
AZUL_SUAVE = (22, 64, 168, 150)
W, H = 2400, 3300
M = 140  # margen

im = Image.new("RGB", (W, H), CREMA)
d = ImageDraw.Draw(im)
RAQM = ImageFont.Layout.RAQM


def F(px):
    return ImageFont.truetype(fuente, px, layout_engine=RAQM)


def L(px):
    return ImageFont.truetype(etiqueta_ttf, px, layout_engine=RAQM)


def ancho(txt, fnt, **kw):
    b = d.textbbox((0, 0), txt, font=fnt, **kw)
    return b[2] - b[0], b


def centrado(y, txt, fnt, color=AZUL, **kw):
    w, b = ancho(txt, fnt, **kw)
    d.text(((W - w) / 2 - b[0], y), txt, font=fnt, fill=color, **kw)


def etiqueta(y, txt):
    fnt = L(30)
    d.text((M, y), txt, font=fnt, fill=AZUL, features=["-kern"])
    w, _ = ancho(txt, fnt)
    d.line([(M + w + 30, y + 18), (W - M, y + 18)], fill=AZUL, width=3)


# fondo: palabra gigante en crema oscuro, como en los carteles de referencia
fondo = F(1100)
d.text((-120, -330), "Doval", font=fondo, fill=CREMA_OSC)

# cabecera
lab = L(32)
d.text((M, 90), "DOVAL SCRIPT", font=lab, fill=AZUL)
txt = "ESPÉCIMEN · REGULAR · 2026"
w, b = ancho(txt, lab)
d.text((W - M - w - b[0], 90), txt, font=lab, fill=AZUL)
d.line([(M, 150), (W - M, 150)], fill=AZUL, width=4)

# héroe
centrado(220, "Felipe Doval", F(400))
centrado(720, "Portfolio", F(330))

# alfabeto
y = 1240
etiqueta(y, "ALFABETO")
centrado(y + 70, "ABCDEFGHIJKLM", F(150))
centrado(y + 280, "NOPQRSTUVWXYZ", F(150))
centrado(y + 520, "abcdefghijklmnopqrstuvwxyz", F(150))

y = 2010
etiqueta(y, "CIFRAS Y SIGNOS")
centrado(y + 60, "0123456789 &@#%!?.,;:()", F(140))

y = 2310
etiqueta(y, "ESPAÑOL")
centrado(y + 60, "áéíóú ÁÉÍÓÚ ñÑ üÜ", F(140))
centrado(y + 270, "¿? ¡! «» – — “” ‘’ €", F(140))

y = 2800
etiqueta(y, "TEXTO")
centrado(y + 50, "El veloz murciélago hindú comía feliz cardillo y kiwi.", F(92))
centrado(y + 190, "¿Diseño? ¡Sí, señor! Cañón, acción y pingüino.", F(92))

# pie
d.line([(M, H - 120), (W - M, H - 120)], fill=AZUL, width=3)
pie = L(24)
d.text((M, H - 92), "DERIVADA DE NORICAN (VERNON ADAMS) · SIL OPEN FONT LICENSE 1.1", font=pie, fill=AZUL)
txt = "MODIFICACIONES © 2026 FELIPE DOVAL"
w, b = ancho(txt, pie)
d.text((W - M - w - b[0], H - 92), txt, font=pie, fill=AZUL)

im.save(out, optimize=True)
print(out, im.size)
