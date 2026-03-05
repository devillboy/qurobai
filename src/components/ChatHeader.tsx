import { Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/NotificationBell";
import qurobLogo from "@/assets/qurob-logo.png";

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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/30 px-3 py-2"
    >
      <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5">
          {onMenuToggle && (
            <Button variant="ghost" size="icon" onClick={onMenuToggle}
              className="h-9 w-9 rounded-xl shrink-0 md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <img src={qurobLogo} alt="QurobAi" className="w-7 h-7 rounded-lg md:hidden" />
        </div>
        
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-primary/40" />
          <span className="text-xs text-muted-foreground/50 hidden sm:inline">Encrypted</span>
        </div>
        
        <NotificationBell />
      </div>
    </motion.header>
  );
};
