import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ThreeDText } from "@/components/ThreeDText";
import { NotificationBell } from "@/components/NotificationBell";

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
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-3 py-2 md:hidden"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {showBackButton && onBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="h-9 w-9 rounded-xl shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          {onMenuToggle && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuToggle}
              className="h-9 w-9 rounded-xl shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        <h1 className="text-lg font-bold truncate">
          <ThreeDText as="span" className="text-lg">
            {title}
          </ThreeDText>
        </h1>
        
        <NotificationBell />
      </div>
    </motion.header>
  );
};
