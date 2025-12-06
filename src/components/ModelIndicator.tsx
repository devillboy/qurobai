import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Code, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelIndicatorProps {
  currentModel: string;
}

export default function ModelIndicator({ currentModel }: ModelIndicatorProps) {
  const navigate = useNavigate();
  const isPremium = currentModel === "Qurob 4";

  const modelInfo = isPremium
    ? {
        description: "Premium AI with advanced reasoning, deep analysis, and Q-06 code specialist access",
        features: ["Enhanced reasoning", "Deeper analysis", "Q-06 Code AI", "Priority responses"],
      }
    : {
        description: "Standard AI for everyday tasks and conversations",
        features: ["General conversations", "Basic code help", "Real-time data access"],
      };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 px-4 py-2.5 bg-card/50 backdrop-blur-sm rounded-lg border">
        <div className="flex items-center gap-2">
          {isPremium ? (
            <>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="default" className="font-semibold cursor-help">
                    {currentModel}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">{modelInfo.description}</p>
                  <ul className="text-xs text-muted-foreground">
                    {modelInfo.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-primary font-medium">Premium</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-help">
                    {currentModel}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">{modelInfo.description}</p>
                  <ul className="text-xs text-muted-foreground">
                    {modelInfo.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">Free</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {isPremium && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary">
                  <Code className="w-3 h-3" />
                  <span className="text-xs font-medium">Q-06</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Code Specialist AI for complex programming tasks</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {!isPremium && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/subscribe")}
              className="text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Upgrade to Qurob 4
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
