import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// IP Geolocation API (free tier)
async function getLocationFromIP(ip: string): Promise<string> {
  try {
    // Skip for localhost/private IPs
    if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip === "::1") {
      return "Local Network";
    }
    
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`);
    if (resp.ok) {
      const data = await resp.json();
      return data.city && data.country ? `${data.city}, ${data.country}` : "Unknown";
    }
  } catch (e) {
    console.error("Geolocation error:", e);
  }
  return "Unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, userId, deviceInfo, ipAddress, sessionToken } = await req.json();

    if (action === "track_login") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const location = await getLocationFromIP(ipAddress || "");

      // Check if this device/location combination is new
      const { data: existingSessions } = await supabase
        .from("user_sessions")
        .select("id, device_info, ip_address, location")
        .eq("user_id", userId);

      const isNewDevice = !existingSessions?.some(s => s.device_info === deviceInfo);
      const isNewLocation = !existingSessions?.some(s => s.location === location);

      // Create new session record
      const newSessionToken = crypto.randomUUID();
      const { data: newSession } = await supabase
        .from("user_sessions")
        .insert({
          user_id: userId,
          device_info: deviceInfo || "Unknown Device",
          ip_address: ipAddress || "Unknown",
          location,
          session_token: newSessionToken,
          is_current: true,
        })
        .select()
        .single();

      // Mark other sessions as not current
      await supabase
        .from("user_sessions")
        .update({ is_current: false })
        .eq("user_id", userId)
        .neq("id", newSession?.id);

      // If new device or location, send alert
      if (isNewDevice || isNewLocation) {
        // Record the login alert
        await supabase.from("login_alerts").insert({
          user_id: userId,
          device_info: deviceInfo,
          ip_address: ipAddress,
          location,
          is_new_device: isNewDevice,
          is_new_location: isNewLocation,
        });

        // Send in-app notification
        const alertTitle = isNewDevice ? "🔐 New Device Login" : "📍 New Location Login";
        const alertMessage = isNewDevice
          ? `A new device (${deviceInfo || "Unknown"}) logged into your account from ${location}. If this wasn't you, secure your account immediately.`
          : `Your account was accessed from a new location: ${location}. If this wasn't you, change your password now.`;

        await supabase.from("notifications").insert({
          user_id: userId,
          title: alertTitle,
          message: alertMessage,
          type: "login_alert",
          read: false,
        });

        // Send push notification
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-push`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              action: "send",
              title: alertTitle,
              message: alertMessage,
              userIds: [userId],
            }),
          });
        } catch (pushError) {
          console.error("Failed to send login alert push:", pushError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          sessionToken: newSessionToken,
          isNewDevice,
          isNewLocation,
          location,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_sessions") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: sessions } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("login_at", { ascending: false });

      return new Response(
        JSON.stringify({ success: true, sessions: sessions || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "revoke_session") {
      if (!userId || !sessionToken) {
        return new Response(
          JSON.stringify({ error: "Missing userId or sessionToken" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", userId)
        .eq("session_token", sessionToken);

      return new Response(
        JSON.stringify({ success: true, message: "Session revoked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "revoke_all_except_current") {
      if (!userId || !sessionToken) {
        return new Response(
          JSON.stringify({ error: "Missing userId or sessionToken" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", userId)
        .neq("session_token", sessionToken);

      return new Response(
        JSON.stringify({ success: true, message: "All other sessions revoked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Login tracker error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
