import { Menu, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/NotificationBell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onBack?: () => void;
  onMenuToggle?: () => void;
  showBackButton?: boolean;
  title?: string;
}

export const ChatHeader = ({ 
  onBack, 
  onMenuToggle,
  showBackButton = true,
  title = "QurobAi"
}: ChatHeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-3 py-2 md:py-1.5"
    >
      <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          {onMenuToggle && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuToggle}
              className="h-9 w-9 rounded-xl shrink-0 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        <h1 className="text-lg md:text-base font-bold truncate flex items-center gap-2">
          <span>{title}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="w-3 h-3 text-muted-foreground/40" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Messages encrypted in transit (TLS)
            </TooltipContent>
          </Tooltip>
        </h1>
        
        <NotificationBell />
      </div>
    </motion.header>
  );
};
