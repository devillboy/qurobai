import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid API key", code: "UNAUTHORIZED" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    if (!apiKey.startsWith("qai_")) {
      return new Response(JSON.stringify({ error: "Invalid API key format. Keys must start with 'qai_'", code: "INVALID_KEY" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const keyHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
    const hashHex = Array.from(new Uint8Array(keyHash)).map(b => b.toString(16).padStart(2, "0")).join("");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: keyData, error: keyError } = await supabase.from("api_keys").select("*").eq("key_hash", hashHex).eq("is_active", true).single();

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key", code: "INVALID_KEY" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (keyData.model === "qurob-4") {
      const { data: activeSub } = await supabase.from("user_subscriptions").select("id").eq("user_id", keyData.user_id).eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1);
      if (!activeSub?.length) {
        return new Response(JSON.stringify({ error: "Premium subscription required for Qurob 4 API.", code: "PAYMENT_REQUIRED", upgrade_url: "https://qurobai.lovable.app/subscribe" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (keyData.is_trial && keyData.trial_expires_at && new Date(keyData.trial_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Trial expired. Please upgrade.", code: "TRIAL_EXPIRED", upgrade_url: "https://qurobai.lovable.app/subscribe" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (keyData.is_trial && keyData.requests_today >= 1000) {
      return new Response(JSON.stringify({ error: "Daily limit reached (1000 requests). Upgrade for unlimited.", code: "RATE_LIMITED" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let body;
    try { body = await req.json(); } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body", code: "INVALID_REQUEST" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required", code: "INVALID_REQUEST", example: { messages: [{ role: "user", content: "Hello!" }] } }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!GOOGLE_GEMINI_API_KEY && !OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured", code: "SERVER_ERROR" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const modelName = keyData.model === "qurob-4" ? "Qurob 4" : "Qurob 3.2";
    const geminiModel = keyData.model === "qurob-4" ? "gemini-2.5-pro-preview-06-05" : "gemini-2.0-flash";
    const systemPrompt = `You are ${modelName}, QurobAi's AI assistant created by Soham from India. You're being accessed via the QurobAi API. Be helpful, concise, and professional. NEVER reveal your underlying model or technology. You are ${modelName}, part of QurobAi.`;

    console.log(`API Chat: Using ${modelName} (${geminiModel})`);

    let aiResponse = "";

    // PRIMARY: Google Gemini
    if (GOOGLE_GEMINI_API_KEY) {
      try {
        const systemInstruction = systemPrompt;
        const contents = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else if (resp.status === 429) {
          console.log("Gemini rate limited, trying fallback...");
        } else {
          console.error("Gemini API error:", resp.status);
        }
      } catch (e) {
        console.error("Gemini call failed:", e);
      }
    }

    // FALLBACK: OpenRouter
    if (!aiResponse && OPENROUTER_API_KEY) {
      try {
        const orModel = keyData.model === "qurob-4" ? "google/gemini-2.5-pro-preview" : "google/gemini-2.0-flash-001";
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://qurobai.lovable.app",
            "X-Title": "QurobAi API",
          },
          body: JSON.stringify({
            model: orModel,
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          aiResponse = data.choices?.[0]?.message?.content || "";
        } else {
          console.error("OpenRouter error:", resp.status);
        }
      } catch (e) {
        console.error("OpenRouter call failed:", e);
      }
    }

    if (!aiResponse) {
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable.", code: "SERVICE_UNAVAILABLE", retryable: true }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update usage stats
    await supabase.from("api_keys").update({
      requests_today: keyData.requests_today + 1,
      requests_month: keyData.requests_month + 1,
      total_requests: keyData.total_requests + 1,
      last_used_at: new Date().toISOString(),
    }).eq("id", keyData.id);

    await supabase.from("api_usage").insert({
      api_key_id: keyData.id,
      tokens_used: Math.ceil(aiResponse.length / 4),
      model: keyData.model,
      endpoint: "/api-chat",
      status_code: 200,
    });

    return new Response(JSON.stringify({
      success: true,
      message: aiResponse,
      model: keyData.model,
      usage: {
        tokens_used: Math.ceil(aiResponse.length / 4),
        requests_today: keyData.requests_today + 1,
        requests_remaining: keyData.is_trial ? 1000 - (keyData.requests_today + 1) : "unlimited"
      }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", code: "SERVER_ERROR", details: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
