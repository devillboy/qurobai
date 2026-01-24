import { cn } from "@/lib/utils";

type ThreeDTextProps = {
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  className?: string;
  depth?: number; // visual depth in px
};

/**
 * Lightweight “3D” heading using layered text-shadows + existing theme tokens.
 * Avoids heavy WebGL so it stays fast and feels hand-crafted.
 */
export function ThreeDText({
  as: Comp = "span",
  children,
  className,
  depth = 10,
}: ThreeDTextProps) {
  const shadow = Array.from({ length: Math.max(3, Math.min(depth, 14)) })
    .map((_, i) => {
      const y = i + 1;
      const blur = Math.max(0, (i - 2) * 0.4);
      const alpha = Math.max(0.06, 0.28 - i * 0.015);
      // Use semantic tokens only (no hard-coded colors)
      return `0 ${y}px ${blur}px hsl(var(--foreground) / ${alpha})`;
    })
    .join(", ");

  return (
    <Comp
      className={cn(
        "relative inline-block",
        "animate-enter motion-reduce:animate-none",
        "will-change-transform",
        "[transform:translateZ(0)]",
        className,
      )}
      style={{
        textShadow: shadow,
      }}
    >
      {/* soft highlight */}
      <span
        className={cn(
          "pointer-events-none absolute inset-0",
          "text-transparent",
          "bg-clip-text",
          "bg-gradient-to-b from-primary/70 via-primary/20 to-transparent",
          "blur-[0.25px]",
          "opacity-80",
        )}
        aria-hidden
      >
        {children}
      </span>
      <span className={cn("relative", "text-gradient")}>{children}</span>
    </Comp>
  );
}
