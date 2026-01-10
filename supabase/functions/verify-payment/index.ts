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
    const { paymentId } = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Payment ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payment_screenshots")
      .select(`*, subscription_plans(name, price_inr)`)
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the screenshot URL
    const screenshotUrl = payment.screenshot_url;
    const expectedAmount = payment.subscription_plans?.price_inr || payment.amount_paid;

    // Use OpenRouter with vision model to verify payment
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "AI verification not configured",
          manual_review_required: true 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying payment screenshot:", screenshotUrl);
    console.log("Expected amount:", expectedAmount);

    const verificationPrompt = `You are a payment verification AI for QurobAi. Analyze this payment screenshot and verify:

1. Is this a valid UPI payment screenshot?
2. Can you see a successful payment confirmation?
3. What is the amount shown in the screenshot?
4. Does it appear to be a genuine payment (not edited/fake)?

The expected payment amount is ₹${expectedAmount} (or close to it with possible coupon discount).

Respond in this exact JSON format:
{
  "is_valid_screenshot": true/false,
  "is_successful_payment": true/false,
  "detected_amount": number or null,
  "amount_matches": true/false,
  "appears_genuine": true/false,
  "confidence": "high"/"medium"/"low",
  "recommendation": "approve"/"reject"/"manual_review",
  "reason": "Brief explanation"
}

Only respond with the JSON, no other text.`;

    const visionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://qurobai.com",
        "X-Title": "QurobAi Payment Verification"
      },
      body: JSON.stringify({
        model: "qwen/qwen-2-vl-72b-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: verificationPrompt },
              { type: "image_url", image_url: { url: screenshotUrl } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!visionResponse.ok) {
      console.error("Vision API error:", await visionResponse.text());
      return new Response(
        JSON.stringify({ 
          error: "AI verification failed",
          manual_review_required: true 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const visionData = await visionResponse.json();
    const aiResponse = visionData.choices?.[0]?.message?.content || "";

    console.log("AI Response:", aiResponse);

    // Parse AI response
    let verification;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verification = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return new Response(
        JSON.stringify({ 
          error: "Could not parse AI verification",
          manual_review_required: true,
          ai_response: aiResponse
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-approve if high confidence and recommendation is approve
    if (verification.recommendation === "approve" && verification.confidence === "high") {
      // Update payment status
      await supabase
        .from("payment_screenshots")
        .update({
          status: "approved",
          admin_notes: `AI Auto-Verified: ${verification.reason}`,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      // Create subscription
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from("user_subscriptions")
        .insert({
          user_id: payment.user_id,
          plan_id: payment.plan_id,
          status: "active",
          expires_at: expiresAt.toISOString(),
        });

      // Notify user
      await supabase
        .from("notifications")
        .insert({
          user_id: payment.user_id,
          title: "✅ Payment Approved!",
          message: "Your subscription has been activated. Enjoy premium features!",
          type: "success",
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: "approved",
          verification 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-reject if high confidence rejection
    if (verification.recommendation === "reject" && verification.confidence === "high") {
      await supabase
        .from("payment_screenshots")
        .update({
          status: "rejected",
          admin_notes: `AI Auto-Rejected: ${verification.reason}`,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      // Notify user
      await supabase
        .from("notifications")
        .insert({
          user_id: payment.user_id,
          title: "❌ Payment Not Verified",
          message: `Your payment could not be verified: ${verification.reason}. Please contact support.`,
          type: "error",
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: "rejected",
          verification 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Manual review required
    await supabase
      .from("payment_screenshots")
      .update({
        admin_notes: `AI Review (needs manual check): ${verification.reason}`,
      })
      .eq("id", paymentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: "manual_review",
        verification 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
