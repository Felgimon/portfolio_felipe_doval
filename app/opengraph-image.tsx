import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { perfil } from "@/content/perfil";

// Imagen OG generada desde los tokens del design system (texto + color, sin
// ilustración dibujada). El "_" de la marca es un nodo verde agua. Tipografía
// Archivo Black para la tarjeta social (bold grotesco; el sitio usa Bricolage).
export const alt = `${perfil.nombre} — ${perfil.rol}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f1e1b";
const AGUA = "#8fe3c6";
const HUESO = "#ece7db";
const SALVIA = "#a6bab0";
const NIEBLA = "#83978d";

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
          backgroundColor: INK,
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
            color: NIEBLA,
            fontSize: 26,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", color: HUESO }}>
            FD
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: AGUA,
                marginLeft: 6,
                marginBottom: 6,
              }}
            />
          </div>
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
              color: HUESO,
              letterSpacing: -4,
            }}
          >
            FELIPE
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              fontSize: 150,
              lineHeight: 0.9,
              color: HUESO,
              letterSpacing: -4,
            }}
          >
            DOVAL
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: AGUA,
                marginLeft: 10,
                marginBottom: 22,
              }}
            />
          </div>
        </div>

        {/* subtítulo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 30,
            color: SALVIA,
          }}
        >
          <div style={{ width: 46, height: 6, backgroundColor: AGUA }} />
          desarrollador · full-stack &amp; datos · builder de producto
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Archivo", data: archivo, weight: 900, style: "normal" }],
    },
  );
}
