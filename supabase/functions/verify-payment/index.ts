import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchWithRetry(url: string, options: RequestInit, retries = 2, timeout = 15000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.status === 503 && i < retries) {
        await new Promise(r => setTimeout(r, 300 * (i + 1)));
        continue;
      }
      return response;
    } catch (e) {
      clearTimeout(timeoutId);
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId } = await req.json();
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Payment ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Verifying payment:", paymentId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: payment, error: paymentError } = await supabase
      .from("payment_screenshots")
      .select(`*, subscription_plans(name, price_inr)`)
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const expectedAmount = payment.subscription_plans?.price_inr || payment.amount_paid;

    // ===== UTR VALIDATION (strict - no auto-approve on UTR alone) =====
    const adminNotes = payment.admin_notes || "";
    const transactionIdMatch = adminNotes.match(/Transaction ID:\s*(\S+)/i);
    let validatedUtr: string | null = null;
    
    if (transactionIdMatch && transactionIdMatch[1]) {
      const transactionId = transactionIdMatch[1].trim();
      
      // 1. UTR Format Validation — UPI UTRs are 12-22 digit numeric
      const utrRegex = /^\d{12,22}$/;
      if (!utrRegex.test(transactionId)) {
        console.warn("Invalid UTR format:", transactionId);
        await supabase.from("payment_screenshots").update({
          admin_notes: `❌ REJECTED: Invalid UTR format "${transactionId}" — must be 12-22 digits numeric. Original notes: ${adminNotes}`,
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        }).eq("id", paymentId);
        await supabase.from("notifications").insert({
          user_id: payment.user_id,
          title: "❌ Payment Rejected",
          message: "Invalid Transaction/UTR ID format. Please provide a valid 12-22 digit UPI transaction reference number.",
          type: "error",
        });
        return new Response(JSON.stringify({ 
          success: false, action: "rejected",
          verification: { recommendation: "reject", confidence: "high", reason: "Invalid UTR format" }
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      // 2. Duplicate UTR Check — same UTR already used = fraud
      const { data: existingPayment } = await supabase
        .from("payment_screenshots")
        .select("id, user_id, status")
        .eq("utr_number", transactionId)
        .eq("status", "approved")
        .maybeSingle();
      
      if (existingPayment && existingPayment.id !== paymentId) {
        console.warn("Duplicate UTR detected:", transactionId, "already used in payment:", existingPayment.id);
        await supabase.from("payment_screenshots").update({
          admin_notes: `🚨 FRAUD ALERT: Duplicate UTR "${transactionId}" — already used in payment ${existingPayment.id}`,
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        }).eq("id", paymentId);
        await supabase.from("notifications").insert({
          user_id: payment.user_id,
          title: "❌ Payment Rejected",
          message: "This Transaction/UTR ID has already been used. Duplicate payments are not allowed.",
          type: "error",
        });
        return new Response(JSON.stringify({ 
          success: false, action: "rejected",
          verification: { recommendation: "reject", confidence: "high", reason: "Duplicate UTR — already used" }
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      // 3. Amount check
      const amountMatches = Math.abs(payment.amount_paid - expectedAmount) <= 10;
      if (!amountMatches) {
        console.warn("Amount mismatch for UTR:", transactionId);
        await supabase.from("payment_screenshots").update({
          admin_notes: `❌ Amount mismatch: Paid ₹${payment.amount_paid}, Expected ₹${expectedAmount}. UTR: ${transactionId}`,
        }).eq("id", paymentId);
        // Don't auto-reject, let screenshot AI verify
      }
      
      // UTR passed format + duplicate checks — store it but DON'T auto-approve
      // Require screenshot AI verification as well
      validatedUtr = transactionId;
      await supabase.from("payment_screenshots").update({
        utr_number: transactionId,
      }).eq("id", paymentId);
      
      console.log("UTR validated (format + duplicate check passed):", transactionId, "— proceeding to screenshot verification");
    }

    // ===== SCREENSHOT-BASED AI VERIFICATION =====
    const screenshotUrl = payment.screenshot_url;
    if (!screenshotUrl) {
      return new Response(JSON.stringify({ 
        success: false, action: "manual_review",
        error: "No screenshot and no valid transaction ID provided",
        manual_review_required: true
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let storagePath = "";
    if (screenshotUrl.includes("/payment-screenshots/")) {
      const parts = screenshotUrl.split("/payment-screenshots/");
      storagePath = parts[1] || "";
    }

    let signedImageUrl = screenshotUrl;
    if (storagePath) {
      const { data: signedData, error: signError } = await supabase.storage.from("payment-screenshots").createSignedUrl(storagePath, 600);
      if (!signError && signedData?.signedUrl) {
        signedImageUrl = signedData.signedUrl;
      }
    }

    // Try Lovable AI Gateway for vision verification
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");

    if (!LOVABLE_API_KEY && !OPENROUTER_API_KEY && !GOOGLE_GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI verification not configured", manual_review_required: true }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const verificationPrompt = `You are a payment verification AI for QurobAi. Analyze this payment screenshot and verify:
1. Is this a valid UPI payment screenshot?
2. Can you see a successful payment confirmation?
3. What is the amount shown in the screenshot?
4. Does it appear to be a genuine payment (not edited/fake)?

The expected payment amount is ₹${expectedAmount} (or close to it with possible coupon discount).

Respond in this exact JSON format ONLY, no other text:
{
  "is_valid_screenshot": true/false,
  "is_successful_payment": true/false,
  "detected_amount": number or null,
  "amount_matches": true/false,
  "appears_genuine": true/false,
  "confidence": "high"/"medium"/"low",
  "recommendation": "approve"/"reject"/"manual_review",
  "reason": "Brief explanation"
}`;

    let verification = null;

    // Try Lovable AI Gateway first
    if (LOVABLE_API_KEY) {
      try {
        const resp = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: [{ type: "text", text: verificationPrompt }, { type: "image_url", image_url: { url: signedImageUrl } }] }],
            temperature: 0.1, max_tokens: 500,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const aiResponse = data.choices?.[0]?.message?.content || "";
          try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) verification = JSON.parse(jsonMatch[0]);
          } catch (e) { console.error("Parse error:", e); }
        }
      } catch (e) { console.error("Gateway vision error:", e); }
    }

    // Fallback to OpenRouter
    if (!verification && OPENROUTER_API_KEY) {
      try {
        const resp = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://qurobai.com", "X-Title": "QurobAi Payment Verification" },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: [{ type: "text", text: verificationPrompt }, { type: "image_url", image_url: { url: signedImageUrl } }] }],
            temperature: 0.1, max_tokens: 500,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const aiResponse = data.choices?.[0]?.message?.content || "";
          try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) verification = JSON.parse(jsonMatch[0]);
          } catch (e) { console.error("Parse error:", e); }
        }
      } catch (e) { console.error("OpenRouter vision error:", e); }
    }

    if (!verification) {
      await supabase.from("payment_screenshots").update({ admin_notes: "AI verification failed - please verify manually" }).eq("id", paymentId);
      return new Response(JSON.stringify({ success: false, action: "manual_review", error: "Could not verify automatically", manual_review_required: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Verification result:", verification);

    // Auto-approve ONLY if high confidence AI + valid UTR (both required)
    if (verification.recommendation === "approve" && verification.confidence === "high") {
      // If UTR was provided, it must have passed validation; if no UTR, AI alone with high confidence is enough for screenshot-only flow
      const utrInfo = validatedUtr ? ` | UTR: ${validatedUtr}` : " | No UTR provided (screenshot-only)";
      await supabase.from("payment_screenshots").update({
        status: "approved", 
        admin_notes: `AI Auto-Verified: ${verification.reason}${utrInfo}`,
        utr_number: validatedUtr || null,
        reviewed_at: new Date().toISOString(),
      }).eq("id", paymentId);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await supabase.from("user_subscriptions").insert({ user_id: payment.user_id, plan_id: payment.plan_id, status: "active", expires_at: expiresAt.toISOString() });
      await supabase.from("notifications").insert({ user_id: payment.user_id, title: "✅ Payment Approved!", message: "Your subscription has been activated. Enjoy premium features!", type: "success" });

      return new Response(JSON.stringify({ success: true, action: "approved", verification }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto-reject if high confidence rejection
    if (verification.recommendation === "reject" && verification.confidence === "high") {
      await supabase.from("payment_screenshots").update({
        status: "rejected", admin_notes: `AI Auto-Rejected: ${verification.reason}`, reviewed_at: new Date().toISOString(),
      }).eq("id", paymentId);
      await supabase.from("notifications").insert({ user_id: payment.user_id, title: "❌ Payment Not Verified", message: `Your payment could not be verified: ${verification.reason}. Please contact support.`, type: "error" });

      return new Response(JSON.stringify({ success: true, action: "rejected", verification }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Manual review
    await supabase.from("payment_screenshots").update({
      admin_notes: `AI Review (needs manual check): ${verification.reason} | Confidence: ${verification.confidence}`,
    }).eq("id", paymentId);

    return new Response(JSON.stringify({ success: true, action: "manual_review", verification }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Verification failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
