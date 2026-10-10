/**
 * MEDIDOR DE CUADROS — frame time real (rAF) parado en cada parada de la home,
 * con la escena a calidad alta forzada (?fx=full&perf=alto) y a calidad baja
 * (?perf=bajo). En una máquina sin GPU los números absolutos no sirven (todo
 * corre por software); lo que sirve es la COMPARACIÓN entre paradas y tiers.
 *
 * Uso: npm run build && node scripts/perf.ts
 */
import { levantar, navegador } from "./lib/servidor.mjs";

const PARADAS = ["inicio", "perfil", "enfoque", "trabajo", "recorrido", "contacto"];

const { base, cerrar } = await levantar(Number(process.env.PERF_PORT ?? 3265));
try {
  const b = await navegador();
  for (const q of ["fx=full&perf=alto", "fx=full&perf=bajo"]) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(`${base}/?${q}`, { waitUntil: "load", timeout: 60000 });
    await p.waitForTimeout(3000);
    const filas: string[] = [];
    for (const id of PARADAS) {
      await p.evaluate((id: string) => document.getElementById(id)?.scrollIntoView(), id);
      await p.waitForTimeout(800);
      const ms = await p.evaluate(
        () =>
          new Promise<number>((res) => {
            const t: number[] = [];
            let prev = performance.now();
            const paso = (ahora: number) => {
              t.push(ahora - prev);
              prev = ahora;
              if (t.length < 90) requestAnimationFrame(paso);
              else res(t.sort((a, z) => a - z)[t.length >> 1]);
            };
            requestAnimationFrame(paso);
          }),
      );
      filas.push(`${id.padEnd(10)} ${ms.toFixed(1)} ms`);
    }
    console.log(`\n[${q}] frame time mediano por parada:\n${filas.join("\n")}`);
    await p.close();
  }
  await b.close();
} finally {
  cerrar();
}
