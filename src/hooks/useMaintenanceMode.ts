import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMaintenanceMode() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await supabase
          .from("maintenance_mode")
          .select("is_enabled, message, ends_at")
          .limit(1)
          .single();

        if (data?.is_enabled) {
          // If ends_at is in the past, auto-disable
          if (data.ends_at && new Date(data.ends_at).getTime() < Date.now()) {
            setIsMaintenance(false);
          } else {
            setIsMaintenance(true);
            setMaintenanceMessage(data.message || "");
            setEndsAt(data.ends_at || null);
          }
        }
      } catch {
        // Table might not exist or be empty
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  return { isMaintenance, maintenanceMessage, endsAt, loading };
}
