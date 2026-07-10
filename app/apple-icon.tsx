import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Apple touch icon (tema cielo): "FD" claro sobre tinta + nodo ORO. iOS redondea
// solo. Archivo Black (como el OG).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
          background: "linear-gradient(160deg, #16344a 0%, #10293b 100%)",
          color: "#e9f4fb",
          fontFamily: "Archivo",
          fontSize: 96,
          letterSpacing: -5,
          paddingBottom: 34,
        }}
      >
        FD
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 10,
            background: "#e0a63a",
            marginLeft: 8,
            marginBottom: 14,
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
