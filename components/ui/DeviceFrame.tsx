import { cn } from "@/lib/utils";

type Variant = "browser" | "phone" | "terminal";

type DeviceFrameProps = {
  variant?: Variant;
  /** texto de la barra (URL para browser, título para terminal) */
  label?: string;
  className?: string;
  /** clases del área de contenido (ej. aspect ratio) */
  contentClassName?: string;
  children: React.ReactNode;
};

/**
 * Marco de dispositivo hecho con CSS puro (sin SVG). Enmarca las capturas de los
 * proyectos. Los "botones" son primitivas triviales (círculos), no iconografía.
 */
export function DeviceFrame({
  variant = "browser",
  label,
  className,
  contentClassName,
  children,
}: DeviceFrameProps) {
  if (variant === "phone") {
    return (
      <div
        className={cn(
          "relative mx-auto w-full max-w-[280px] rounded-[2.2rem] border border-line bg-panel p-2.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]",
          className,
        )}
      >
        {/* notch */}
        <div className="absolute top-2.5 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-ink" />
        <div
          className={cn(
            "overflow-hidden rounded-[1.7rem] bg-ink-2",
            contentClassName ?? "aspect-[9/19]",
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  const isTerminal = variant === "terminal";
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-panel shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)]",
        className,
      )}
    >
      {/* barra superior */}
      <div
        className={cn(
          "flex items-center gap-2 border-b border-line-soft px-4 py-2.5",
          isTerminal ? "bg-ink" : "bg-panel-2",
        )}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-danger/70" />
          <span className="h-3 w-3 rounded-full bg-[#e9c46a]/70" />
          <span className="h-3 w-3 rounded-full bg-ok/70" />
        </span>
        {label && (
          <span
            className={cn(
              "data ml-2 truncate rounded-md px-2.5 py-0.5 text-[0.7rem] text-muted",
              isTerminal ? "" : "bg-ink/60",
            )}
          >
            {label}
          </span>
        )}
      </div>
      <div className={cn("bg-ink-2", contentClassName ?? "aspect-[16/10]")}>
        {children}
      </div>
    </div>
  );
}
