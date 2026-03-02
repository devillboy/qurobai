import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CURRENT_VERSION = "3.0.0";

const highlights = [
  "🚀 AI now powered by Google Gemini directly — faster & smarter",
  "🔍 Web Search & Deep Search in chat",
  "🤖 Custom Qurobs — build your own AI assistants",
  "⚡ Professional new splash screen",
  "📱 Better mobile experience",
  "🔒 Encryption indicators in chat",
];

export const WhatsNewPopup = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const lastSeen = localStorage.getItem("qurobai_last_seen_version");
    if (lastSeen !== CURRENT_VERSION) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("qurobai_last_seen_version", CURRENT_VERSION);
    setOpen(false);
  };

  const handleViewAll = () => {
    handleDismiss();
    navigate("/patch-updates");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What's New in QurobAi
            <Badge className="text-[10px]">v{CURRENT_VERSION}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {highlights.map((h, i) => (
            <p key={i} className="text-sm text-muted-foreground">{h}</p>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">Got it</Button>
          <Button onClick={handleViewAll} className="flex-1 gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
