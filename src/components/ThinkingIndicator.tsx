import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface ThinkingIndicatorProps {
  isThinking: boolean;
}

export const ThinkingIndicator = ({ isThinking }: ThinkingIndicatorProps) => {
  const [seconds, setSeconds] = useState(0);
  const [showLonger, setShowLonger] = useState(false);

  useEffect(() => {
    if (!isThinking) {
      setSeconds(0);
      setShowLonger(false);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev + 1;
        if (newSeconds >= 5) setShowLonger(true);
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isThinking]);

  if (!isThinking) return null;

  return (
    <div className="flex items-center gap-3 p-4 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {showLonger ? "Thinking deeper" : "Thinking"}
          </span>
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
        {seconds > 0 && (
          <span className="text-xs text-muted-foreground">
            Thought for {seconds}s
          </span>
        )}
      </div>
    </div>
  );
};