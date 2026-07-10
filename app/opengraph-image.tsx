import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { perfil } from "@/content/perfil";

// Imagen OG generada desde los tokens del design system (texto + color, sin
// ilustración dibujada). Tema "cielo": fondo celeste, texto tinta, el "_" de la
// marca es un nodo ORO. Tipografía Archivo Black (bold grotesco; el sitio usa
// Bricolage).
export const alt = `${perfil.nombre} — ${perfil.rol}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CIELO = "linear-gradient(160deg, #d3ecf9 0%, #a9d3ea 60%, #7fb8db 100%)";
const ORO = "#c88a1e";
const TINTA = "#10293b";
const PIZARRA = "#38566a";
const NIEBLA = "#4f6d80";

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
          background: CIELO,
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
          <div style={{ display: "flex", alignItems: "flex-end", color: TINTA }}>
            FD
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: ORO,
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
              color: TINTA,
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
              color: TINTA,
              letterSpacing: -4,
            }}
          >
            DOVAL
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: ORO,
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
            color: PIZARRA,
          }}
        >
          <div style={{ width: 46, height: 6, backgroundColor: ORO }} />
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
