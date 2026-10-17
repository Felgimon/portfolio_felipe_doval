import { FRAGMENT, MAX_BURBUJAS, MAX_VIDRIOS, VERTEX } from "./shader";

/**
 * El MOTOR: WebGL 2 crudo, sin three.js. Compila, sube las texturas (fotos de
 * Feli, cianotipos del fondo y placas de los títulos) y los uniforms. Qué dibujar lo decide
 * components/escena/Escena.tsx.
 */

export const MAX_PLACAS = 3;

/** Una placa: el rect en pantalla y su textura (o null si no hay). */
export type PlacaGPU = { rect: [number, number, number, number]; tex: WebGLTexture } | null;

export type Cuadro = {
  vw: number;
  vh: number;
  escala: number;
  tiempo: number;
  calidad: 0 | 1;
  burbujas: Float32Array; // MAX_BURBUJAS * 4: x, y, radio, cuánto es botón
  burbujasF: Float32Array; // MAX_BURBUJAS * 4: medio ancho, medio alto, velocidad x, y
  nBurbujas: number;
  /** 1 cuando las burbujas son un botón (van encima del vidrio) */
  arriba: number;
  placas: PlacaGPU[];
  feli: { rect: [number, number, number, number]; src: string }[];
  cianotipos: { rect: [number, number, number, number]; src: string; funde: boolean }[];
  vidrios: Float32Array; // MAX_VIDRIOS * 4
  vidriosX: Float32Array; // MAX_VIDRIOS * 4 (x radio, y hover, z presencia, w tipo)
  nVidrios: number;
  puntero: [number, number];
  onda: [number, number, number, number]; // x, y, edad (s), fuerza
};

const NOMBRES = [
  "uRes", "uS", "uT", "uQ", "uB", "uBF", "uNB", "uArriba", "uV", "uVX", "uNV", "uM", "uOnda",
  "uP0", "uP1", "uP2", "uPR0", "uPR1", "uPR2", "uF0", "uF1", "uFR0", "uFR1",
  "uK0", "uK1", "uKR0", "uKR1", "uPapel", "uGrano", "uKF",
] as const;
const ARRAYS = new Set(["uV", "uVX", "uB", "uBF"]);
const CERO: [number, number, number, number] = [0, 0, 0, 0];

export class Motor {
  private gl: WebGL2RenderingContext;
  private u: Record<(typeof NOMBRES)[number], WebGLUniformLocation | null>;
  private fotos = new Map<string, { tex: WebGLTexture; lista: boolean }>();
  private vacia: WebGLTexture;
  private texPapel: WebGLTexture | null = null;
  readonly canvas: HTMLCanvasElement;
  /** se llama cuando una foto termina de subir a la GPU (hay que redibujar) */
  alCargar: () => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("sin-webgl2");
    this.gl = gl;

    const programa = gl.createProgram();
    if (!programa) throw new Error("programa");
    gl.attachShader(programa, this.compilar(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(programa, this.compilar(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.bindAttribLocation(programa, 0, "a");
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(programa) ?? "link");
    }
    gl.useProgram(programa);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const u = {} as Motor["u"];
    for (const n of NOMBRES) u[n] = gl.getUniformLocation(programa, ARRAYS.has(n) ? `${n}[0]` : n);
    this.u = u;
    // unidades fijas: placas 0..2, Feli 3..4, cianotipos 5..6, papel 7
    gl.uniform1i(u.uP0, 0);
    gl.uniform1i(u.uP1, 1);
    gl.uniform1i(u.uP2, 2);
    gl.uniform1i(u.uF0, 3);
    gl.uniform1i(u.uF1, 4);
    gl.uniform1i(u.uK0, 5);
    gl.uniform1i(u.uK1, 6);
    gl.uniform1i(u.uPapel, 7);
    gl.uniform1f(u.uGrano, 0);

    this.vacia = this.nuevaTextura();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  }

  private compilar(tipo: number, fuente: string): WebGLShader {
    const gl = this.gl;
    const s = gl.createShader(tipo);
    if (!s) throw new Error("shader");
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "compile");
    return s;
  }

  nuevaTextura(): WebGLTexture {
    const gl = this.gl;
    const t = gl.createTexture();
    if (!t) throw new Error("textura");
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /** Sube un canvas 2D a una textura (las placas). */
  subir(tex: WebGLTexture, fuente: HTMLCanvasElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fuente);
  }

  borrar(tex: WebGLTexture) {
    this.gl.deleteTexture(tex);
  }

  /**
   * EL PAPEL (v8.1): la textura del papel cianotipo, en gris, que se repite en
   * espejo (sin costuras) sobre el estudio. Hasta que carga, el grano es 0.
   */
  papel(src: string) {
    const gl = this.gl;
    const tex = this.nuevaTextura();
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (gl.isContextLost()) return;
      gl.activeTexture(gl.TEXTURE7);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.uniform1f(this.u.uGrano, 1);
      this.alCargar();
    };
    img.src = src;
    this.texPapel = tex;
  }

  /** ¿La foto ya está en la GPU? (la pide si no la tenía) */
  foto(src: string): boolean {
    const ya = this.fotos.get(src);
    if (ya) return ya.lista;
    const entrada = { tex: this.nuevaTextura(), lista: false };
    this.fotos.set(src, entrada);
    const gl = this.gl;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, entrada.tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      entrada.lista = true;
      this.alCargar();
    };
    img.src = src;
    return false;
  }

  tamaño(w: number, h: number) {
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  }

  dibujar(c: Cuadro) {
    const gl = this.gl;
    const u = this.u;
    gl.uniform2f(u.uRes, c.vw, c.vh);
    gl.uniform1f(u.uS, c.escala);
    gl.uniform1f(u.uT, c.tiempo);
    gl.uniform1f(u.uQ, c.calidad);
    gl.uniform4fv(u.uB, c.burbujas);
    gl.uniform4fv(u.uBF, c.burbujasF);
    gl.uniform1i(u.uNB, Math.min(c.nBurbujas, MAX_BURBUJAS));
    gl.uniform1f(u.uArriba, c.arriba);
    gl.uniform4fv(u.uV, c.vidrios);
    gl.uniform4fv(u.uVX, c.vidriosX);
    gl.uniform1i(u.uNV, Math.min(c.nVidrios, MAX_VIDRIOS));
    gl.uniform2f(u.uM, c.puntero[0], c.puntero[1]);
    gl.uniform4f(u.uOnda, c.onda[0], c.onda[1], c.onda[2], c.onda[3]);

    const rects = [u.uPR0, u.uPR1, u.uPR2];
    for (let i = 0; i < MAX_PLACAS; i++) {
      const pl = c.placas[i];
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, pl ? pl.tex : this.vacia);
      const r = pl ? pl.rect : CERO;
      gl.uniform4f(rects[i], r[0], r[1], r[2], r[3]);
    }
    this.fotosGPU(c.feli, 3, [u.uFR0, u.uFR1]);
    this.fotosGPU(c.cianotipos, 5, [u.uKR0, u.uKR1]);
    gl.uniform2f(u.uKF, c.cianotipos[0]?.funde ? 1 : 0, c.cianotipos[1]?.funde ? 1 : 0);
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, this.texPapel ?? this.vacia);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Dos fotos (Feli o cianotipos) en sus unidades; sin foto lista, rect 0. */
  private fotosGPU(lista: Cuadro["feli"], unidad: number, rects: (WebGLUniformLocation | null)[]) {
    const gl = this.gl;
    for (let i = 0; i < rects.length; i++) {
      const f = lista[i];
      const e = f ? this.fotos.get(f.src) : undefined;
      gl.activeTexture(gl.TEXTURE0 + unidad + i);
      gl.bindTexture(gl.TEXTURE_2D, e?.lista ? e.tex : this.vacia);
      const r = f && e?.lista ? f.rect : CERO;
      gl.uniform4f(rects[i], r[0], r[1], r[2], r[3]);
    }
  }

  perdido(): boolean {
    return this.gl.isContextLost();
  }

  liberar() {
    const gl = this.gl;
    for (const { tex } of this.fotos.values()) gl.deleteTexture(tex);
    if (this.texPapel) gl.deleteTexture(this.texPapel);
    gl.deleteTexture(this.vacia);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
