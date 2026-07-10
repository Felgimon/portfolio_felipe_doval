import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Favicon generado (tema cielo): "FD" claro sobre tinta + nodo ORO. Alto
// contraste para que se lea en la pestaña. Archivo Black (como el OG).
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
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
          alignItems: "flex-end",
          justifyContent: "center",
          background: "#10293b",
          color: "#e9f4fb",
          fontFamily: "Archivo",
          fontSize: 34,
          letterSpacing: -2,
          paddingBottom: 12,
        }}
      >
        FD
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            background: "#e0a63a",
            marginLeft: 3,
            marginBottom: 4,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Archivo", data: archivo, weight: 900, style: "normal" }],
    },
  );
}
