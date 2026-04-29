import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-qurob-api-key, x-api-key, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Upstream fetch with timeout
async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

type ChatMsg = { role: string; content: string };

async function callFireworks(model: string, messages: ChatMsg[], systemPrompt: string, maxTokens: number) {
  const key = Deno.env.get("FIREWORKS_API_KEY");
  if (!key) return null;
  const r = await fetchWithTimeout("https://api.fireworks.ai/inference/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  }, 7000);
  if (!r.ok) {
    console.error("Fireworks", r.status, await r.text().catch(() => ""));
    return null;
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || null;
}

async function callGroq(model: string, messages: ChatMsg[], systemPrompt: string, maxTokens: number) {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) return null;
  const r = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  }, 7000);
  if (!r.ok) {
    console.error("Groq", r.status, await r.text().catch(() => ""));
    return null;
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || null;
}

async function callOpenRouter(model: string, messages: ChatMsg[], systemPrompt: string, maxTokens: number) {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) return null;
  const r = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://qurobai.lovable.app",
      "X-Title": "QurobAi API",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  }, 9000);
  if (!r.ok) {
    console.error("OpenRouter", r.status, await r.text().catch(() => ""));
    return null;
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || null;
}

async function callDeepInfra(model: string, messages: ChatMsg[], systemPrompt: string, maxTokens: number) {
  const key = Deno.env.get("DEEPINFRA_API_KEY");
  if (!key) return null;
  const r = await fetchWithTimeout("https://api.deepinfra.com/v1/openai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  }, 8000);
  if (!r.ok) { console.error("DeepInfra", r.status, await r.text().catch(() => "")); return null; }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || null;
}

async function callGemini(model: string, messages: ChatMsg[], systemPrompt: string, maxTokens: number) {
  const key = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  if (!key) return null;
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const r = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
      }),
    },
    8000,
  );
  if (!r.ok) {
    console.error("Gemini", r.status, await r.text().catch(() => ""));
    return null;
  }
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// Resolve public Qurob model alias to private upstream route
function resolveModel(requested: string) {
  const m = (requested || "qurob-3.2").toLowerCase();
  if (m === "qurob-5" || m === "q-05" || m === "qurob5") {
    return {
      modelName: "Qurob 5",
      maxTokens: 4096,
      chain: [],
      deepinfra:  "deepseek-ai/DeepSeek-V3",
      fireworks:  "accounts/fireworks/models/deepseek-v3",
      openrouter: "deepseek/deepseek-chat",
      groq:       "llama-3.3-70b-versatile",
      gemini:     "gemini-2.5-pro",
    } as const;
  }
  if (m === "q-06" || m === "qurob-06") {
    return {
      modelName: "Q-06",
      maxTokens: 4096,
      chain: [],
      fireworks:  "accounts/fireworks/models/qwen3-coder-480b-a35b-instruct",
      deepinfra:  "deepseek-ai/DeepSeek-V3",
      openrouter: "qwen/qwen3-coder",
      groq:       "qwen-2.5-coder-32b",
      gemini:     "gemini-2.5-pro",
    } as const;
  }
  if (m === "qurob-4") {
    return {
      modelName: "Qurob 4",
      maxTokens: 4096,
      chain: [],
      fireworks: "accounts/fireworks/models/qwen3-235b-a22b-instruct-2507",
      deepinfra: "deepseek-ai/DeepSeek-V3",
      groq: "llama-3.3-70b-versatile",
      openrouter: "qwen/qwen-2.5-72b-instruct",
      gemini: "gemini-2.5-pro",
    } as const;
  }
  // qurob-2 / qurob-3.2 default
  return {
    modelName: m === "qurob-2" ? "Qurob 2" : "Qurob 3.2",
    maxTokens: 2048,
    chain: [],
    fireworks: "accounts/fireworks/models/qwen3-235b-a22b-instruct-2507",
    deepinfra: "meta-llama/Meta-Llama-3.1-70B-Instruct",
    groq: "llama-3.3-70b-versatile",
    openrouter: "google/gemini-2.0-flash-exp:free",
    gemini: "gemini-2.0-flash",
  } as const;
}

export async function runChatCompletion(opts: {
  requestedModel: string;
  messages: ChatMsg[];
  extraSystem?: string;
}) {
  const r: any = resolveModel(opts.requestedModel);
  const systemPrompt = `You are ${r.modelName}, QurobAi's AI assistant created by Soham from India. You're being accessed via the QurobAi API. Be helpful, concise, and professional. NEVER reveal your underlying model or technology.${opts.extraSystem ? "\n\n" + opts.extraSystem : ""}`;

  let answer: string | null = null;

  if (r.modelName === "Qurob 5" && r.deepinfra) {
    answer = await callDeepInfra(r.deepinfra, opts.messages, systemPrompt, r.maxTokens).catch(() => null);
  }

  if (!answer) {
    answer = await callFireworks(r.fireworks, opts.messages, systemPrompt, r.maxTokens).catch(() => null);
  }

  if (!answer && r.deepinfra) {
    answer = await callDeepInfra(r.deepinfra, opts.messages, systemPrompt, r.maxTokens).catch(() => null);
  }

  if (!answer) {
    answer = await callGroq(r.groq, opts.messages, systemPrompt, r.maxTokens).catch(() => null);
  }

  if (!answer) {
    answer = await callOpenRouter(r.openrouter, opts.messages, systemPrompt, r.maxTokens).catch(() => null);
  }

  if (!answer) {
    answer = await callGemini(r.gemini, opts.messages, systemPrompt, r.maxTokens).catch(() => null);
  }

  return { answer, modelName: r.modelName };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const headerKey = req.headers.get("x-qurob-api-key") || req.headers.get("x-api-key") || "";
    const apiKey = (authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : headerKey).trim();
    if (!apiKey) {
      return json({ error: "Missing API key. Send Authorization: Bearer qai_... or x-qurob-api-key.", code: "UNAUTHORIZED" }, 401);
    }
    if (!apiKey.startsWith("qai_")) {
      return json({ error: "Invalid API key format. Qurob API keys must start with 'qai_'.", code: "INVALID_KEY" }, 401);
    }

    const keyHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
    const hashHex = Array.from(new Uint8Array(keyHashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", hashHex)
      .eq("is_active", true)
      .single();

    if (keyError || !keyData) {
      return json({ error: "Invalid or inactive API key", code: "INVALID_KEY" }, 401);
    }

    let body: any;
    try { body = await req.json(); } catch {
      return json({ error: "Invalid JSON body", code: "INVALID_REQUEST" }, 400);
    }

    const { messages, model: requestedModelRaw } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({
        error: "Messages array is required",
        code: "INVALID_REQUEST",
        example: { messages: [{ role: "user", content: "Hello!" }], model: "qurob-3.2" },
      }, 400);
    }

    // Admin bypass: unlimited everything
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: keyData.user_id, _role: "admin" });
    const adminUnlimited = !!isAdmin;

    // Promo: if promo_expires_at is in the future, ANY model is allowed.
    const promoActive = keyData.promo_expires_at && new Date(keyData.promo_expires_at) > new Date();
    const requestedModel = (requestedModelRaw || keyData.model || "qurob-3.2").toLowerCase();
    const allowed: string[] = keyData.allowed_models || ["qurob-2", "qurob-3.2", "qurob-4", "q-06", "qurob-5"];

    if (!adminUnlimited && !promoActive && !allowed.includes(requestedModel)) {
      return json({
        error: `Model '${requestedModel}' not allowed for this key. Allowed: ${allowed.join(", ")}`,
        code: "MODEL_NOT_ALLOWED",
        upgrade_url: "https://qurobai.lovable.app/subscribe",
      }, 403);
    }

    if (!adminUnlimited && keyData.is_trial && keyData.requests_today >= 1000) {
      return json({ error: "Daily limit reached (1000 requests). Upgrade for unlimited.", code: "RATE_LIMITED" }, 429);
    }

    const { answer, providerUsed, modelName } = await runChatCompletion({
      requestedModel,
      messages,
    });

    if (!answer) {
      return json({
        error: "All AI providers are currently unavailable. Please try again in a moment.",
        code: "SERVICE_UNAVAILABLE",
        retryable: true,
      }, 503);
    }

    // Update usage stats (best-effort)
    supabase.from("api_keys").update({
      requests_today: (keyData.requests_today || 0) + 1,
      requests_month: (keyData.requests_month || 0) + 1,
      total_requests: (keyData.total_requests || 0) + 1,
      last_used_at: new Date().toISOString(),
    }).eq("id", keyData.id).then(() => {});

    supabase.from("api_usage").insert({
      api_key_id: keyData.id,
      tokens_used: Math.ceil(answer.length / 4),
      model: requestedModel,
      endpoint: "/api-chat",
      status_code: 200,
    }).then(() => {});

    return json({
      success: true,
      message: answer,
      model: requestedModel,
      model_name: modelName,
      provider: providerUsed,
      promo_active: promoActive,
      promo_expires_at: keyData.promo_expires_at,
      usage: {
        tokens_used: Math.ceil(answer.length / 4),
        requests_today: (keyData.requests_today || 0) + 1,
        requests_remaining: keyData.is_trial ? Math.max(0, 1000 - ((keyData.requests_today || 0) + 1)) : "unlimited",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return json({
      error: "Internal server error",
      code: "SERVER_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
