import { Brain } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BrainMemoryToggleProps {
  enabled: boolean | undefined;
  onToggle: (next: boolean) => void;
}

export function BrainMemoryToggle({ enabled, onToggle }: BrainMemoryToggleProps) {
  // undefined = inherit global default; treat as ON visually only when explicitly true
  const isOn = enabled === true;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onToggle(!isOn)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all touch-manipulation btn-3d",
              isOn
                ? "bg-primary/15 text-primary border-primary/40 glow-sm"
                : "bg-secondary/50 text-muted-foreground border-border/40 hover:border-primary/30"
            )}
            aria-label="Toggle Brain Memory"
          >
            <Brain className={cn("w-3 h-3", isOn && "animate-pulse")} />
            <span>Memory {isOn ? "On" : "Off"}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-1">Brain Memory</p>
          <p className="text-xs text-muted-foreground">
            When ON, AI remembers your preferences and key facts from past conversations to give better, more personal answers in this chat.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}