import { Construction } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SupportChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportChatbot = ({ open, onOpenChange }: SupportChatbotProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Construction className="w-5 h-5 text-warning" />
            Support Chat
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Our support chatbot is currently under construction. 
            For now, please email us at{" "}
            <a 
              href="mailto:sohamghosh679@gmail.com" 
              className="text-primary hover:underline"
            >
              sohamghosh679@gmail.com
            </a>
          </p>
          <div className="mt-6 px-4 py-2 rounded-full bg-warning/10 text-warning text-sm font-medium">
            🚧 Under Construction
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
