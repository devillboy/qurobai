import { useState, useEffect } from "react";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  isThinking: boolean;
}

const thinkingPhrases = [
  "Analyzing your question",
  "Processing context",
  "Formulating response",
  "Reasoning through",
  "Connecting ideas",
  "Synthesizing answer",
];

export const ThinkingIndicator = ({ isThinking }: ThinkingIndicatorProps) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!isThinking) {
      setPhraseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isThinking]);

  if (!isThinking) return null;

  return (
    <div className="flex items-center gap-3 p-4 animate-fade-in">
      <div className="relative w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Brain className="w-4 h-4 text-primary animate-pulse" />
        {/* Orbiting ring */}
        <div className="absolute inset-0 rounded-lg border border-primary/30 animate-[spin_3s_linear_infinite]" />
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground animate-fade-in" key={phraseIndex}>
            {thinkingPhrases[phraseIndex]}
          </span>
          <span className="text-primary text-sm animate-pulse">...</span>
        </div>
        {/* Shimmer bar */}
        <div className="h-1 w-32 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent loading-shimmer" />
        </div>
      </div>
    </div>
  );
};
