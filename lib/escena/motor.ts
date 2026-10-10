import { FRAGMENT, MAX_GOTAS, MAX_VIDRIOS, VERTEX } from "./shader";

/**
 * El MOTOR: WebGL 1 crudo, sin three.js (la escena entera es un triángulo de
 * pantalla completa y un fragment shader). Se encarga de compilar, de las
 * texturas de Feli y de subir los uniforms. La lógica de qué dibujar vive en
 * components/escena/Escena.tsx.
 */

export type Cuadro = {
  vw: number;
  vh: number;
  escala: number;
  tiempo: number;
  u: number;
  calidad: 0 | 1;
  gotas: Float32Array; // MAX_GOTAS * 4 (w = tono + 2·capa)
  nGotas: number;
  nav: [number, number, number, number];
  vidrios: Float32Array; // MAX_VIDRIOS * 4
  vidriosX: Float32Array; // MAX_VIDRIOS * 4
  nVidrios: number;
  feli: Float32Array; // 2 * 4
  hundido: Float32Array; // 2
  texturas: [string | null, string | null];
};

const NOMBRES = [
  "uRes", "uScale", "uTime", "uU", "uQ", "uK", "uB", "uNB", "uNav",
  "uR", "uRX", "uNR", "uF", "uFS", "uT0", "uT1",
] as const;
const ARRAYS = new Set(["uB", "uR", "uRX", "uF"]);

export class Motor {
  private gl: WebGLRenderingContext;
  private u: Record<(typeof NOMBRES)[number], WebGLUniformLocation | null>;
  private texturas = new Map<string, { tex: WebGLTexture; lista: boolean }>();
  private vacia: WebGLTexture;
  readonly canvas: HTMLCanvasElement;
  /** se llama cuando una foto termina de subir a la GPU (hay que redibujar) */
  alCargar: () => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("sin-webgl");
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
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const u = {} as Motor["u"];
    for (const n of NOMBRES) {
      u[n] = gl.getUniformLocation(programa, ARRAYS.has(n) ? `${n}[0]` : n);
    }
    this.u = u;
    gl.uniform1i(u.uT0, 0);
    gl.uniform1i(u.uT1, 1);

    this.vacia = this.crearTextura();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  }

  private compilar(tipo: number, fuente: string): WebGLShader {
    const gl = this.gl;
    const s = gl.createShader(tipo);
    if (!s) throw new Error("shader");
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) ?? "compile");
    }
    return s;
  }

  private crearTextura(): WebGLTexture {
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

  /** ¿La textura de esta foto ya está en la GPU? (la pide si no la tenía) */
  textura(src: string): boolean {
    const ya = this.texturas.get(src);
    if (ya) return ya.lista;
    const entrada = { tex: this.crearTextura(), lista: false };
    this.texturas.set(src, entrada);
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
    gl.uniform1f(u.uScale, c.escala);
    gl.uniform1f(u.uTime, c.tiempo);
    gl.uniform1f(u.uU, c.u);
    gl.uniform1f(u.uQ, c.calidad);
    gl.uniform1f(u.uK, 34 * c.u);
    gl.uniform4fv(u.uB, c.gotas);
    gl.uniform1i(u.uNB, Math.min(c.nGotas, MAX_GOTAS));
    gl.uniform4f(u.uNav, ...c.nav);
    gl.uniform4fv(u.uR, c.vidrios);
    gl.uniform4fv(u.uRX, c.vidriosX);
    gl.uniform1i(u.uNR, Math.min(c.nVidrios, MAX_VIDRIOS));
    gl.uniform4fv(u.uF, c.feli);
    gl.uniform2f(u.uFS, c.hundido[0], c.hundido[1]);
    for (let i = 0; i < 2; i++) {
      const src = c.texturas[i];
      const e = src ? this.texturas.get(src) : undefined;
      gl.activeTexture(i === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, e?.lista ? e.tex : this.vacia);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  perdido(): boolean {
    return this.gl.isContextLost();
  }

  liberar() {
    const gl = this.gl;
    for (const { tex } of this.texturas.values()) gl.deleteTexture(tex);
    gl.deleteTexture(this.vacia);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
