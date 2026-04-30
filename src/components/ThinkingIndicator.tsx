import { useEffect, useRef, useState } from "react";
import { CircleGauge, Globe, Image as ImageIcon, Link as LinkIcon, Search, Code2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Real-time thinking phase. Driven by actual stream lifecycle:
 *   - "connecting": request sent, waiting for first byte
 *   - "streaming":  tokens are arriving live
 *   - "done":       stream finished (component should be unmounted by parent)
 */
export type ThinkingPhase = "connecting" | "streaming" | "done";

interface ThinkingIndicatorProps {
  isThinking: boolean;
  context?: string;
  /** Live phase fed from the chat hook. Falls back to "connecting" until first token. */
  phase?: ThinkingPhase;
  /** True once first token is received — used for auto phase fallback. */
  hasFirstToken?: boolean;
}

type Mode = "general" | "search" | "deep" | "code" | "link" | "image";

const MODE_META: Record<Mode, { icon: React.ElementType; label: string }> = {
  general: { icon: CircleGauge, label: "Thinking" },
  search:  { icon: Globe,       label: "Web search" },
  deep:    { icon: Search,      label: "Deep search" },
  code:    { icon: Code2,       label: "Coding" },
  link:    { icon: LinkIcon,    label: "Reading link" },
  image:   { icon: ImageIcon,   label: "Generating image" },
};

function detectMode(context?: string): Mode {
  if (!context) return "general";
  const lower = context.toLowerCase();
  if (/^\[deep\s*search\]/i.test(context)) return "deep";
  if (/^\[web\s*search\]/i.test(context) || /\bsearch\s+(?:the\s+)?(?:web|internet)\b/i.test(lower)) return "search";
  if (/\b(generate|create|draw|make|design)\s+(?:an?\s+)?(image|picture|photo|logo|poster|art)/i.test(lower)) return "image";
  if (/https?:\/\/[^\s]+/.test(context)) return "link";
  if (/(?:write|build|code|function|debug|fix\s+(?:the\s+)?code|refactor|implement)\b/i.test(lower)) return "code";
  return "general";
}

export const ThinkingIndicator = ({ isThinking, context, phase, hasFirstToken }: ThinkingIndicatorProps) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef<number | null>(null);

  // Real elapsed timer — only runs while a stream is genuinely in flight.
  useEffect(() => {
    if (!isThinking) {
      startedAt.current = null;
      setElapsedMs(0);
      return;
    }
    startedAt.current = performance.now();
    setElapsedMs(0);
    const id = window.setInterval(() => {
      if (startedAt.current) setElapsedMs(performance.now() - startedAt.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [isThinking]);

  if (!isThinking) return null;

  const mode = detectMode(context);
  const meta = MODE_META[mode];
  const Icon = meta.icon;

  // Resolve real phase. Parent may pass `phase` explicitly; otherwise infer from `hasFirstToken`.
  const resolvedPhase: ThinkingPhase = phase ?? (hasFirstToken ? "streaming" : "connecting");
  const isStreaming = resolvedPhase === "streaming";

  const seconds = (elapsedMs / 1000).toFixed(elapsedMs < 10_000 ? 1 : 0);

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl glass animate-fade-in">
      <div className="relative w-9 h-9 rounded-xl liquid-droplet flex items-center justify-center !rounded-xl">
        <Icon className="w-4 h-4 text-foreground/90" />
        {isStreaming && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 live-dot shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground/90 truncate">
            {meta.label}
          </span>
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
            isStreaming
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : "bg-muted text-muted-foreground border border-border/40"
          )}>
            {isStreaming ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                live
              </span>
            ) : "connecting"}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
            {seconds}s
          </span>
        </div>
        <div className="h-1 w-full max-w-[180px] rounded-full live-bar" />
      </div>
    </div>
  );
};
