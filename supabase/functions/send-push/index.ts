import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate VAPID keys if not present (run once to generate, then store in secrets)
// You can use: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";

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

    // Return VAPID public key for client subscription
    if (action === "getVapidKey") {
      return new Response(
        JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send push notifications
    if (action === "send") {
      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        return new Response(
          JSON.stringify({ error: "VAPID keys not configured. Generate keys with: npx web-push generate-vapid-keys" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get push subscriptions
      let query = supabase.from("push_subscriptions").select("*");
      
      if (userIds && userIds.length > 0) {
        query = query.in("user_id", userIds);
      }
      
      const { data: subscriptions, error } = await query;
      
      if (error) {
        throw error;
      }

      if (!subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ success: true, sent: 0, message: "No push subscriptions found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = JSON.stringify({
        title: title || "QurobAi",
        body: message || "You have a new notification",
        icon: "/favicon.ico",
        data: { url: "/" }
      });

      let sent = 0;
      let failed = 0;

      // Send to each subscription using Web Push
      for (const sub of subscriptions) {
        try {
          // For now, we'll use a simple approach
          // In production, you'd want to use a proper web-push library
          const pushResponse = await sendWebPush(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            payload,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
          );

          if (pushResponse.ok) {
            sent++;
          } else {
            failed++;
            // Remove invalid subscriptions
            if (pushResponse.status === 410 || pushResponse.status === 404) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
            }
          }
        } catch (e) {
          console.error("Push send error:", e);
          failed++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, sent, failed, total: subscriptions.length }),
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

// Simplified Web Push implementation
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  // This is a simplified version - in production use proper web-push library
  // For now, we'll just make the request and handle 201/404/410 responses
  
  try {
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
      },
      body: payload,
    });
    return response;
  } catch (e) {
    // Return a failed response object
    return new Response(null, { status: 500 });
  }
}
