import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, title, message, userIds } = body;

    if (action === "getVapidKey") {
      return new Response(
        JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send") {
      // PRIMARY: Always create in-app notifications so users never miss anything
      let targetUserIds: string[] = userIds || [];
      
      if (!targetUserIds.length) {
        // Broadcast: get all user IDs from profiles
        const { data: allProfiles } = await supabase.from("profiles").select("user_id");
        targetUserIds = (allProfiles || []).map((p: any) => p.user_id);
      }

      let notificationsCreated = 0;
      for (const uid of targetUserIds) {
        const { error } = await supabase.from("notifications").insert({
          user_id: uid,
          title: title || "QurobAi",
          message: message || "You have a new notification",
          type: "push",
          read: false,
        });
        if (!error) notificationsCreated++;
      }

      // SECONDARY: Best-effort Web Push (may fail without proper VAPID encryption)
      let pushSent = 0;
      let pushFailed = 0;

      let query = supabase.from("push_subscriptions").select("*");
      if (userIds?.length) query = query.in("user_id", userIds);
      const { data: subscriptions } = await query;

      if (subscriptions?.length) {
        const payload = JSON.stringify({
          title: title || "QurobAi",
          body: message || "You have a new notification",
          icon: "/favicon.ico",
          data: { url: "/" }
        });

        for (const sub of subscriptions) {
          try {
            const resp = await fetch(sub.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/octet-stream", "TTL": "86400" },
              body: payload,
            });
            if (resp.ok || resp.status === 201) {
              pushSent++;
            } else {
              pushFailed++;
              if (resp.status === 410 || resp.status === 404) {
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
              }
            }
          } catch {
            pushFailed++;
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          notifications_created: notificationsCreated,
          push_sent: pushSent,
          push_failed: pushFailed,
          total_users: targetUserIds.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
