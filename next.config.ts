import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/* CONTENT SECURITY POLICY — estática, no por nonce.
 *
 * El nonce es la receta recomendada, pero EXIGE render dinámico: se genera por
 * request. Este sitio es 100% prerenderizado (todas las rutas salen ○ Static /
 * ● SSG), que es justamente lo que lo hace escalar; meter un nonce obligaría a
 * renderizar en servidor en cada visita y tiraría abajo esa propiedad. Para un
 * sitio estático corresponde CSP estática.
 *
 * `'unsafe-inline'` en script-src es inevitable sin nonce (Next inyecta inline
 * los scripts de hidratación). Se acepta con los ojos abiertos: acá NO hay input
 * de usuario, ni formularios, ni auth, ni scripts de terceros, así que la
 * superficie de XSS es prácticamente nula. Lo que la política SÍ aporta es
 * cerrar todo lo demás: nada de scripts externos, iframes, objetos ni
 * conexiones a otros orígenes.
 *
 * `'unsafe-eval'` NO está: three/drei no lo necesitan en producción. Verificado
 * en un navegador real buscando violaciones, no supuesto.
 *
 * `data:` no es decorativo: el Liquid Glass arma su filtro SVG como data URI y
 * lo mete en `backdrop-filter: url(...)`. Sin eso el vidrio pierde la
 * refracción.
 *
 * VERCEL ANALYTICS: en producción se sirve desde `/_vercel/insights/script.js` y
 * manda los eventos a `/_vercel/insights/event`, los dos del MISMO ORIGEN — o
 * sea que entran con `'self'` y no hay que abrirle la puerta a ningún tercero.
 * En desarrollo, en cambio, el paquete carga su script de debug desde
 * va.vercel-scripts.com; ese dominio se permite SOLO en dev, para no ensuciar la
 * consola con violaciones mientras se trabaja. La política que se despliega
 * queda cerrada. */
const dev = process.env.NODE_ENV === "development";
const VA_DEV = dev ? " https://va.vercel-scripts.com" : "";

const CSP = [
  "default-src 'self' data:",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${VA_DEV}`,
  `connect-src 'self'${VA_DEV}`,
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

/** Headers de seguridad para todas las rutas. */
const SEGURIDAD = [
  { key: "Content-Security-Policy", value: CSP },
  // Nada de adivinar el tipo de un archivo por su contenido.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Que nadie embeba el sitio en un iframe (además de frame-ancestors).
  { key: "X-Frame-Options", value: "DENY" },
  // Al salir a otro dominio se manda el origen, no la URL completa.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // El sitio no usa ninguna de estas APIs: se apagan de entrada.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // HTTPS obligatorio (Vercel ya sirve TLS; esto lo vuelve pegajoso).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/* CACHE de los estáticos de /public.
 *
 * Next ya marca /_next/static como `immutable` por un año, porque esos archivos
 * llevan hash en el nombre. Los de /public NO tienen hash, así que por defecto
 * se sirven revalidando en CADA visita: con miles de personas eso es un ida y
 * vuelta por archivo que no hace falta.
 *
 * `immutable` a secas sería un pie de bala —cambiás una foto y el que la tenía
 * cacheada se come la vieja por un año—, así que se separa:
 *  - `max-age` corto para el NAVEGADOR: una foto nueva se ve el mismo día.
 *  - `s-maxage` largo para el CDN, que es quien absorbe el tráfico. Vercel
 *    invalida su cache en cada deploy, así que no se queda pegado.
 *  - `stale-while-revalidate`: si algo venció se sirve igual al instante y se
 *    refresca por atrás. El visitante nunca espera. */
const CACHE_ESTATICOS =
  "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // No delatar el framework ni su versión.
  poweredByHeader: false,
  images: {
    // Todas las imágenes viven en /public. Formatos modernos para el LCP.
    formats: ["image/avif", "image/webp"],
    // Lo que sale del optimizador se cachea un día como mínimo.
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      { source: "/:path*", headers: SEGURIDAD },
      {
        // Todo lo pesado de /public: imágenes, modelos .glb, texturas, fuentes.
        source: "/:dir(assets|models|textures|fonts)/:path*",
        headers: [{ key: "Cache-Control", value: CACHE_ESTATICOS }],
      },
    ];
  },
  // Los modelos .glb se sirven desde /public (no pasan por webpack).
};

export default withAnalyzer(nextConfig);
