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
import { motion } from "framer-motion";
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
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalizationDialog } from "./PersonalizationDialog";

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

  const menuItemVariants = {
    hover: { scale: 1.02, x: 4 },
    tap: { scale: 0.98 }
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
    <motion.button
      variants={menuItemVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
        highlight 
          ? "bg-primary/10 border border-primary/20 hover:bg-primary/15" 
          : "bg-secondary/50 hover:bg-secondary/80"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        highlight ? "bg-primary/20" : "bg-secondary"
      }`}>
        <Icon className={`w-5 h-5 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 text-left">
        <div className={`text-sm font-medium ${highlight ? "text-primary" : ""}`}>{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </motion.button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-center text-xl">Settings</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* User Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-secondary/50 border border-border/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/25">
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">
                <Calendar className="w-3 h-3" />
                Member since {formatDate(profile.created_at)}
              </div>
            )}
          </motion.div>

          {/* Subscription Status */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-xl border ${
              subscription 
                ? "bg-primary/5 border-primary/20" 
                : "bg-secondary/30 border-border/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Crown className={`w-5 h-5 ${subscription ? "text-primary" : "text-muted-foreground"}`} />
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
          </motion.div>

          {/* Menu Items */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
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

            {isAdmin && (
              <MenuItem 
                icon={Shield} 
                label="Admin Panel" 
                description="Manage payments & coupons"
                onClick={() => handleNavigate("/admin")}
              />
            )}
          </motion.div>

          {/* About QurobAi */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              About QurobAi
            </h4>
            <p className="text-xs text-muted-foreground">
              QurobAi is your friendly AI companion, created by Soham from India 🇮🇳. 
              Designed to help you with coding, writing, brainstorming, and more!
            </p>
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
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