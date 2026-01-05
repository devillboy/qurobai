import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Mail, 
  Calendar, 
  Shield, 
  CreditCard, 
  History, 
  ChevronRight,
  Crown,
  LogOut,
  Sliders,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalizationDialog } from "./PersonalizationDialog";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; created_at: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchProfile();
      checkAdminStatus();
      fetchSubscription();
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

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const fetchSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans(name, model_name)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    setSubscription(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
    navigate("/auth");
  };

  const handleExportConversations = async () => {
    if (!user) return;
    
    try {
      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (!conversations?.length) {
        toast.error("No conversations to export");
        return;
      }

      const allData: any[] = [];
      
      for (const conv of conversations) {
        const { data: messages } = await supabase
          .from("messages")
          .select("role, content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });
        
        allData.push({
          title: conv.title,
          created_at: conv.created_at,
          messages: messages || [],
        });
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qurobai-conversations-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Conversations exported!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export conversations");
    }
  };

  const MenuItem = ({ 
    icon: Icon, 
    label, 
    description, 
    onClick, 
    highlight 
  }: { 
    icon: any; 
    label: string; 
    description?: string; 
    onClick: () => void;
    highlight?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
        highlight 
          ? "bg-foreground/5 border border-foreground/10 hover:bg-foreground/10" 
          : "bg-secondary hover:bg-secondary/80"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        highlight ? "bg-foreground/10" : "bg-muted"
      }`}>
        <Icon className={`w-5 h-5 ${highlight ? "text-foreground" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 text-left">
        <div className={`text-sm font-medium ${highlight ? "text-foreground" : ""}`}>{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-center text-xl">Settings</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* User Profile Card */}
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-foreground flex items-center justify-center text-background text-xl font-bold">
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
            {profile?.created_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                <Calendar className="w-3 h-3" />
                Member since {formatDate(profile.created_at)}
              </div>
            )}
          </div>

          {/* Subscription Status */}
          <div className={`p-4 rounded-xl border ${
            subscription 
              ? "bg-foreground/5 border-foreground/10" 
              : "bg-secondary border-border"
          }`}>
            <div className="flex items-center gap-3">
              <Crown className={`w-5 h-5 ${subscription ? "text-foreground" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {subscription ? subscription.subscription_plans?.name : "Free Plan"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {subscription 
                    ? `Expires ${formatDate(subscription.expires_at)}` 
                    : "Using Qurob 2 model"}
                </div>
              </div>
              {!subscription && (
                <Button 
                  size="sm" 
                  onClick={() => handleNavigate("/subscribe")}
                  className="text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <MenuItem 
              icon={Sliders} 
              label="Personalization" 
              description="Customize AI tone & instructions"
              onClick={() => setPersonalizationOpen(true)}
            />
            
            <MenuItem 
              icon={CreditCard} 
              label="Upgrade to Qurob 4" 
              description="Get better answers with premium AI"
              onClick={() => handleNavigate("/subscribe")}
              highlight
            />
            
            <MenuItem 
              icon={History} 
              label="Subscription History" 
              description="View past payments & subscriptions"
              onClick={() => handleNavigate("/subscription-history")}
            />

            <MenuItem 
              icon={Download} 
              label="Export Conversations" 
              description="Download all your chat history"
              onClick={handleExportConversations}
            />

            {isAdmin && (
              <MenuItem 
                icon={Shield} 
                label="Admin Panel" 
                description="Manage payments & users"
                onClick={() => handleNavigate("/admin")}
              />
            )}
          </div>

          {/* About QurobAi */}
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              About QurobAi
            </h4>
            <p className="text-xs text-muted-foreground">
              QurobAi is your AI companion, created by Soham from India 🇮🇳. 
              Designed to help you with coding, writing, brainstorming, and more!
            </p>
          </div>

          {/* Sign Out */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Personalization Dialog */}
        <PersonalizationDialog 
          open={personalizationOpen} 
          onOpenChange={setPersonalizationOpen} 
        />
      </DialogContent>
    </Dialog>
  );
};
