import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { perfil } from "@/content/perfil";

// Imagen OG generada desde los tokens del design system (texto + color, sin
// ilustración). Aplica a todas las rutas que no definan la suya.
export const alt = `${perfil.nombre} — ${perfil.rol}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const archivo = await readFile(
    join(process.cwd(), "app/fonts/ArchivoBlack-Regular.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0b1220",
          padding: "72px",
          fontFamily: "Archivo",
        }}
      >
        {/* top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#8a93a6",
            fontSize: 26,
          }}
        >
          <span style={{ color: "#ece7dc" }}>
            FD<span style={{ color: "#74acdf" }}>_</span>
          </span>
          <span style={{ fontSize: 22, letterSpacing: 4 }}>
            {perfil.ubicacion.toUpperCase()}
          </span>
        </div>

        {/* nombre */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 150,
              lineHeight: 0.9,
              color: "#ece7dc",
              letterSpacing: -4,
            }}
          >
            FELIPE
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 150,
              lineHeight: 0.9,
              color: "#ece7dc",
              letterSpacing: -4,
            }}
          >
            DOVAL<span style={{ color: "#74acdf" }}>_</span>
          </div>
        </div>

        {/* subtítulo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 30,
            color: "#b9b3a6",
          }}
        >
          <div
            style={{ width: 46, height: 6, backgroundColor: "#74acdf" }}
          />
          builder · fútbol × ML · full-stack + machine learning
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Archivo", data: archivo, weight: 900, style: "normal" }],
    },
  );
}
