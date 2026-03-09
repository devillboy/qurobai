import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIKE_THRESHOLDS = {
  WARNING: 1,      // First offense: warning notification
  TEMP_BLOCK: 2,   // Second offense: 7-day temp block
  PERMANENT: 3,    // Third offense: permanent ban
};

const TEMP_BLOCK_DAYS = 7;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, attemptType, details, paymentId } = await req.json();

    if (!userId || !attemptType) {
      return new Response(
        JSON.stringify({ error: "Missing userId or attemptType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record the fraud attempt
    await supabase.from("fraud_attempts").insert({
      user_id: userId,
      attempt_type: attemptType,
      details: details || {},
      payment_id: paymentId,
    });

    // Get or create user ban record
    let { data: banRecord } = await supabase
      .from("user_bans")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!banRecord) {
      const { data: newBan } = await supabase
        .from("user_bans")
        .insert({ user_id: userId, warning_count: 0, ban_level: 0 })
        .select()
        .single();
      banRecord = newBan;
    }

    // Calculate new warning count
    const newWarningCount = (banRecord?.warning_count || 0) + 1;
    let newBanLevel = banRecord?.ban_level || 0;
    let tempBlockedUntil = banRecord?.temp_blocked_until;
    let permanentBan = banRecord?.permanent_ban || false;
    let notificationTitle = "";
    let notificationMessage = "";

    // Progressive punishment
    if (newWarningCount >= STRIKE_THRESHOLDS.PERMANENT) {
      newBanLevel = 3;
      permanentBan = true;
      notificationTitle = "🚫 Account Permanently Suspended";
      notificationMessage = `Your account has been permanently suspended due to repeated fraudulent activity (${attemptType}). This action cannot be reversed. Contact support if you believe this is a mistake.`;
    } else if (newWarningCount >= STRIKE_THRESHOLDS.TEMP_BLOCK) {
      newBanLevel = 2;
      const blockUntil = new Date();
      blockUntil.setDate(blockUntil.getDate() + TEMP_BLOCK_DAYS);
      tempBlockedUntil = blockUntil.toISOString();
      notificationTitle = "⚠️ Account Temporarily Blocked";
      notificationMessage = `Your account has been temporarily blocked for ${TEMP_BLOCK_DAYS} days due to fraudulent activity (${attemptType}). One more violation will result in permanent ban.`;
    } else if (newWarningCount >= STRIKE_THRESHOLDS.WARNING) {
      newBanLevel = 1;
      notificationTitle = "⚠️ Fraud Warning - Strike 1";
      notificationMessage = `We detected suspicious activity on your account: ${attemptType}. This is your first warning. Continued violations will result in account suspension.`;
    }

    // Update ban record
    await supabase
      .from("user_bans")
      .update({
        warning_count: newWarningCount,
        ban_level: newBanLevel,
        temp_blocked_until: tempBlockedUntil,
        permanent_ban: permanentBan,
        ban_reason: attemptType,
        last_offense_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Send in-app notification to user
    if (notificationTitle) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: notificationTitle,
        message: notificationMessage,
        type: "fraud_alert",
        read: false,
      });

      // Also try to send push notification
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: "send",
            title: notificationTitle,
            message: notificationMessage,
            userIds: [userId],
          }),
        });
      } catch (pushError) {
        console.error("Failed to send push notification:", pushError);
      }
    }

    // Notify admin about the fraud attempt
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminRoles?.length) {
      const adminUserIds = adminRoles.map((r) => r.user_id);
      
      // Get user profile for admin notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("display_name, qurob_id")
        .eq("user_id", userId)
        .single();

      const userName = userProfile?.display_name || "Unknown User";
      const qurobId = userProfile?.qurob_id || userId;

      for (const adminId of adminUserIds) {
        await supabase.from("notifications").insert({
          user_id: adminId,
          title: "🚨 Fraud Alert",
          message: `User ${userName} (${qurobId}) - ${attemptType}. Strike ${newWarningCount}/3. Ban level: ${newBanLevel === 3 ? "PERMANENT" : newBanLevel === 2 ? "TEMP BLOCKED" : "WARNING"}`,
          type: "admin_fraud_alert",
          read: false,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        warningCount: newWarningCount,
        banLevel: newBanLevel,
        isPermanentlyBanned: permanentBan,
        isTempBlocked: newBanLevel === 2,
        tempBlockedUntil,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fraud detector error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
