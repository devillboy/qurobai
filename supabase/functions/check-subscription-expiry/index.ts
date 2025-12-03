import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking for expiring subscriptions...");

    // Get subscriptions expiring in the next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const now = new Date();

    const { data: expiringSubscriptions, error } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        expires_at,
        status,
        subscription_plans(name, model_name)
      `)
      .eq("status", "active")
      .lte("expires_at", threeDaysFromNow.toISOString())
      .gte("expires_at", now.toISOString());

    if (error) {
      console.error("Error fetching expiring subscriptions:", error);
      throw error;
    }

    console.log(`Found ${expiringSubscriptions?.length || 0} expiring subscriptions`);

    // Update expired subscriptions
    const { data: expiredSubs, error: expiredError } = await supabase
      .from("user_subscriptions")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expires_at", now.toISOString())
      .select();

    if (expiredError) {
      console.error("Error updating expired subscriptions:", expiredError);
    } else {
      console.log(`Marked ${expiredSubs?.length || 0} subscriptions as expired`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        expiringSoon: expiringSubscriptions?.length || 0,
        markedExpired: expiredSubs?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Subscription check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});