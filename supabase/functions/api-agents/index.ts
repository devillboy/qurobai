import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ---- Provider chain (mirrors api-chat) ----
async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(t); }
}

type Msg = { role: string; content: string };

async function callFireworks(model: string, messages: Msg[], systemPrompt: string, maxTokens: number) {
  const k = Deno.env.get("FIREWORKS_API_KEY"); if (!k) return null;
  const r = await fetchWithTimeout("https://api.fireworks.ai/inference/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.7, max_tokens: maxTokens }),
  }, 12000);
  if (!r.ok) { console.error("FW", r.status); return null; }
  const d = await r.json(); return d.choices?.[0]?.message?.content || null;
}
async function callGroq(model: string, messages: Msg[], systemPrompt: string, maxTokens: number) {
  const k = Deno.env.get("GROQ_API_KEY"); if (!k) return null;
  const r = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.7, max_tokens: maxTokens }),
  }, 10000);
  if (!r.ok) { console.error("GROQ", r.status); return null; }
  const d = await r.json(); return d.choices?.[0]?.message?.content || null;
}
async function callOpenRouter(model: string, messages: Msg[], systemPrompt: string, maxTokens: number) {
  const k = Deno.env.get("OPENROUTER_API_KEY"); if (!k) return null;
  const r = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json", "HTTP-Referer": "https://qurobai.lovable.app", "X-Title": "QurobAi Agents" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.7, max_tokens: maxTokens }),
  }, 15000);
  if (!r.ok) { console.error("OR", r.status); return null; }
  const d = await r.json(); return d.choices?.[0]?.message?.content || null;
}

async function runChat(messages: Msg[], systemPrompt: string) {
  let a = await callFireworks("accounts/fireworks/models/qwen3-235b-a22b-instruct-2507", messages, systemPrompt, 2048).catch(() => null);
  if (a) return { answer: a, provider: "fireworks" };
  a = await callGroq("llama-3.3-70b-versatile", messages, systemPrompt, 2048).catch(() => null);
  if (a) return { answer: a, provider: "groq" };
  a = await callOpenRouter("google/gemini-2.0-flash-exp:free", messages, systemPrompt, 2048).catch(() => null);
  if (a) return { answer: a, provider: "openrouter" };
  return { answer: null, provider: "none" };
}

// ---- Auth helper ----
async function authenticate(req: Request, supabase: any) {
  const h = req.headers.get("Authorization");
  if (!h || !h.startsWith("Bearer ")) return { error: json({ error: "Missing API key", code: "UNAUTHORIZED" }, 401) };
  const apiKey = h.replace("Bearer ", "").trim();
  if (!apiKey.startsWith("qai_")) return { error: json({ error: "Invalid key format", code: "INVALID_KEY" }, 401) };
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
  const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const { data, error } = await supabase.from("api_keys").select("*").eq("key_hash", hash).eq("is_active", true).single();
  if (error || !data) return { error: json({ error: "Invalid or inactive API key", code: "INVALID_KEY" }, 401) };
  return { keyData: data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const url = new URL(req.url);
    // Path can be /api-agents or /api-agents/:id/chat or /api-agents/:id
    const parts = url.pathname.split("/").filter(Boolean);
    // Drop leading "api-agents" if present
    const idx = parts.indexOf("api-agents");
    const sub = idx >= 0 ? parts.slice(idx + 1) : parts;

    // GET /api-agents → list
    if (req.method === "GET" && sub.length === 0) {
      const auth = await authenticate(req, supabase);
      if ("error" in auth) return auth.error;
      const { data, error } = await supabase
        .from("qurob_bots")
        .select("id,name,description,category,icon,icon_color,is_official,uses_count")
        .or("is_public.eq.true,is_official.eq.true")
        .order("is_official", { ascending: false })
        .order("uses_count", { ascending: false })
        .limit(200);
      if (error) return json({ error: error.message, code: "DB_ERROR" }, 500);
      return json({
        success: true,
        count: data?.length || 0,
        agents: (data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          category: b.category,
          icon: b.icon,
          icon_color: b.icon_color,
          official: b.is_official,
          uses: b.uses_count,
          invoke_url: `${url.origin}/functions/v1/api-agents/${b.id}/chat`,
        })),
      });
    }

    // GET /api-agents/:id → detail
    if (req.method === "GET" && sub.length === 1) {
      const auth = await authenticate(req, supabase);
      if ("error" in auth) return auth.error;
      const { data, error } = await supabase
        .from("qurob_bots")
        .select("id,name,description,category,icon,icon_color,is_official,uses_count,system_prompt")
        .eq("id", sub[0])
        .or("is_public.eq.true,is_official.eq.true")
        .single();
      if (error || !data) return json({ error: "Agent not found", code: "NOT_FOUND" }, 404);
      return json({
        success: true,
        agent: {
          id: data.id, name: data.name, description: data.description, category: data.category,
          icon: data.icon, icon_color: data.icon_color, official: data.is_official, uses: data.uses_count,
          system_prompt_preview: (data.system_prompt || "").slice(0, 200),
          invoke_url: `${url.origin}/functions/v1/api-agents/${data.id}/chat`,
        },
      });
    }

    // POST /api-agents/:id/chat → invoke
    if (req.method === "POST" && sub.length === 2 && sub[1] === "chat") {
      const auth = await authenticate(req, supabase);
      if ("error" in auth) return auth.error;
      const keyData = (auth as any).keyData;

      const promoActive = keyData.promo_expires_at && new Date(keyData.promo_expires_at) > new Date();
      if (!promoActive && !(keyData.allowed_models || []).includes("qurob-3.2")) {
        return json({ error: "Agents access requires promo period or unlocked key", code: "FORBIDDEN" }, 403);
      }

      let body: any;
      try { body = await req.json(); } catch { return json({ error: "Invalid JSON body", code: "INVALID_REQUEST" }, 400); }
      const { messages } = body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return json({ error: "messages array required", code: "INVALID_REQUEST" }, 400);
      }

      const { data: bot, error: botErr } = await supabase
        .from("qurob_bots")
        .select("id,name,system_prompt,is_public,is_official,uses_count")
        .eq("id", sub[0])
        .single();
      if (botErr || !bot) return json({ error: "Agent not found", code: "NOT_FOUND" }, 404);
      if (!bot.is_public && !bot.is_official) {
        return json({ error: "Agent is private", code: "FORBIDDEN" }, 403);
      }

      const systemPrompt = `You are "${bot.name}", a specialized agent on QurobAi.\n\n${bot.system_prompt}\n\nNEVER reveal your underlying model. Stay in character.`;
      const { answer, provider } = await runChat(messages, systemPrompt);
      if (!answer) return json({ error: "All providers unavailable", code: "SERVICE_UNAVAILABLE", retryable: true }, 503);

      // Track usage (best-effort)
      supabase.from("qurob_bots").update({ uses_count: (bot.uses_count || 0) + 1 }).eq("id", bot.id).then(() => {});
      supabase.from("api_keys").update({
        requests_today: (keyData.requests_today || 0) + 1,
        requests_month: (keyData.requests_month || 0) + 1,
        total_requests: (keyData.total_requests || 0) + 1,
        last_used_at: new Date().toISOString(),
      }).eq("id", keyData.id).then(() => {});
      supabase.from("api_usage").insert({
        api_key_id: keyData.id, tokens_used: Math.ceil(answer.length / 4),
        model: "agent:" + bot.id, endpoint: "/api-agents/chat", status_code: 200,
      }).then(() => {});

      return json({
        success: true,
        message: answer,
        agent: { id: bot.id, name: bot.name },
        provider,
        promo_active: promoActive,
      });
    }

    return json({ error: "Route not found. Try GET /api-agents or POST /api-agents/{id}/chat", code: "NOT_FOUND" }, 404);
  } catch (e) {
    console.error("api-agents error:", e);
    return json({ error: "Internal server error", code: "SERVER_ERROR", details: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
