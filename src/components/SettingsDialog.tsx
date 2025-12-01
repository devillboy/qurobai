import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Mail, Calendar } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; created_at: string } | null>(null);

  useEffect(() => {
    if (user && open) {
      fetchProfile();
    }
  }, [user, open]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, created_at")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Account Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {profile?.display_name || "User"}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            {profile?.created_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Member since {formatDate(profile.created_at)}
              </div>
            )}
          </div>

          {/* About QurobAi */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              About QurobAi
            </h4>
            <p className="text-sm text-muted-foreground">
              QurobAi is your friendly AI companion, created by Soham from India 🇮🇳. 
              It's designed to help you with coding, writing, brainstorming, and more!
            </p>
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Quick Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Upload images and documents for analysis</li>
              <li>• Ask QurobAi to write and explain code</li>
              <li>• Use "New Chat" for different topics</li>
              <li>• Copy code blocks with one click</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
