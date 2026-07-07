import { cn } from "@/lib/utils";

type TagProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "solid" | "outline" | "soft";
  size?: "sm" | "md";
};

const variants: Record<NonNullable<TagProps["variant"]>, string> = {
  solid: "bg-celeste/15 text-celeste border border-celeste/25",
  outline: "border border-line text-chalk-dim",
  soft: "bg-panel text-chalk-dim border border-line-soft",
};

const sizes: Record<NonNullable<TagProps["size"]>, string> = {
  sm: "px-2.5 py-0.5 text-[0.68rem]",
  md: "px-3 py-1 text-xs",
};

/** Pill/tag en mono para items de stack, categorías y metadatos. */
export function Tag({
  variant = "soft",
  size = "md",
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-mono tracking-wide whitespace-nowrap",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
