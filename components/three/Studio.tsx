"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BALL_R, GRAPH_SCALE } from "./scene-config";

/**
 * ESTUDIO BLANCO 3D: reemplaza al espacio. El sol flota en una cúpula blanca
 * (pared al fondo + piso, tipo ciclorama de fotografía de producto) y proyecta
 * su SOMBRA suave en el piso. Da un aire limpio y profesional, como un render
 * de producto sobre fondo infinito.
 *
 * - Cúpula: una esfera enorme (BackSide) con un shader de gradiente basado en la
 *   ALTURA (piso luminoso abajo → pared clara arriba). Es camera-robusta: la
 *   cámara orbita adentro y siempre ve blanco, sin costuras ni horizonte duro.
 * - Sombra: un óvalo suave (textura radial) tumbado bajo el sol; en perspectiva
 *   se lee como la sombra apoyada en el piso (el óvalo del dibujo de Feli).
 *
 * Los soles son shaders sin iluminar → el estudio no necesita luces (más barato
 * y sin materiales PBR que tonemapear distinto). */

/** Radio del sol central en unidades de mundo (SunCore usa BALL_R*0.5). */
const SUN_WORLD_R = BALL_R * 0.5 * GRAPH_SCALE;
/** Altura del piso: por debajo del mini-sol más bajo (Contacto) y su sombra. */
const FLOOR_Y = -BALL_R * 0.86 * GRAPH_SCALE - SUN_WORLD_R * 0.55;

const domeVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
/* Gradiente de ciclorama: piso casi blanco → pared gris muy claro, con un
 * apenas-más-oscuro en el rincón inferior (la unión piso-pared). Sin tonemap
 * (shader crudo) → el blanco se mantiene blanco y NADA llega a 1.0 (el bloom
 * del canvas corta en 1.0: el estudio no debe florecer jamás). Sin `precision`
 * a mano: three antepone la máxima soportada (highp explícito no compila en
 * GPUs sin highp fragment y la cúpula desaparecería).
 *
 * v5.12 — el estudio deja de ser liso, por pedido de Felipe y por el VIDRIO
 * (la lente del Liquid Glass solo se ve si atrás hay detalle que doblar):
 *  - PISO: grilla fina tipo papel técnico. El rayo del ciclorama se proyecta
 *    sobre el plano del piso (gnomónica: p = dir.xz/|dir.y|) → líneas RECTAS
 *    con perspectiva real, como cinta de marcado de un estudio fotográfico.
 *    AA por fwidth, y doble desvanecido (horizonte + distancia).
 *  - PARED: matriz de puntos apenas visible (proyección al plano frontal).
 *  - RESPLANDOR: el sol tiñe la pared de atrás y el piso cercano con un lobe
 *    cálido difuso. Además de clima, es un gradiente de COLOR: la aberración
 *    cromática del vidrio lo agarra muchísimo mejor que el gris parejo. */
const domeFragment = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 uSunGlow; // dirección cámara→sol (halo cálido que sigue al sol)

  /* Malla de líneas con PERSPECTIVA CORRECTA: el ancho se define como FRACCIÓN
     DE LA CELDA (mundo 3D), no en píxeles de pantalla. Es la corrección que pidió
     Felipe: fijar el grosor en píxeles ignora la perspectiva, así que al achicarse
     las celdas a lo lejos la línea conserva su ancho y queda desproporcionada —
     se lee "enorme" contra su propia celda. Con el ancho en celdas, la línea se
     achica EN PROPORCIÓN con el cuadrado que delimita, como cinta de marcar
     pegada al piso: es lo que hace la perspectiva de verdad.

     El precio de trabajar en mundo es la MINIFICACIÓN: a lo lejos la línea baja
     de un píxel y, sin cuidado, titila o desaparece. Se resuelve como en la
     técnica "pristine grid" (Ben Golus), en dos pasos:
      1. No se dibuja nunca más fino que ~1px (dibujo = max(objetivo, medio px)),
         y se COMPENSA bajando la intensidad por objetivo/dibujo → en vez de una
         línea que parpadea, una línea de 1px cada vez más tenue. La "tinta"
         total se conserva, que es lo que percibe el ojo.
      2. Pasado un cuadrado por píxel se funde al PROMEDIO (la fracción cubierta
         = ancho), así el fondo converge a un tono plano en lugar de moiré.
     Las dos familias se unen con mix(x, 1, y) (unión tipo "over"), más suave que
     max en los cruces. */
  float lineas(vec2 p, float ancho) {
    vec2 dx = dFdx(p), dy = dFdy(p);
    // Celdas por píxel, por eje (norma exacta del gradiente de cada componente).
    vec2 w = max(vec2(length(vec2(dx.x, dy.x)), length(vec2(dx.y, dy.y))), vec2(1e-6));
    vec2 objetivo = vec2(ancho * 0.5);            // semi-ancho, en CELDAS
    vec2 dibujo = max(objetivo, w * 0.5);         // piso de ~1px (anti-titileo)
    vec2 aa = w * 0.5;                            // transición de ~1px
    vec2 d = abs(fract(p - 0.5) - 0.5);           // dist. a la línea, en celdas
    vec2 l = smoothstep(dibujo + aa, dibujo - aa, d);
    l *= clamp(objetivo / dibujo, 0.0, 1.0);      // compensa el ensanche a 1px
    l = mix(l, vec2(ancho), clamp(w * 2.0 - 1.0, 0.0, 1.0)); // promedio a lo lejos
    return mix(l.x, 1.0, l.y);                    // unión de las dos familias
  }

  void main() {
    vec3 dir = normalize(vDir);
    float y = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0); // 0 abajo .. 1 arriba
    vec3 floorC = vec3(0.972, 0.980, 0.990);
    vec3 wallC  = vec3(0.843, 0.874, 0.912);
    vec3 c = mix(floorC, wallC, smoothstep(0.30, 1.0, y));
    c = mix(c, wallC * 0.965, smoothstep(0.24, 0.0, y) * 0.5);

    /* PISO: grilla técnica GRUESA, con contraste y DENSA. La densidad no es
       estética: con la grilla rala muchos vidrios caían ENTRE líneas y no
       tenían nada que doblar (medido: desplazar un degradado liso da 0.3
       niveles de diferencia = invisible). Con paso corto, todo contenedor
       tiene varias líneas cruzándolo y la refracción se lee. */
    if (dir.y < -0.008) {
      vec2 p = dir.xz / -dir.y * 2.9;
      /* El corte por distancia va MUY lejos a propósito. Antes moría en 11..26 y
         las cards de los tópicos, que caen apenas debajo del horizonte (donde la
         proyección del piso da distancias enormes), quedaban sobre un vacío: el
         vidrio no tenía nada que doblar. La poda temprana además era redundante,
         porque lineas() ya apaga solo cuando la celda se achica bajo el píxel —
         o sea que el horizonte se resuelve por cobertura, no por distancia. */
      float fade = smoothstep(0.008, 0.07, -dir.y)
                 * (1.0 - smoothstep(26.0, 60.0, length(p)));
      /* DOS ESCALAS. Con una sola grilla, a media distancia las celdas se
         comprimen bajo el píxel y lineas() las funde al promedio (la protección
         anti-moiré de v5.13.2): queda un tono PLANO, sin contraste, y el vidrio
         de las cards no tiene nada que doblar — medido, sd 2.7 donde hacen falta
         ~12. La segunda grilla, de celdas 4x más grandes, todavía se resuelve
         ahí y aporta esa estructura. Es el relevo por escalas de cualquier
         grilla infinita: cuando una se apaga, la siguiente sostiene. */
      /* RELEVO POR ESCALAS. Cada grilla más gruesa entra multiplicada por el lod
         de la anterior: cerca sólo se ve la fina (el hero queda igual que
         siempre) y lejos, donde la fina ya se fundió al promedio, toman el
         relevo las de celdas 4x y 16x. Eso es lo que le devuelve al vidrio algo
         que doblar sobre los tópicos, sin ensuciar el estudio de cerca. */
      float g = lineas(p, 0.028);
      g = max(g, 0.70 * lineas(p * 0.25, 0.022));
      g = max(g, 0.45 * lineas(p * 0.0625, 0.018));
      c = mix(c, vec3(0.40, 0.51, 0.64), g * fade * 0.50);
    }

    /* PARED: la misma grilla (proyección al plano frontal).
     *
     * Ya NO es "más tenue" que el piso, y no es capricho: en los tópicos la
     * cámara se acerca al cúmulo y las cards de vidrio quedan sobre ESTA zona.
     * Medido, el fondo bajo ellas daba sd 1.85–5.71, o sea liso — y el Liquid
     * Glass sólo se ve si hay detalle que doblar (calibración v5.12.3: sd 5.5 =
     * invisible). Con la pared al 0.26 el vidrio no tenía nada que refractar y
     * parecía roto.
     *
     * El otro culpable era una BANDA MUERTA en el horizonte: el piso arrancaba
     * recién en dir.y < -0.03 y la pared en dir.y > 0.0, así que entre medio no
     * había NINGUNA grilla — y ahí es justo donde caen las cards. Ahora los dos
     * desvanecidos se solapan cruzando el horizonte y no queda hueco. Cerrar la
     * banda no trae aliasing: la cobertura que calcula lineas() ya apaga sola
     * las líneas cuando la celda se achica bajo el píxel (que es lo que pasa en
     * el horizonte). */
    if (dir.z < -0.1 && dir.y > -0.05) {
      vec2 q = vec2(dir.x, dir.y) / -dir.z * 4.6;
      float fadeW = smoothstep(-0.05, 0.05, dir.y)
                  * (1.0 - smoothstep(18.0, 38.0, length(q)));
      float gw = lineas(q, 0.026);
      gw = max(gw, 0.70 * lineas(q * 0.25, 0.020));
      gw = max(gw, 0.45 * lineas(q * 0.0625, 0.016));
      c = mix(c, vec3(0.44, 0.55, 0.68), gw * fadeW * 0.40);
    }

    /* RESPLANDOR del sol: un HALO cálido que SIGUE al sol (uSunGlow = dir
       cámara→sol), no una mancha fija. Va DESPUÉS de la grilla (también la
       entibia — una línea bajo luz naranja se ve naranja). Dos lobes: uno
       intenso y ceñido, otro amplio y suave para que el color LLEGUE a los
       vidrios de alrededor. El sol tapa su propio centro, así que el halo se ve
       como aura. Tope < 1.0: el bloom (umbral 1.0) no florece. */
    float d = max(dot(dir, uSunGlow), 0.0);
    /* El lobe ancho va CEÑIDO (pow 2.6, no 1.6): si se derrama por todo el
       estudio, tiñe línea y piso por igual y COMPRIME su contraste — la grilla
       se apagaba justo donde están los vidrios de la izquierda. */
    float halo = pow(d, 6.0) * 0.58 + pow(d, 2.6) * 0.26;
    c = mix(c, vec3(1.0, 0.80, 0.56), clamp(halo, 0.0, 0.74));

    gl_FragColor = vec4(min(c, vec3(0.999)), 1.0);
  }
`;

/** Textura de sombra: óvalo radial oscuro-frío que se desvanece a transparente
 * (blur suave). Se compone en Normal sobre el piso claro → lo oscurece. */
function makeShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(28, 42, 60, 0.42)");
  g.addColorStop(0.45, "rgba(30, 44, 62, 0.26)");
  g.addColorStop(0.75, "rgba(32, 46, 64, 0.08)");
  g.addColorStop(1, "rgba(32, 46, 64, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Actualiza el halo del sol: dirección de la CÁMARA al sol (world origin). El
 * dome está en el origen y es enorme, así que el `dir` de cada píxel ≈ la
 * dirección de vista; el halo aparece como aura alrededor del sol y lo sigue
 * cuando la cámara panea. Mutación imperativa fuera del componente. */
function seguirSol(mat: THREE.ShaderMaterial, camPos: THREE.Vector3) {
  mat.uniforms.uSunGlow.value.copy(camPos).normalize().negate();
}

export function Studio() {
  const dome = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: domeVertex,
        fragmentShader: domeFragment,
        side: THREE.BackSide,
        depthWrite: true,
        toneMapped: false,
        uniforms: {
          uSunGlow: { value: new THREE.Vector3(0, 0, -1) },
        },
      }),
    [],
  );
  const shadowTex = useMemo(() => makeShadowTexture(), []);
  useEffect(() => {
    return () => {
      dome.dispose();
      shadowTex.dispose();
    };
  }, [dome, shadowTex]);

  // El halo sigue al sol cada frame (barato: una normalización).
  useFrame(({ camera }) => seguirSol(dome, camera.position));

  return (
    <group>
      {/* Cúpula infinita: la cámara orbita adentro (radio 44 >> distancia máxima
          de cámara ~9). */}
      <mesh material={dome} renderOrder={-10}>
        <sphereGeometry args={[44, 32, 24]} />
      </mesh>
      {/* Sombra del sol en el piso: óvalo suave tumbado (rotado horizontal). En
          perspectiva se ve elíptico, apoyado en el suelo, bajo el sol. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y, 0]}
        renderOrder={-5}
      >
        <planeGeometry args={[SUN_WORLD_R * 4.4, SUN_WORLD_R * 4.4]} />
        <meshBasicMaterial
          map={shadowTex}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
