import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TONE_STYLES: Record<string, string> = {
  default: "balanced and adaptable",
  professional: "polished, precise, and formal",
  friendly: "warm, approachable, and conversational",
  candid: "direct, honest, and encouraging",
  quirky: "playful, creative, and imaginative",
  efficient: "extremely concise. Minimize words, maximize information density",
  nerdy: "exploratory, enthusiastic, and deep-diving into technical details",
  cynical: "critical, analytical, and slightly sarcastic while still being helpful",
};

const QUROBAI_KNOWLEDGE = `
## QUROBAI - COMPLETE KNOWLEDGE BASE

### ABOUT QUROBAI
QurobAi is India's premier AI assistant platform developed by **Soham from India**. It provides intelligent conversation capabilities with real-time data access, professional-grade responses, and specialized AI models.
Creator: Soham (sohamghosh679@gmail.com)
Country: India

### AI MODELS
- **Qurob 2 (Free):** Fast, reliable AI for general use
- **Qurob 4 (₹289/month):** Deep reasoning, complex analysis, professional work
- **Q-06 (₹320/month):** Expert coding AI for 100+ languages

### FEATURES
- Real-time: Weather, Crypto, Stocks, News, Cricket, Currency
- Web Search & Deep Search
- Image Generation & Vision AI
- Custom Qurobs (like ChatGPT GPTs)
- Voice Input
- Code Playground

### PRICING
| Plan | Price | Model |
|------|-------|-------|
| Free | ₹0 | Qurob 2 |
| Premium | ₹289/month | Qurob 4 |
| Code Specialist | ₹320/month | Q-06 |

### PAYMENT
Pay via UPI to 7864084241@ybl, upload screenshot, admin approves within 24h.

### CONTACT
Email: sohamghosh679@gmail.com
`;

// Detect query type for real-time data
function detectQueryType(message: string): { type: string; query?: string } | null {
  const lower = message.toLowerCase();
  
  // Deep Search
  if (/^\[deep\s*search\]/i.test(message)) {
    const q = message.replace(/^\[deep\s*search\]\s*/i, "").trim();
    return { type: "deepsearch", query: q };
  }
  
  // Web Search
  if (/^\[web\s*search\]/i.test(message) || /search\s+(?:the\s+)?(?:web|internet|online)\s+(?:for\s+)?/i.test(lower)) {
    const q = message.replace(/^\[web\s*search\]\s*/i, "").replace(/search\s+(?:the\s+)?(?:web|internet|online)\s+(?:for\s+)?/i, "").trim();
    return { type: "websearch", query: q || message };
  }
  
  // Image generation
  const imagePatterns = [
    /generate\s+(?:an?\s+)?image/i, /create\s+(?:an?\s+)?(?:image|picture|art)/i,
    /draw\s+(?:an?\s+)?(?:me\s+)?/i, /make\s+(?:an?\s+)?(?:image|picture)/i,
    /imagine\s+/i, /banao\s+(?:ek\s+)?(?:image|tasveer|photo)/i,
    /(?:image|tasveer|photo)\s+banao/i, /can\s+you\s+(?:make|create|generate|draw)\s+(?:an?\s+)?(?:image|picture)/i,
  ];
  if (imagePatterns.some(p => p.test(lower))) {
    let prompt = message.replace(/(?:please\s+)?(?:can\s+you\s+)?(?:generate|create|draw|make|imagine|banao)\s+(?:an?\s+)?(?:me\s+)?(?:ek\s+)?(?:image|picture|art|tasveer|photo)?\s*(?:of|about|for|ka|ki)?\s*/gi, "").trim();
    return { type: "image_generation", query: prompt || message };
  }
  
  // Cricket
  if (/cricket|ipl|match\s+score|live\s+score|ind\s+vs|t20|odi|bcci|icc/i.test(lower)) {
    return { type: "cricket" };
  }
  
  // Currency
  if (/(?:usd|eur|gbp|inr|jpy|rupee|dollar|euro|pound)\s+(?:to|vs|rate|exchange|convert)/i.test(lower) || /forex|currency\s+(?:rate|exchange)/i.test(lower)) {
    return { type: "currency", query: "usd,inr" };
  }
  
  // Weather
  if (/weather|temperature|forecast|rain|sunny|cloudy/i.test(lower)) {
    const cityMatch = lower.match(/weather\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i) || lower.match(/([a-zA-Z\s]+)\s+(?:weather|temperature)/i);
    return { type: "weather", query: cityMatch?.[1]?.trim() || "Delhi" };
  }
  
  // Crypto
  if (/bitcoin|ethereum|crypto|btc|eth|doge|solana|xrp/i.test(lower)) {
    const coins = [];
    if (/bitcoin|btc/i.test(lower)) coins.push("bitcoin");
    if (/ethereum|eth/i.test(lower)) coins.push("ethereum");
    if (/doge/i.test(lower)) coins.push("dogecoin");
    if (/solana/i.test(lower)) coins.push("solana");
    if (/xrp/i.test(lower)) coins.push("ripple");
    return { type: "crypto", query: coins.length ? coins.join(",") : "bitcoin,ethereum" };
  }
  
  // Stocks
  if (/stock|share|nasdaq|nifty|sensex|aapl|tesla|google|microsoft|nvidia/i.test(lower)) {
    const symbols = [];
    if (/apple|aapl/i.test(lower)) symbols.push("AAPL");
    if (/tesla|tsla/i.test(lower)) symbols.push("TSLA");
    if (/google|googl/i.test(lower)) symbols.push("GOOGL");
    if (/microsoft|msft/i.test(lower)) symbols.push("MSFT");
    if (/nvidia|nvda/i.test(lower)) symbols.push("NVDA");
    return { type: "stocks", query: symbols.length ? symbols.join(",") : "AAPL,TSLA,GOOGL,NVDA" };
  }
  
  // News
  if (/news|headline|latest|breaking|current events/i.test(lower)) {
    const topicMatch = lower.match(/(?:news|headlines?)\s+(?:about|on|for)\s+([a-zA-Z\s]+)/i);
    return { type: "news", query: topicMatch?.[1]?.trim() || "world" };
  }
  
  // Time
  if (/what\s+(?:time|date)|current\s+(?:time|date)|today.?s\s+date/i.test(lower)) {
    return { type: "time" };
  }
  
  return null;
}

// Serper.dev web search (primary)
async function serperSearch(query: string): Promise<string> {
  const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
  if (!SERPER_API_KEY) return "";
  
  try {
    const resp = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 8 }),
    });
    if (!resp.ok) return "";
    const data = await resp.json();
    
    let result = "";
    if (data.answerBox) {
      result += `**Answer:** ${data.answerBox.answer || data.answerBox.snippet || ""}\n\n`;
    }
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      result += `**${kg.title}** ${kg.type ? `(${kg.type})` : ""}\n${kg.description || ""}\n\n`;
    }
    if (data.organic?.length) {
      result += "**Search Results:**\n";
      for (const r of data.organic.slice(0, 6)) {
        result += `• **${r.title}** — ${r.snippet || ""}\n  ${r.link}\n`;
      }
    }
    return result;
  } catch (e) {
    console.error("Serper error:", e);
    return "";
  }
}

// Fallback web search
async function fallbackWebSearch(query: string): Promise<string> {
  const results: string[] = [];
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const resp = await fetch(rssUrl, { headers: { "User-Agent": "QurobAi/3.0" } });
    const rssText = await resp.text();
    const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const title = match[1].match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
      const source = match[1].match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";
      if (title) results.push(`• **${title}** ${source ? `(${source})` : ""}`);
      if (results.length >= 6) break;
    }
  } catch (e) { console.log("Fallback search error:", e); }
  
  if (results.length) {
    return `**Search Results for "${query}":**\n\n${results.join("\n")}`;
  }
  return `No results found for "${query}".`;
}

async function performWebSearch(query: string): Promise<string> {
  let result = await serperSearch(query);
  if (!result) result = await fallbackWebSearch(query);
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return `🔍 **Web Search: "${query}"**\n\n${result}\n\n*Updated: ${timestamp} IST*`;
}

async function performDeepSearch(query: string): Promise<string> {
  const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
  let allResults = "";
  
  // Multiple search angles
  const searches = [query, `${query} latest 2025 2026`, `${query} analysis`];
  
  for (const q of searches) {
    if (SERPER_API_KEY) {
      const r = await serperSearch(q);
      if (r) allResults += r + "\n\n";
    } else {
      const r = await fallbackWebSearch(q);
      if (r) allResults += r + "\n\n";
    }
  }
  
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return `🔬 **Deep Search: "${query}"**\n\n${allResults}\n*Deep analysis from multiple sources | ${timestamp} IST*`;
}

function getWeatherDescription(code: number): string {
  const d: Record<number, string> = {
    0: "☀️ Clear sky", 1: "🌤️ Mainly clear", 2: "⛅ Partly cloudy", 3: "☁️ Overcast",
    45: "🌫️ Fog", 51: "🌧️ Light drizzle", 61: "🌧️ Slight rain", 63: "🌧️ Moderate rain",
    65: "🌧️ Heavy rain", 71: "❄️ Slight snow", 80: "🌦️ Rain showers", 95: "⛈️ Thunderstorm",
  };
  return d[code] || "Unknown conditions";
}

async function fetchRealtimeData(type: string, query?: string): Promise<string | null> {
  try {
    if (type === "websearch" && query) return await performWebSearch(query);
    if (type === "deepsearch" && query) return await performDeepSearch(query);
    
    if (type === "time") {
      return `**🕐 Current Time:** ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })} (IST)`;
    }
    
    if (type === "weather" && query) {
      const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers: { "User-Agent": "QurobAi/3.0" } });
      const geoData = await geoResp.json();
      if (geoData[0]) {
        const { lat, lon, display_name } = geoData[0];
        const wResp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);
        const w = await wResp.json();
        const c = w.current;
        return `**🌤️ Weather in ${query}**\n\n${getWeatherDescription(c?.weather_code)}\n🌡️ **Temperature:** ${c?.temperature_2m}°C\n💧 **Humidity:** ${c?.relative_humidity_2m}%\n💨 **Wind:** ${c?.wind_speed_10m} km/h\n\n*${display_name?.split(",").slice(0,2).join(",")}*`;
      }
      return `Could not find weather for "${query}".`;
    }
    
    if (type === "crypto") {
      const coins = query || "bitcoin,ethereum";
      const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd,inr&include_24hr_change=true`);
      if (!resp.ok) return "Crypto data temporarily unavailable.";
      const data = await resp.json();
      let result = "**📊 Crypto Prices:**\n\n";
      for (const [coin, d] of Object.entries(data)) {
        const info = d as any;
        const arrow = (info.usd_24h_change || 0) >= 0 ? "📈" : "📉";
        result += `**${coin.charAt(0).toUpperCase() + coin.slice(1)}:** $${info.usd?.toLocaleString()} / ₹${info.inr?.toLocaleString()} ${arrow} ${(info.usd_24h_change || 0).toFixed(2)}%\n`;
      }
      return result;
    }
    
    if (type === "stocks" && query) {
      const resp = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!resp.ok) return "Stock data temporarily unavailable.";
      const data = await resp.json();
      const results = data.quoteResponse?.result || [];
      if (results.length) {
        let output = "**📈 Stock Prices:**\n\n";
        for (const s of results) {
          output += `**${s.symbol}** (${s.shortName}): $${s.regularMarketPrice?.toFixed(2)} ${(s.regularMarketChangePercent || 0) >= 0 ? "📈" : "📉"} ${s.regularMarketChangePercent?.toFixed(2)}%\n`;
        }
        return output;
      }
      return "No stock data found.";
    }
    
    if (type === "news") {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query || "India")}&hl=en-IN&gl=IN&ceid=IN:en`;
      const resp = await fetch(rssUrl);
      const rssText = await resp.text();
      const items: string[] = [];
      const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const match of itemMatches) {
        const title = match[1].match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
        if (title) items.push(`• **${title}**`);
        if (items.length >= 6) break;
      }
      return items.length ? `**📰 News: "${query}"**\n\n${items.join("\n")}` : `No news found for "${query}".`;
    }
    
    if (type === "cricket") {
      const resp = await fetch(`https://news.google.com/rss/search?q=cricket+live+score+today&hl=en-IN&gl=IN&ceid=IN:en`, { headers: { "User-Agent": "QurobAi/3.0" } });
      const rssText = await resp.text();
      const items: string[] = [];
      const matches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const m of matches) {
        const title = m[1].match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
        if (title && /score|runs|wicket|over|match|vs/i.test(title)) items.push(`🏏 **${title}**`);
        if (items.length >= 5) break;
      }
      return items.length ? `**🏏 Cricket Updates:**\n\n${items.join("\n\n")}` : "No live cricket matches right now.";
    }
    
    if (type === "currency") {
      try {
        const resp = await fetch("https://api.frankfurter.app/latest?from=USD");
        if (resp.ok) {
          const data = await resp.json();
          let result = "**💱 Exchange Rates (USD):**\n\n";
          for (const curr of ["INR", "EUR", "GBP", "JPY", "AUD", "CAD"]) {
            if (data.rates[curr]) result += `**USD → ${curr}:** ${data.rates[curr].toFixed(4)}\n`;
          }
          return result;
        }
      } catch (e) { console.log("Currency error:", e); }
      return "Currency rates temporarily unavailable.";
    }
    
    return null;
  } catch (error) {
    console.error("Data fetch error:", error);
    return null;
  }
}

function isQurobAiQuery(message: string): boolean {
  return /qurob|who\s+(?:made|created|built)\s+you|what\s+(?:are|is)\s+you|about\s+(?:this|your)|your\s+(?:name|creator)|subscription|pricing|plan|premium|q-06|payment|upi|soham/i.test(message.toLowerCase());
}

function extractImageData(messages: any[]): { hasImage: boolean; imageUrl: string | null; cleanMessages: any[] } {
  const cleanMessages: any[] = [];
  let hasImage = false;
  let imageUrl: string | null = null;
  
  for (const msg of messages) {
    if (msg.role === "user" && msg.content) {
      const imageMatch = msg.content.match(/\[ImageData:(data:image\/[^;]+;base64,[^\]]+)\]/);
      if (imageMatch) {
        hasImage = true;
        imageUrl = imageMatch[1];
        const cleanContent = msg.content.replace(/\[ImageData:data:image\/[^;]+;base64,[^\]]+\]/g, "").trim();
        cleanMessages.push({ ...msg, content: cleanContent || "What's in this image? Describe it in detail." });
      } else {
        cleanMessages.push(msg);
      }
    } else {
      cleanMessages.push(msg);
    }
  }
  
  return { hasImage, imageUrl, cleanMessages };
}

function summarizeConversation(messages: any[]): any[] {
  if (messages.length <= 10) return messages;
  const firstMessages = messages.slice(0, 2);
  const middleMessages = messages.slice(2, -8);
  const recentMessages = messages.slice(-8);
  const summaryPoints: string[] = [];
  for (const msg of middleMessages) {
    if (msg.role === "user" && msg.content.length > 20) {
      summaryPoints.push(msg.content.slice(0, 100).replace(/\n/g, " "));
    }
  }
  return [...firstMessages, { role: "system", content: `[Earlier: User discussed ${summaryPoints.slice(0, 5).join("; ")}...]` }, ...recentMessages];
}

async function generateImage(prompt: string, supabase: any, userId?: string): Promise<string> {
  const FIREWORKS_API_KEY = Deno.env.get("FIREWORKS_API_KEY");
  if (!FIREWORKS_API_KEY) return "Image generation is not configured. Please contact admin.";
  
  try {
    const resp = await fetch("https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image", {
      method: "POST",
      headers: { "Authorization": `Bearer ${FIREWORKS_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, width: 1024, height: 1024, steps: 4, seed: Math.floor(Math.random() * 1000000) }),
    });

    if (resp.ok) {
      const imageBlob = await resp.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      let imageUrlResult = `data:image/png;base64,${btoa(new Uint8Array(imageBuffer).reduce((d, b) => d + String.fromCharCode(b), ""))}`;
      
      if (userId) {
        try {
          const fileName = `${userId}/${Date.now()}-generated.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("chat-attachments")
            .upload(fileName, new Uint8Array(imageBuffer), { contentType: "image/png", upsert: false });
          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(uploadData.path);
            imageUrlResult = urlData.publicUrl;
          }
        } catch (e) { console.log("Storage upload error:", e); }
      }
      
      return `Here's the image I generated for "${prompt}":\n\n[GeneratedImage:${imageUrlResult}]\n\nLet me know if you'd like any changes!`;
    }
    
    if (resp.status === 429) return "Image generation is rate limited. Please wait and try again.";
    return "Sorry, I couldn't generate the image right now. Please try again.";
  } catch (e) {
    console.error("Image generation error:", e);
    return `Image generation failed: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
}

// Check URL and fetch metadata
async function checkUrl(url: string): Promise<string> {
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "QurobAi/3.0" }, redirect: "follow" });
    const html = await resp.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const desc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] || "";
    if (title || desc) return `\n**URL Info:** ${title}${desc ? ` — ${desc.slice(0, 200)}` : ""}`;
  } catch (e) { /* ignore */ }
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    console.log("QurobAi request:", messages.length, "messages, userId:", userId ? "yes" : "no");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FIREWORKS_API_KEY = Deno.env.get("FIREWORKS_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Model selection & user settings
    let modelName = "Qurob 2";
    let isCodeSpecialist = false;
    let baseTone = "professional";
    let customInstructions = "";
    let persona = "default";
    let gatewayModel = "google/gemini-3-flash-preview"; // Default: Qurob 2

    if (userId) {
      try {
        // Check token limits
        const { data: settings } = await supabase
          .from("user_settings")
          .select("base_tone, custom_instructions, persona, tokens_used_today, tokens_reset_date")
          .eq("user_id", userId)
          .single();

        if (settings) {
          baseTone = settings.base_tone || "professional";
          customInstructions = settings.custom_instructions || "";
          persona = settings.persona || "default";
          
          // Reset tokens if new day
          const today = new Date().toISOString().split("T")[0];
          if (settings.tokens_reset_date !== today) {
            await supabase.from("user_settings").update({ tokens_used_today: 0, tokens_reset_date: today }).eq("user_id", userId);
          } else {
            // Check if free user hit daily limit
            const { data: userModel } = await supabase.rpc("get_user_model", { user_id: userId });
            const isPremium = userModel === "Qurob 4" || userModel === "Q-06";
            const dailyLimit = isPremium ? 1000000 : 50;
            
            if ((settings.tokens_used_today || 0) >= dailyLimit) {
              return new Response(JSON.stringify({ 
                error: `Daily message limit reached (${dailyLimit}). ${isPremium ? "Please try again tomorrow." : "Upgrade to Premium for unlimited messages!"}`,
                code: "TOKEN_LIMIT",
                tokens_used: settings.tokens_used_today,
                tokens_limit: dailyLimit,
              }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          }
        }

        const { data: userModel } = await supabase.rpc("get_user_model", { user_id: userId });
        if (userModel === "Qurob 4") {
          modelName = "Qurob 4";
          gatewayModel = "google/gemini-2.5-pro";
        } else if (userModel === "Q-06") {
          modelName = "Q-06";
          isCodeSpecialist = true;
          gatewayModel = "google/gemini-2.5-pro";
        }

        // Load user memory
        const { data: memories } = await supabase.from("user_memory").select("memory_key, memory_value").eq("user_id", userId).limit(10);
        if (memories?.length) {
          customInstructions = `## USER PREFERENCES:\n${memories.map(m => `- ${m.memory_key}: ${m.memory_value}`).join("\n")}\n\n${customInstructions}`;
        }
        
        // Increment token count
        await supabase.from("user_settings").update({ tokens_used_today: (settings?.tokens_used_today || 0) + 1 }).eq("user_id", userId);
      } catch (e) {
        console.log("User settings error:", e);
      }
    }

    const toneStyle = TONE_STYLES[baseTone] || TONE_STYLES.professional;
    const { hasImage, imageUrl, cleanMessages } = extractImageData(messages);
    const processedMessages = summarizeConversation(cleanMessages);

    // Process last message for real-time data & URL checking
    const lastUserMessage = processedMessages.filter((m: any) => m.role === "user").pop();
    let realtimeContext = "";
    let includeKnowledge = false;
    
    if (lastUserMessage) {
      if (isQurobAiQuery(lastUserMessage.content)) includeKnowledge = true;
      
      // Check for URLs in message
      const urlMatch = lastUserMessage.content.match(/https?:\/\/[^\s\]]+/);
      if (urlMatch) {
        const urlInfo = await checkUrl(urlMatch[0]);
        if (urlInfo) realtimeContext += urlInfo;
      }
      
      const queryType = detectQueryType(lastUserMessage.content);
      if (queryType) {
        console.log("Detected query:", queryType.type, queryType.query);
        
        if (queryType.type === "image_generation" && FIREWORKS_API_KEY) {
          const imageResponse = await generateImage(queryType.query || "beautiful artwork", supabase, userId);
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: imageResponse } }] })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          });
          return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
        }
        
        const data = await fetchRealtimeData(queryType.type, queryType.query);
        if (data) realtimeContext += `\n\n## REAL-TIME DATA (Present this to user):\n${data}`;
      }
    }

    // Vision: use OpenRouter for image analysis
    if (hasImage && imageUrl && OPENROUTER_API_KEY) {
      console.log("Using Vision API");
      const visionMessages = processedMessages.map((m: any, i: number) => {
        if (m.role === "user" && i === processedMessages.length - 1) {
          return { role: "user", content: [{ type: "text", text: m.content || "What's in this image?" }, { type: "image_url", image_url: { url: imageUrl } }] };
        }
        return m;
      });

      const visionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://qurobai.lovable.app", "X-Title": "QurobAi" },
        body: JSON.stringify({
          model: "qwen/qwen-2-vl-72b-instruct",
          messages: [{ role: "system", content: `You are ${modelName}, QurobAi's AI created by Soham from India. You CAN see and analyze images.` }, ...visionMessages],
          stream: true, temperature: 0.7, max_tokens: 2048,
        }),
      });

      if (visionResponse.ok) {
        return new Response(visionResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      }
    }

    // Build system prompt
    const personaStyles: Record<string, string> = {
      default: "balanced, helpful, and adaptable",
      coder: "technical, precise, and code-focused",
      creative: "imaginative, artistic, and storytelling-focused",
      tutor: "patient, educational, and step-by-step",
      friend: "casual, conversational, and warm",
    };
    
    const currentDate = new Date();
    const indiaTime = currentDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const systemPrompt = `You are ${modelName}, an AI assistant created by **Soham from India** for the QurobAi platform.

## 📅 CURRENT: ${indiaTime} (IST)

## ⚠️ IDENTITY - ABSOLUTE
- You are **${modelName}**, created by **Soham from India**
- You are part of **QurobAi** - India's AI Assistant
- NEVER claim to be Gemini, ChatGPT, Claude, DeepSeek, LLaMA, or any other AI
- If asked: "I am ${modelName}, QurobAi's AI assistant created by Soham from India"

## CAPABILITIES
- See & analyze uploaded images
- Generate images ("generate an image of...")
- Real-time data: weather, crypto, stocks, news, cricket, currency
- Web Search & Deep Search
- Code playground with [Playground] tag

## PERSONALITY: ${personaStyles[persona] || personaStyles.default}
## TONE: ${toneStyle}

## FORMATTING
- Use \`\`\`language for code blocks
- Use \`\`\`[Playground]html for interactive HTML/CSS/JS
- Keep responses conversational and natural
- Match user's language (Hindi, English, Hinglish)
- Don't overuse emojis

${isCodeSpecialist ? `## Q-06 CODE SPECIALIST MODE
Expert coding AI. Provide clean, production-ready code with best practices. Support ALL languages. Always write complete, working code.` : ""}

${includeKnowledge ? `## QUROBAI KNOWLEDGE\n${QUROBAI_KNOWLEDGE}` : ""}
${customInstructions ? `## USER INSTRUCTIONS\n${customInstructions}` : ""}${realtimeContext}`;

    console.log("Using model:", modelName, "gateway:", gatewayModel);

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: gatewayModel,
        messages: [{ role: "system", content: systemPrompt }, ...processedMessages],
        stream: true,
        temperature: isCodeSpecialist ? 0.2 : 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted. Please contact admin." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Streaming response started");
    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (error) {
    console.error("QurobAi error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Something went wrong." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
