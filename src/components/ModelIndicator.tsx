import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Code, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ModelIndicatorProps {
  currentModel: string;
}

export default function ModelIndicator({ currentModel }: ModelIndicatorProps) {
  const navigate = useNavigate();
  const isUltimate = currentModel === "Qurob 5";
  const isPremium = currentModel === "Qurob 4";
  const displayModel = currentModel === "Qurob 2" ? "Qurob 3.2" : currentModel;

  const modelInfo = isUltimate
    ? {
        description: "Next-gen tuned agent with auto Web + Deep Search and live web grounding",
        features: ["Auto Web + Deep Search", "Most powerful reasoning", "Multi-step agent", "Live web grounding"],
      }
    : isPremium
    ? {
        description: "Premium AI with advanced reasoning, deep analysis, and Q-06 code specialist access",
        features: ["Enhanced reasoning", "Deeper analysis", "Q-06 Code AI", "Priority responses"],
      }
    : {
        description: "Powerful free AI with 600B+ parameters for everyday tasks",
        features: ["General conversations", "Code assistance", "Real-time data access", "Web & Deep Search"],
      };

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-3 px-4 py-2.5 backdrop-blur-sm rounded-lg border ${isUltimate ? "bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-purple-600/10 border-yellow-500/40" : "bg-card/50"}`}>
        <div className="flex items-center gap-2">
          {isUltimate ? (
            <>
              <div className="relative">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="font-semibold cursor-help bg-gradient-to-r from-yellow-500 via-orange-500 to-purple-600 text-white border-0">
                    {displayModel}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">{modelInfo.description}</p>
                  <ul className="text-xs text-muted-foreground">
                    {modelInfo.features.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-yellow-500 font-bold">ULTIMATE</span>
            </>
          ) : isPremium ? (
            <>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="default" className="font-semibold cursor-help">{displayModel}</Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">{modelInfo.description}</p>
                  <ul className="text-xs text-muted-foreground">
                    {modelInfo.features.map((f, i) => <li key={i}>• {f}</li>)}
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
                  <Badge variant="secondary" className="cursor-help">{displayModel}</Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">{modelInfo.description}</p>
                  <ul className="text-xs text-muted-foreground">
                    {modelInfo.features.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">Free</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {isUltimate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/15 text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs font-medium">Auto Search</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Web + Deep Search are automatic with Qurob 5</p></TooltipContent>
            </Tooltip>
          )}
          {isPremium && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary">
                  <Code className="w-3 h-3" />
                  <span className="text-xs font-medium">Q-06</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Code Specialist AI for complex programming tasks</p></TooltipContent>
            </Tooltip>
          )}
          {!isPremium && !isUltimate && (
            <Button size="sm" variant="outline" onClick={() => navigate("/subscribe")} className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Upgrade to Qurob 5
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
