import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModelIndicatorProps {
  currentModel: string;
}

export default function ModelIndicator({ currentModel }: ModelIndicatorProps) {
  const navigate = useNavigate();
  const isPremium = currentModel === "Qurob 4";

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border">
      <div className="flex items-center gap-2">
        {isPremium ? (
          <>
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <Badge variant="default" className="font-semibold">
              {currentModel}
            </Badge>
            <span className="text-xs text-muted-foreground">Premium</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary">
              {currentModel}
            </Badge>
            <span className="text-xs text-muted-foreground">Free</span>
          </>
        )}
      </div>
      
      {!isPremium && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/subscribe")}
          className="ml-auto"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      )}
    </div>
  );
}
