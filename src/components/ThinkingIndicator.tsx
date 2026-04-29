import { useState, useEffect, useMemo } from "react";
import { CircleGauge, Globe, Code2, Image, Search, Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  isThinking: boolean;
  context?: string; // last user message to detect context
}

type ThinkingMode = "general" | "search" | "code" | "link" | "image" | "deep";

const modeConfig: Record<ThinkingMode, { icon: React.ElementType; phrases: string[]; color: string }> = {
  general: {
    icon: CircleGauge,
    color: "text-primary",
    phrases: [
      "Thinking...",
      "Processing your message",
      "Crafting a response",
      "Almost there",
    ],
  },
  search: {
    icon: Globe,
    color: "text-blue-400",
    phrases: [
      "Searching the web",
      "Fetching results",
      "Reading sources",
      "Compiling findings",
    ],
  },
  deep: {
    icon: Search,
    color: "text-purple-400",
    phrases: [
      "Deep searching",
      "Analyzing multiple sources",
      "Cross-referencing data",
      "Building comprehensive answer",
    ],
  },
  code: {
    icon: Code2,
    color: "text-green-400",
    phrases: [
      "Writing code",
      "Checking syntax",
      "Optimizing solution",
      "Finalizing code",
    ],
  },
  link: {
    icon: Link,
    color: "text-orange-400",
    phrases: [
      "Fetching URL content",
      "Analyzing page",
      "Extracting information",
      "Preparing analysis",
    ],
  },
  image: {
    icon: Image,
    color: "text-pink-400",
    phrases: [
      "Generating image",
      "Creating artwork",
      "Rendering pixels",
      "Adding finishing touches",
    ],
  },
};

function detectMode(context?: string): ThinkingMode {
  if (!context) return "general";
  const lower = context.toLowerCase();
  if (/^\[deep\s*search\]/i.test(context)) return "deep";
  if (/^\[web\s*search\]/i.test(context) || /search\s+(?:the\s+)?(?:web|internet)/i.test(lower)) return "search";
  if (/generate\s+(?:an?\s+)?image|create\s+(?:an?\s+)?(?:image|picture)|draw\s+/i.test(lower)) return "image";
  if (/https?:\/\/[^\s]+/.test(context)) return "link";
  if (/(?:write|create|build|code|function|program|script|debug|fix\s+(?:the\s+)?code|implement)/i.test(lower)) return "code";
  return "general";
}

export const ThinkingIndicator = ({ isThinking, context }: ThinkingIndicatorProps) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const mode = useMemo(() => detectMode(context), [context]);
  const config = modeConfig[mode];
  const Icon = config.icon;

  useEffect(() => {
    if (!isThinking) {
      setPhraseIndex(0);
      setElapsed(0);
      return;
    }
    const phraseTimer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % config.phrases.length);
    }, 2200);
    const elapsedTimer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(phraseTimer);
      clearInterval(elapsedTimer);
    };
  }, [isThinking, config.phrases.length]);

  if (!isThinking) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border/20 animate-fade-in">
      <div className="relative w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
        <Icon className={cn("w-4 h-4 animate-pulse", config.color)} />
        <div className={cn("absolute inset-0 rounded-xl border animate-[spin_4s_linear_infinite]", 
          mode === "general" ? "border-primary/20" : 
          mode === "search" ? "border-blue-400/20" :
          mode === "deep" ? "border-purple-400/20" :
          mode === "code" ? "border-green-400/20" :
          mode === "link" ? "border-orange-400/20" : "border-pink-400/20"
        )} />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground" key={`${mode}-${phraseIndex}`}>
            {config.phrases[phraseIndex]}
          </span>
          <span className={cn("text-xs animate-pulse", config.color)}>
            {elapsed > 0 ? `${elapsed}s` : "..."}
          </span>
        </div>
        <div className="h-0.5 w-28 rounded-full bg-muted overflow-hidden">
          <div className={cn(
            "h-full w-full loading-shimmer",
            mode === "general" ? "bg-gradient-to-r from-transparent via-primary/30 to-transparent" :
            mode === "search" ? "bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" :
            mode === "deep" ? "bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" :
            mode === "code" ? "bg-gradient-to-r from-transparent via-green-400/30 to-transparent" :
            mode === "link" ? "bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" :
            "bg-gradient-to-r from-transparent via-pink-400/30 to-transparent"
          )} />
        </div>
      </div>
    </div>
  );
};
