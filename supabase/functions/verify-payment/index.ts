import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper for retries with timeout
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = 2, 
  timeout = 15000
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      
      // If 503, retry after small delay
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
      return new Response(
        JSON.stringify({ error: "Payment ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying payment:", paymentId);

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
      console.error("Payment not found:", paymentError);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get screenshot URL and generate signed URL for private bucket
    const screenshotUrl = payment.screenshot_url;
    const expectedAmount = payment.subscription_plans?.price_inr || payment.amount_paid;

    console.log("Original screenshot URL:", screenshotUrl);
    console.log("Expected amount:", expectedAmount);

    // Extract the storage path from the URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/payment-screenshots/userId/timestamp.jpg
    let storagePath = "";
    if (screenshotUrl.includes("/payment-screenshots/")) {
      const parts = screenshotUrl.split("/payment-screenshots/");
      storagePath = parts[1] || "";
    }

    // Generate signed URL for private bucket access (valid for 10 minutes)
    let signedImageUrl = screenshotUrl;
    if (storagePath) {
      const { data: signedData, error: signError } = await supabase
        .storage
        .from("payment-screenshots")
        .createSignedUrl(storagePath, 600); // 10 minutes

      if (!signError && signedData?.signedUrl) {
        signedImageUrl = signedData.signedUrl;
        console.log("Generated signed URL for verification");
      } else {
        console.error("Failed to generate signed URL:", signError);
      }
    }

    // Try multiple vision APIs
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    
    if (!OPENROUTER_API_KEY && !GOOGLE_GEMINI_API_KEY) {
      console.error("No vision API configured");
      return new Response(
        JSON.stringify({ 
          error: "AI verification not configured",
          manual_review_required: true 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    let upstreamError503 = false;

    // Try OpenRouter first with Gemini Flash (good and cheap vision model)
    if (OPENROUTER_API_KEY) {
      console.log("Trying OpenRouter with Gemini Flash...");
      try {
        const visionResponse = await fetchWithRetry(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://qurobai.com",
              "X-Title": "QurobAi Payment Verification"
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-001",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: verificationPrompt },
                    { type: "image_url", image_url: { url: signedImageUrl } }
                  ]
                }
              ],
              temperature: 0.1,
              max_tokens: 500,
            }),
          }
        );

        if (visionResponse.status === 503) {
          upstreamError503 = true;
          console.error("OpenRouter returned 503 - service temporarily unavailable");
        } else if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const aiResponse = visionData.choices?.[0]?.message?.content || "";
          console.log("OpenRouter AI Response:", aiResponse);

          // Parse AI response
          try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              verification = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            console.error("Failed to parse OpenRouter response:", e);
          }
        } else {
          const errorText = await visionResponse.text();
          console.error("OpenRouter error:", visionResponse.status, errorText);
        }
      } catch (e) {
        console.error("OpenRouter exception:", e);
      }
    }

    // Fallback to Google Gemini directly if OpenRouter failed
    if (!verification && GOOGLE_GEMINI_API_KEY && !upstreamError503) {
      console.log("Trying Google Gemini directly...");
      try {
        // Fetch the image using signed URL and convert to base64
        const imageResponse = await fetchWithRetry(signedImageUrl, {}, 1, 10000);
        
        if (imageResponse.status === 503) {
          upstreamError503 = true;
        } else if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          const base64Image = btoa(
            new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
          );
          const mimeType = imageBlob.type || "image/jpeg";

          const geminiResponse = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: verificationPrompt },
                    { inline_data: { mime_type: mimeType, data: base64Image } }
                  ]
                }],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 500,
                }
              }),
            }
          );

          if (geminiResponse.status === 503) {
            upstreamError503 = true;
          } else if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            console.log("Gemini AI Response:", aiResponse);

            try {
              const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                verification = JSON.parse(jsonMatch[0]);
              }
            } catch (e) {
              console.error("Failed to parse Gemini response:", e);
            }
          } else {
            const errorText = await geminiResponse.text();
            console.error("Gemini error:", geminiResponse.status, errorText);
          }
        }
      } catch (e) {
        console.error("Gemini exception:", e);
      }
    }

    // Handle 503 upstream errors gracefully
    if (upstreamError503) {
      console.log("Upstream service returned 503 - temporarily unavailable");
      await supabase
        .from("payment_screenshots")
        .update({
          admin_notes: "AI verification temporarily unavailable (503) - please retry later or verify manually",
        })
        .eq("id", paymentId);

      return new Response(
        JSON.stringify({ 
          error: "Verification temporarily unavailable",
          retryable: true,
          manual_review_required: true
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no verification result, require manual review
    if (!verification) {
      console.log("All vision APIs failed, requiring manual review");
      await supabase
        .from("payment_screenshots")
        .update({
          admin_notes: "AI verification failed - please verify manually",
        })
        .eq("id", paymentId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          action: "manual_review",
          error: "Could not verify automatically",
          manual_review_required: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verification result:", verification);

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

    // Manual review required for medium/low confidence
    await supabase
      .from("payment_screenshots")
      .update({
        admin_notes: `AI Review (needs manual check): ${verification.reason} | Confidence: ${verification.confidence}`,
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