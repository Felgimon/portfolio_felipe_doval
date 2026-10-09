# Cómo se reconstruye Doval Script

Requisitos: Python 3 con `pip install fonttools brotli skia-pathops pillow`.

```bash
# 1. Bajar la base (Norican, SIL OFL 1.1)
curl -L -o Norican-Regular.ttf \
  https://raw.githubusercontent.com/google/fonts/main/ofl/norican/Norican-Regular.ttf

# 2. Construir (engrosado 32/18 unidades, enderezado 4°)
python3 construir.py Norican-Regular.ttf DovalScript-Regular.ttf --ah 32 --av 18 --skew 4

# 3. OTF (CFF) para instalar, y validar
python3 a_otf.py DovalScript-Regular.ttf DovalScript-Regular.otf
python3 validar.py DovalScript-Regular.ttf
```

El WOFF2 del sitio sale de la TTF:
`python3 -c "from fontTools.ttLib import TTFont; f=TTFont('DovalScript-Regular.ttf'); f.flavor='woff2'; f.save('DovalScript.woff2')"`.

El espécimen: `python3 especimen.py DovalScript-Regular.ttf <fuente-para-etiquetas.ttf> especimen.png`.
