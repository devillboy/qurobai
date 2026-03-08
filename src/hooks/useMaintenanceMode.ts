import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMaintenanceMode() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await supabase
          .from("maintenance_mode")
          .select("is_enabled, message")
          .limit(1)
          .single();

        if (data?.is_enabled) {
          setIsMaintenance(true);
          setMaintenanceMessage(data.message || "");
        }
      } catch {
        // Table might not exist or be empty — treat as no maintenance
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  return { isMaintenance, maintenanceMessage, loading };
}
