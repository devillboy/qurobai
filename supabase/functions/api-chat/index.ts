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
    // Get API key from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid API key", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    if (!apiKey.startsWith("qai_")) {
      return new Response(
        JSON.stringify({ error: "Invalid API key format", code: "INVALID_KEY" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the API key
    const keyHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(apiKey)
    );
    const hashArray = Array.from(new Uint8Array(keyHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Validate API key in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", hashHex)
      .eq("is_active", true)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key", code: "INVALID_KEY" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check trial expiry
    if (keyData.is_trial && keyData.trial_expires_at) {
      if (new Date(keyData.trial_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ 
            error: "Trial expired. Please upgrade to continue.", 
            code: "TRIAL_EXPIRED",
            upgrade_url: "https://qurobai.com/subscribe"
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Rate limiting for trial users
    if (keyData.is_trial && keyData.requests_today >= 1000) {
      return new Response(
        JSON.stringify({ 
          error: "Daily limit reached. Upgrade for unlimited requests.", 
          code: "RATE_LIMITED",
          upgrade_url: "https://qurobai.com/subscribe"
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required", code: "INVALID_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which model to use
    const modelName = keyData.model === "qurob-4" ? "Qurob 4" : "Qurob 2";
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    let aiResponse = "";

    const systemPrompt = `You are ${modelName}, QurobAi's AI assistant created by Soham from India. 
You're being accessed via the QurobAi API. Be helpful, concise, and professional.
Never reveal that you're based on any other AI model. You are ${modelName}, period.`;

    if (keyData.model === "qurob-4" && OPENROUTER_API_KEY) {
      // Use DeepSeek for Qurob 4
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://qurobai.com",
          "X-Title": "QurobAi API"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || "";
      }
    } else if (GOOGLE_GEMINI_API_KEY) {
      // Use Gemini for Qurob 2 (or fallback)
      const geminiMessages = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: `I understand. I am ${modelName}, QurobAi's AI assistant.` }] },
              ...geminiMessages
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    }

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable", code: "SERVICE_ERROR" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update usage stats
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("api_keys")
      .update({
        requests_today: keyData.requests_today + 1,
        requests_month: keyData.requests_month + 1,
        total_requests: keyData.total_requests + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", keyData.id);

    // Log usage
    await supabase
      .from("api_usage")
      .insert({
        api_key_id: keyData.id,
        tokens_used: Math.ceil(aiResponse.length / 4),
        model: keyData.model,
        endpoint: "/api-chat",
        status_code: 200,
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: aiResponse,
        model: keyData.model,
        usage: {
          tokens_used: Math.ceil(aiResponse.length / 4),
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", code: "SERVER_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});