import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Retry helper with timeout
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  timeoutMs = 30000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // If upstream returns 5xx, retry
      if (response.status >= 500 && attempt < retries) {
        console.log(`Attempt ${attempt + 1} failed with ${response.status}, retrying...`);
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} error:`, error);
      
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error("All retries failed");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  console.log("API Chat request received");

  try {
    // Get API key from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid auth header");
      return new Response(
        JSON.stringify({ error: "Missing or invalid API key", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    if (!apiKey.startsWith("qai_")) {
      console.log("Invalid API key format");
      return new Response(
        JSON.stringify({ error: "Invalid API key format. API keys must start with 'qai_'", code: "INVALID_KEY" }),
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

    console.log("Validating API key...");

    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", hashHex)
      .eq("is_active", true)
      .single();

    if (keyError || !keyData) {
      console.log("API key validation failed:", keyError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key", code: "INVALID_KEY" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("API key validated for user:", keyData.user_id);

    // Check trial expiry
    if (keyData.is_trial && keyData.trial_expires_at) {
      if (new Date(keyData.trial_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ 
            error: "Trial expired. Please upgrade to continue.", 
            code: "TRIAL_EXPIRED",
            upgrade_url: "https://qurobai.lovable.app/subscribe"
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Rate limiting for trial users (1000 requests/day)
    if (keyData.is_trial && keyData.requests_today >= 1000) {
      return new Response(
        JSON.stringify({ 
          error: "Daily limit reached (1000 requests). Upgrade for unlimited requests.", 
          code: "RATE_LIMITED",
          upgrade_url: "https://qurobai.lovable.app/subscribe"
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", code: "INVALID_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Messages array is required", 
          code: "INVALID_REQUEST",
          example: { messages: [{ role: "user", content: "Hello!" }] }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which model to use
    const modelName = keyData.model === "qurob-4" ? "Qurob 4" : "Qurob 2";
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const DEEPINFRA_API_KEY = Deno.env.get("DEEPINFRA_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    console.log(`Using model: ${modelName}`);

    let aiResponse = "";

    const systemPrompt = `You are ${modelName}, QurobAi's AI assistant created by Soham from India. 
You're being accessed via the QurobAi API. Be helpful, concise, and professional.
You are ${modelName}. Always respond in a helpful and friendly manner.`;

    // Try multiple providers with fallbacks
    let success = false;

    // For Qurob 4, try DeepInfra first (more reliable), then OpenRouter
    if (keyData.model === "qurob-4") {
      // Try DeepInfra first
      if (DEEPINFRA_API_KEY && !success) {
        try {
          console.log("Trying DeepInfra...");
          const response = await fetchWithRetry(
            "https://api.deepinfra.com/v1/openai/chat/completions",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${DEEPINFRA_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
                messages: [
                  { role: "system", content: systemPrompt },
                  ...messages
                ],
                temperature: 0.7,
                max_tokens: 2048,
              }),
            },
            2,
            30000
          );

          if (response.ok) {
            const data = await response.json();
            aiResponse = data.choices?.[0]?.message?.content || "";
            if (aiResponse) {
              success = true;
              console.log("DeepInfra success");
            }
          } else {
            console.log("DeepInfra failed:", response.status);
          }
        } catch (e) {
          console.error("DeepInfra error:", e);
        }
      }

      // Fallback to OpenRouter
      if (OPENROUTER_API_KEY && !success) {
        try {
          console.log("Trying OpenRouter...");
          const response = await fetchWithRetry(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://qurobai.lovable.app",
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
            },
            2,
            30000
          );

          if (response.ok) {
            const data = await response.json();
            aiResponse = data.choices?.[0]?.message?.content || "";
            if (aiResponse) {
              success = true;
              console.log("OpenRouter success");
            }
          } else {
            console.log("OpenRouter failed:", response.status);
          }
        } catch (e) {
          console.error("OpenRouter error:", e);
        }
      }
    }

    // For Qurob 2 or as final fallback, use Gemini
    if (!success && GOOGLE_GEMINI_API_KEY) {
      try {
        console.log("Trying Google Gemini...");
        const geminiMessages = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const response = await fetchWithRetry(
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
          },
          2,
          30000
        );

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiResponse) {
            success = true;
            console.log("Gemini success");
          }
        } else {
          const errorText = await response.text();
          console.log("Gemini failed:", response.status, errorText);
        }
      } catch (e) {
        console.error("Gemini error:", e);
      }
    }

    if (!aiResponse) {
      console.log("All AI providers failed");
      return new Response(
        JSON.stringify({ 
          error: "AI service temporarily unavailable. Please try again in a few seconds.", 
          code: "SERVICE_UNAVAILABLE",
          retryable: true
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update usage stats
    console.log("Updating usage stats...");
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

    console.log("Request completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: aiResponse,
        model: keyData.model,
        usage: {
          tokens_used: Math.ceil(aiResponse.length / 4),
          requests_today: keyData.requests_today + 1,
          requests_remaining: keyData.is_trial ? 1000 - (keyData.requests_today + 1) : "unlimited"
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
