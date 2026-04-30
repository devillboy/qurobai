import { useEffect, useRef, useState } from "react";
import { Globe, Link as LinkIcon, Sparkles, Wifi, Wand2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThinkingPhase =
  | "connecting" | "searching" | "reading_url"
  | "image_starting" | "image_done" | "answering"
  | "streaming" | "done";

interface ThinkingIndicatorProps {
  isThinking: boolean;
  context?: string;
  phase?: ThinkingPhase;
  label?: string;
  detail?: string;
  hasFirstToken?: boolean;
}

const PHASE_META: Record<Exclude<ThinkingPhase, "done">, { icon: React.ElementType; label: string; tone: keyof typeof TONE_CLASSES }> = {
  connecting:     { icon: Wifi,         label: "Connecting",        tone: "neutral" },
  searching:      { icon: Globe,        label: "Searching the web", tone: "search" },
  reading_url:    { icon: LinkIcon,     label: "Reading link",      tone: "url" },
  image_starting: { icon: Wand2,        label: "Generating image",  tone: "image" },
  image_done:     { icon: CheckCircle2, label: "Image ready",       tone: "image" },
  answering:      { icon: Sparkles,     label: "Answering",         tone: "live" },
  streaming:      { icon: Sparkles,     label: "Answering",         tone: "live" },
};

const TONE_CLASSES = {
  neutral: { bg: "bg-muted",          text: "text-muted-foreground", border: "border-border/40",      dot: "bg-muted-foreground", glow: "" },
  search:  { bg: "bg-blue-500/15",    text: "text-blue-300",         border: "border-blue-500/30",    dot: "bg-blue-400",         glow: "shadow-[0_0_8px_rgba(96,165,250,0.7)]" },
  url:     { bg: "bg-orange-500/15",  text: "text-orange-300",       border: "border-orange-500/30",  dot: "bg-orange-400",       glow: "shadow-[0_0_8px_rgba(251,146,60,0.7)]" },
  image:   { bg: "bg-pink-500/15",    text: "text-pink-300",         border: "border-pink-500/30",    dot: "bg-pink-400",         glow: "shadow-[0_0_8px_rgba(244,114,182,0.7)]" },
  live:    { bg: "bg-emerald-500/15", text: "text-emerald-300",      border: "border-emerald-500/30", dot: "bg-emerald-400",      glow: "shadow-[0_0_8px_rgba(52,211,153,0.8)]" },
};

export const ThinkingIndicator = ({ isThinking, phase, label, detail, hasFirstToken }: ThinkingIndicatorProps) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!isThinking) { startedAt.current = null; setElapsedMs(0); return; }
    startedAt.current = performance.now();
    setElapsedMs(0);
    const id = window.setInterval(() => {
      if (startedAt.current) setElapsedMs(performance.now() - startedAt.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [isThinking]);

  if (!isThinking) return null;

  const effective: Exclude<ThinkingPhase, "done"> = (phase && phase !== "done")
    ? (phase === "streaming" ? "answering" : phase)
    : (hasFirstToken ? "answering" : "connecting");

  const meta = PHASE_META[effective];
  const Icon = meta.icon;
  const tone = TONE_CLASSES[meta.tone];
  const displayLabel = label || meta.label;
  const seconds = (elapsedMs / 1000).toFixed(elapsedMs < 10_000 ? 1 : 0);
  const isLive = effective === "answering";

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl glass animate-fade-in">
      <div className="relative w-9 h-9 liquid-droplet !rounded-xl flex items-center justify-center">
        <Icon className={cn("w-4 h-4", tone.text)} />
        <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full live-dot", tone.dot, tone.glow)} />
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground/90 truncate" key={effective}>{displayLabel}</span>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider border", tone.bg, tone.text, tone.border)}>
            {isLive ? <span className="inline-flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />live</span> : effective.replace("_", " ")}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">{seconds}s</span>
        </div>
        {detail && <span className="text-[11px] text-muted-foreground/80 truncate max-w-full">{detail.length > 80 ? detail.slice(0, 80) + "…" : detail}</span>}
        <div className="h-1 w-full max-w-[200px] rounded-full live-bar" />
      </div>
    </div>
  );
};
