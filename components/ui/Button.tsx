import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-acento text-ink hover:bg-acento-hi",
  // secondary = Liquid Glass: el mismo material de los CTA del hero y el HUD
  // (glass-pill porque .glass trae radius-lg y le ganaría al rounded-full base).
  secondary: "glass glass-hover glass-pill text-chalk hover:text-acento",
  ghost: "bg-transparent text-chalk-dim hover:text-acento",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4",
  md: "h-11 px-6",
  lg: "h-14 px-8 text-sm",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  /** con href → enlace; sin href → <button> */
  href?: string;
  /** fuerza apertura en nueva pestaña (auto-detectado para URLs http) */
  external?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  title?: string;
  id?: string;
  "aria-label"?: string;
};

/**
 * Botón/enlace del sistema. Con `href` renderiza un enlace (Next Link interno o
 * `<a>` externo con rel de seguridad); sin `href`, un `<button>`.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  external,
  onClick,
  type = "button",
  disabled,
  title,
  id,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href !== undefined) {
    const isExternal = external ?? /^https?:\/\//.test(href);
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          onClick={onClick}
          title={title}
          id={id}
          aria-label={ariaLabel}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={classes}
        onClick={onClick}
        title={title}
        id={id}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title}
      id={id}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
