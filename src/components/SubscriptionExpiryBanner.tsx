import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const SubscriptionExpiryBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkExpiry = async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.expires_at) {
        const expiryDate = new Date(data.expires_at);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 3 && diffDays > 0) {
          setDaysUntilExpiry(diffDays);
        }
      }
    };

    checkExpiry();
  }, [user]);

  if (!daysUntilExpiry || dismissed) return null;

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-600 dark:text-yellow-400">
            Your Qurob 4 subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}.
          </span>
          <Button 
            variant="link" 
            size="sm" 
            className="text-yellow-600 dark:text-yellow-400 p-0 h-auto"
            onClick={() => navigate("/subscribe")}
          >
            Renew now
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};