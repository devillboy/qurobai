import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPushHTTPRequest } from "npm:@pushforge/builder@2.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";

// Convert base64url raw VAPID keys to JWK for P-256 curve
function vapidKeysToJWK(publicKeyBase64: string, privateKeyBase64: string) {
  // Public key is 65 bytes uncompressed (04 + x + y), base64url encoded
  // Private key is 32 bytes raw, base64url encoded
  
  // Decode public key to get x and y coordinates
  const pubBytes = base64urlToBytes(publicKeyBase64);
  // Skip first byte (0x04 uncompressed point indicator)
  const x = bytesToBase64url(pubBytes.slice(1, 33));
  const y = bytesToBase64url(pubBytes.slice(33, 65));
  const d = privateKeyBase64; // Already base64url

  return {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
    ext: true,
  };
}

function base64urlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
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
      // PRIMARY: Always create in-app notifications
      let targetUserIds: string[] = userIds || [];
      
      if (!targetUserIds.length) {
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

      // SECONDARY: Real Web Push with VAPID + encryption
      let pushSent = 0;
      let pushFailed = 0;

      let query = supabase.from("push_subscriptions").select("*");
      if (userIds?.length) query = query.in("user_id", userIds);
      const { data: subscriptions } = await query;

      if (subscriptions?.length && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        const privateJWK = vapidKeysToJWK(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

        for (const sub of subscriptions) {
          try {
            const pushPayload = JSON.stringify({
              title: title || "QurobAi",
              body: message || "You have a new notification",
              icon: "/favicon.ico",
              data: { url: "/chat" },
            });

            const { endpoint, headers, body: pushBody } = await buildPushHTTPRequest({
              privateJWK,
              subscription: {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              message: {
                payload: pushPayload,
                ttl: 86400,
              },
              adminContact: "mailto:sohamghosh679@gmail.com",
            });

            const resp = await fetch(endpoint, {
              method: "POST",
              headers,
              body: pushBody,
            });

            if (resp.ok || resp.status === 201) {
              pushSent++;
            } else {
              pushFailed++;
              const respText = await resp.text();
              console.error(`Push failed for ${sub.endpoint}: ${resp.status} ${respText}`);
              // Remove expired/invalid subscriptions
              if (resp.status === 410 || resp.status === 404) {
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
              }
            }
          } catch (err) {
            pushFailed++;
            console.error(`Push error for ${sub.endpoint}:`, err);
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
