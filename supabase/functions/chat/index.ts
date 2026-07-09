import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// Real-time activity events — emitted as SSE alongside content tokens.
// Frontend parses lines starting with `data: {"qurob_event":...}` to drive
// the live thinking indicator and source citations.
// ============================================================================
type QurobPhase =
  | "connecting"      // request received, planning
  | "searching"       // hitting web search providers
  | "reading_url"     // scraping a user-provided URL
  | "image_starting"  // about to call image renderer
  | "image_done"      // image bytes returned
  | "answering"       // tokens are flowing from the LLM
  | "done";

interface QurobEvent {
  qurob_event: QurobPhase;
  label?: string;
  query?: string;
  sources?: { title: string; url: string; favicon: string }[];
  url?: string;
  model?: string;
}

function encodeEvent(ev: QurobEvent): string {
  return `data: ${JSON.stringify(ev)}\n\n`;
}

function faviconFor(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
}

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
- **Qurob 3.2 (Free):** Powerful AI with 600B+ parameters, enhanced knowledge, privacy-focused
- **Qurob 4 (₹289/month):** Deep reasoning, complex analysis, professional work
- **Q-06 (₹320/month):** Expert coding AI for 100+ languages

### FEATURES
- Real-time: Weather, Crypto, Stocks, News, Cricket, Currency
- Web Search & Deep Search
- Image Generation & Vision AI
- Custom Qurobs (like ChatGPT GPTs)
- Voice Input & Output
- Code Playground
- API Access for developers
- Projects & conversation organization

### PRICING
| Plan | Price | Model |
|------|-------|-------|
| Free | ₹0 | Qurob 3.2 (50 msgs/day) |
| Premium | ₹289/month | Qurob 4 (unlimited) |
| Code Specialist | ₹320/month | Q-06 (unlimited) |

### PAYMENT
Pay via UPI to 9153109561@ybl, upload screenshot or provide UTR/Transaction ID for instant verification.

### CONTACT
Email: sohamghosh679@gmail.com

### VERSION HISTORY
- v3.2: Model selector, auto-payment verification, mobile admin panel
- v3.0: Major UI overhaul, Web Search, Deep Search, Qurobs, token system
- v2.5: Vision AI, Image Generation, Real-time data
- v2.0: Projects, API Access, Voice input
- v1.0: Initial release
`;

function detectQueryType(message: string): { type: string; query?: string } | null {
  const lower = message.toLowerCase();
  
  if (/^\[deep\s*search\]/i.test(message)) {
    return { type: "deepsearch", query: message.replace(/^\[deep\s*search\]\s*/i, "").trim() };
  }
  if (/^\[web\s*search\]/i.test(message) || /search\s+(?:the\s+)?(?:web|internet|online)\s+(?:for\s+)?/i.test(lower)) {
    const q = message.replace(/^\[web\s*search\]\s*/i, "").replace(/search\s+(?:the\s+)?(?:web|internet|online)\s+(?:for\s+)?/i, "").trim();
    return { type: "websearch", query: q || message };
  }
  
  const imagePatterns = [
    /generate\s+(?:an?\s+)?image/i, /create\s+(?:an?\s+)?(?:image|picture|art|photo)/i,
    /draw\s+(?:an?\s+)?(?:me\s+)?/i, /make\s+(?:an?\s+)?(?:image|picture|photo)/i,
    /imagine\s+/i, /banao\s+(?:ek\s+)?(?:image|tasveer|photo|picture)/i,
    /(?:image|tasveer|photo|picture)\s+banao/i, /can\s+you\s+(?:make|create|generate|draw)\s+(?:an?\s+)?(?:image|picture|photo)/i,
    /(?:ek|mujhe|meri|mere)\s+(?:image|tasveer|photo|picture)\s+(?:bana|de|do|banao|generate)/i,
    /(?:image|tasveer|photo|picture)\s+(?:bana|de|do|banao|generate|dikhao)/i,
    /(?:bana|banado|banaao)\s+(?:ek\s+)?(?:image|tasveer|photo|picture)/i,
    /(?:photo|image|picture|tasveer)\s+(?:chahiye|dikhao|dikha)/i,
    /(?:generate|create|make|draw)\s+(?:a\s+)?(?:pic|photo|picture|image)\s+(?:of|about)/i,
    /(?:give\s+me|show\s+me|i\s+want)\s+(?:an?\s+)?(?:image|picture|photo)/i,
    /(?:paint|sketch|illustrate)\s+/i,
    // Smart visual-creation hints
    /(?:design|make|create|generate)\s+(?:a\s+|an\s+|the\s+)?(?:logo|poster|banner|wallpaper|icon|avatar|thumbnail|cover|flyer|sticker|emoji|illustration|portrait|landscape|render|artwork|painting)/i,
    /(?:logo|poster|banner|wallpaper|icon|avatar|thumbnail|cover|flyer|sticker|illustration|artwork|painting)\s+(?:design|create|generate|banao|bana\s+do|de\s+do)/i,
    /(?:show\s+me|dikhao)\s+(?:a\s+|an\s+|ek\s+)?(?:visual|design|render|scene|3d|wallpaper)/i,
  ];
  if (imagePatterns.some(p => p.test(lower))) {
    let prompt = message.replace(/(?:please\s+)?(?:can\s+you\s+)?(?:mujhe\s+)?(?:ek\s+)?(?:generate|create|draw|make|imagine|banao|bana|banado|banaao|paint|sketch|illustrate|dikhao|dikha|chahiye)\s*(?:an?\s+)?(?:me\s+)?(?:ek\s+)?(?:image|picture|art|tasveer|photo|pic)?\s*(?:of|about|for|ka|ki|ke|mein)?\s*/gi, "").trim();
    return { type: "image_generation", query: prompt || message };
  }
  
  if (/cricket|ipl|match\s+score|live\s+score|ind\s+vs|t20|odi|bcci|icc/i.test(lower)) return { type: "cricket" };
  if (/(?:usd|eur|gbp|inr|jpy|rupee|dollar|euro|pound)\s+(?:to|vs|rate|exchange|convert)/i.test(lower) || /forex|currency\s+(?:rate|exchange)/i.test(lower)) return { type: "currency", query: "usd,inr" };
  if (/weather|temperature|forecast|rain|sunny|cloudy/i.test(lower)) {
    const cityMatch = lower.match(/weather\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i) || lower.match(/([a-zA-Z\s]+)\s+(?:weather|temperature)/i);
    return { type: "weather", query: cityMatch?.[1]?.trim() || "Delhi" };
  }
  if (/bitcoin|ethereum|crypto|btc|eth|doge|solana|xrp/i.test(lower)) {
    const coins = [];
    if (/bitcoin|btc/i.test(lower)) coins.push("bitcoin");
    if (/ethereum|eth/i.test(lower)) coins.push("ethereum");
    if (/doge/i.test(lower)) coins.push("dogecoin");
    if (/solana/i.test(lower)) coins.push("solana");
    if (/xrp/i.test(lower)) coins.push("ripple");
    return { type: "crypto", query: coins.length ? coins.join(",") : "bitcoin,ethereum" };
  }
  if (/stock|share|nasdaq|nifty|sensex|aapl|tesla|google|microsoft|nvidia/i.test(lower)) {
    const symbols = [];
    if (/apple|aapl/i.test(lower)) symbols.push("AAPL");
    if (/tesla|tsla/i.test(lower)) symbols.push("TSLA");
    if (/google|googl/i.test(lower)) symbols.push("GOOGL");
    if (/microsoft|msft/i.test(lower)) symbols.push("MSFT");
    if (/nvidia|nvda/i.test(lower)) symbols.push("NVDA");
    return { type: "stocks", query: symbols.length ? symbols.join(",") : "AAPL,TSLA,GOOGL,NVDA" };
  }
  if (/news|headline|latest|breaking|current events/i.test(lower)) {
    const topicMatch = lower.match(/(?:news|headlines?)\s+(?:about|on|for)\s+([a-zA-Z\s]+)/i);
    return { type: "news", query: topicMatch?.[1]?.trim() || "world" };
  }
  if (/what\s+(?:time|date)|current\s+(?:time|date)|today.?s\s+date/i.test(lower)) return { type: "time" };
  
  return null;
}

// Collected sources from the last search — surfaced to the client via SSE event.
let lastSearchSources: { title: string; url: string; favicon: string }[] = [];

// Firecrawl-powered web search (primary)
async function firecrawlSearch(query: string): Promise<string> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) return "";
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 8, scrapeOptions: { formats: ["markdown"] } }),
    });
    if (!resp.ok) { console.error("Firecrawl search error:", resp.status); return ""; }
    const data = await resp.json();
    if (!data.success || !data.data?.length) return "";
    let result = "**Search Results:**\n";
    for (const r of data.data.slice(0, 6)) {
      const snippet = r.markdown ? r.markdown.slice(0, 300).replace(/\n/g, " ").trim() : r.description || "";
      result += `• **${r.title || r.url}** — ${snippet}\n  ${r.url}\n`;
      if (r.url) lastSearchSources.push({ title: r.title || r.url, url: r.url, favicon: faviconFor(r.url) });
    }
    return result;
  } catch (e) { console.error("Firecrawl search error:", e); return ""; }
}

// Firecrawl URL scraper — get full content from a URL
async function firecrawlScrape(url: string): Promise<string> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) return "";
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "summary"], onlyMainContent: true }),
    });
    if (!resp.ok) return "";
    const data = await resp.json();
    const markdown = data.data?.markdown || "";
    const summary = data.data?.summary || "";
    const title = data.data?.metadata?.title || "";
    const desc = data.data?.metadata?.description || "";
    // Return truncated content for context
    const content = markdown.slice(0, 3000);
    return `**${title}**${desc ? ` — ${desc}` : ""}\n\n${summary ? `**Summary:** ${summary}\n\n` : ""}${content}`;
  } catch (e) { console.error("Firecrawl scrape error:", e); return ""; }
}

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
    if (data.answerBox) result += `**Answer:** ${data.answerBox.answer || data.answerBox.snippet || ""}\n\n`;
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      result += `**${kg.title}** ${kg.type ? `(${kg.type})` : ""}\n${kg.description || ""}\n\n`;
    }
    if (data.organic?.length) {
      result += "**Search Results:**\n";
      for (const r of data.organic.slice(0, 6)) {
        result += `• **${r.title}** — ${r.snippet || ""}\n  ${r.link}\n`;
        if (r.link) lastSearchSources.push({ title: r.title || r.link, url: r.link, favicon: faviconFor(r.link) });
      }
    }
    return result;
  } catch (e) { console.error("Serper error:", e); return ""; }
}

async function fallbackWebSearch(query: string): Promise<string> {
  const results: string[] = [];
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const resp = await fetch(rssUrl, { headers: { "User-Agent": "QurobAi/3.2" } });
    const rssText = await resp.text();
    const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const title = match[1].match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
      const source = match[1].match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";
      if (title) results.push(`• **${title}** ${source ? `(${source})` : ""}`);
      if (results.length >= 6) break;
    }
  } catch (e) { console.log("Fallback search error:", e); }
  return results.length ? `**Search Results for "${query}":**\n\n${results.join("\n")}` : `No results found for "${query}".`;
}

async function performWebSearch(query: string): Promise<string> {
  // Priority: Firecrawl → Serper → RSS fallback
  let result = await firecrawlSearch(query);
  if (!result) result = await serperSearch(query);
  if (!result) result = await fallbackWebSearch(query);
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return `🔍 **Web Search: "${query}"**\n\n${result}\n\n*Updated: ${timestamp} IST*`;
}

async function performDeepSearch(query: string): Promise<string> {
  let allResults = "";
  const searches = [query, `${query} latest 2025 2026`, `${query} analysis`];
  for (const q of searches) {
    // Try Firecrawl first, then Serper, then RSS
    let r = await firecrawlSearch(q);
    if (!r) r = await serperSearch(q);
    if (!r) r = await fallbackWebSearch(q);
    if (r) allResults += r + "\n\n";
  }
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return `🔬 **Deep Search: "${query}"**\n\n${allResults}\n*Deep analysis from multiple sources | ${timestamp} IST*`;
}

// Auto web search: silently searches when AI might lack knowledge
async function autoWebSearch(message: string): Promise<string> {
  const lower = message.toLowerCase();
  // Topics that likely need fresh/real-time info
  const needsSearch = /(?:latest|recent|current|today|2025|2026|new|update|release|launch|announce|who\s+(?:won|is\s+the)|what\s+happened|tell\s+me\s+about|explain|kya\s+hua|batao|kaun\s+hai|kab\s+hua)/i.test(lower);
  if (!needsSearch) return "";
  
  // Extract the core query
  let query = message
    .replace(/^\[.*?\]\s*/i, "")
    .replace(/\[ImageData:.*?\]/g, "")
    .replace(/\[Attachment:.*?\]\(.*?\)/g, "")
    .trim();
  if (query.length < 5 || query.length > 200) return "";
  
  // Silently search — user won't see this
  const result = await firecrawlSearch(query);
  if (!result) return await serperSearch(query);
  return result;
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
      const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers: { "User-Agent": "QurobAi/3.2" } });
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
      const resp = await fetch(`https://news.google.com/rss/search?q=cricket+live+score+today&hl=en-IN&gl=IN&ceid=IN:en`, { headers: { "User-Agent": "QurobAi/3.2" } });
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
      } else { cleanMessages.push(msg); }
    } else { cleanMessages.push(msg); }
  }
  return { hasImage, imageUrl, cleanMessages };
}

function summarizeConversation(messages: any[]): any[] {
  if (messages.length <= 12) return messages;
  const firstMessages = messages.slice(0, 2);
  const middleMessages = messages.slice(2, -12);
  const recentMessages = messages.slice(-12);
  const summaryPoints: string[] = [];
  for (const msg of middleMessages) {
    if (msg.role === "user" && msg.content.length > 20) {
      summaryPoints.push(msg.content.slice(0, 100).replace(/\n/g, " "));
    }
  }
  return [...firstMessages, { role: "system", content: `[Earlier: User discussed ${summaryPoints.slice(0, 5).join("; ")}...]` }, ...recentMessages];
}

function isSimpleFastReply(message: string): boolean {
  const clean = message.replace(/^\[(?:web|deep)\s*search\]\s*/i, "").trim();
  if (clean.length <= 90 && !/https?:\/\//i.test(clean) && !/(latest|current|today|news|search|compare|code|build|analyze|research|explain in detail)/i.test(clean)) return true;
  return /^(hi|hello|hey|yo|hii|kaise ho|kya haal|thanks?|ok|haan|na|yes|no|who are you|tum kaun ho)[\s!.?]*$/i.test(clean);
}

// Image generation — private QurobAi renderer
async function generateImage(prompt: string, supabase: any, userId?: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return "Sorry, image generation is currently unavailable. Please try again later.";

  const IMAGE_MODELS = ["google/gemini-3.1-flash-image", "google/gemini-2.5-flash-image"];

  for (const model of IMAGE_MODELS) {
    try {
      console.log("QurobAi ArticQuro rendering via", model);
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!resp.ok) {
        const errTxt = await resp.text().catch(() => "");
        console.error("ArticQuro model error:", model, resp.status, errTxt.slice(0, 200));
        if (resp.status === 429) continue;
        if (resp.status === 402) return "Image credits exhausted. Please try again later.";
        continue;
      }
      const data = await resp.json();
      const dataUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!dataUrl) { console.error("ArticQuro: no image in response", JSON.stringify(data).slice(0, 200)); continue; }

      let finalUrl = dataUrl;
      // Upload to storage for a stable public URL when possible
      if (userId && dataUrl.startsWith("data:image/")) {
        try {
          const [, mime, b64] = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/) || [];
          if (b64) {
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const ext = mime.split("/")[1] || "png";
            const fileName = `${userId}/${Date.now()}-generated.${ext}`;
            const { data: up, error: upErr } = await supabase.storage.from("chat-attachments").upload(fileName, bytes, { contentType: mime, upsert: false });
            if (!upErr && up) {
              const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(up.path);
              finalUrl = urlData.publicUrl;
            }
          }
        } catch (e) { console.log("Storage upload error:", e); }
      }
      return `Here's your image for "${prompt}":\n\n[GeneratedImage:${finalUrl}]\n\n✨ *Generated by QurobAi ArticQuro*\nWant changes? Just describe them!`;
    } catch (e) {
      console.error("ArticQuro request threw:", e);
    }
  }
  return "Image generation is temporarily unavailable. Please try again in a few seconds.";
}

async function checkUrl(url: string): Promise<string> {
  // Try Firecrawl scrape first for rich content
  const scraped = await firecrawlScrape(url);
  if (scraped) return `\n\n## URL CONTENT (User shared this link — analyze and respond based on this content):\n${scraped}`;
  
  // Fallback: basic fetch
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "QurobAi/3.2" }, redirect: "follow" });
    const html = await resp.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const desc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] || "";
    if (title || desc) return `\n**URL Info:** ${title}${desc ? ` — ${desc.slice(0, 200)}` : ""}`;
  } catch (e) { /* ignore */ }
  return "";
}

// Private internal routing for public QurobAi model names
const MODEL_MAP: Record<string, string> = {
  "Qurob 2":   "google/gemini-2.5-flash-lite",
  "Qurob 3.2": "google/gemini-3.1-flash-lite",
  "Qurob 4":   "google/gemini-3.5-flash",
  "Q-06":      "openai/gpt-5.4-mini",
  "Qurob 5":   "openai/gpt-5.5",
  "ArticQuro": "image",
};

// Per-tier fallback models (Lovable AI Gateway only — no third-party providers)
const FALLBACK_MODEL: Record<string, string> = {
  "Q-06":      "google/gemini-3.5-flash",
  "Qurob 5":   "google/gemini-3.1-pro-preview",
  "Qurob 4":   "google/gemini-3-flash-preview",
  "Qurob 3.2": "google/gemini-3-flash-preview",
  "Qurob 2":   "google/gemini-2.5-flash-lite",
};

// Models eligible for OpenAI priority serving (fast mode)
const PRIORITY_MODELS = new Set(["openai/gpt-5.4-mini", "openai/gpt-5.5", "openai/gpt-5", "openai/gpt-5-mini", "openai/gpt-5.4"]);

// Per-model temperature tuning
const MODEL_TEMPERATURE: Record<string, number> = {
  "Qurob 2": 0.6,      // Legacy: balanced, slightly creative
  "Qurob 3.2": 0.55,   // Free: precise but natural
  "Qurob 4": 0.4,      // Pro: focused reasoning, less randomness
  "Q-06": 0.15,         // Code: very precise, minimal creativity
  "Qurob 5": 0.3,      // Ultimate Agent: focused, deep reasoning
  "ArticQuro": 0.35,   // Image prompts: crisp visual direction
};

/**
 * Wrap an upstream SSE body so we can prepend our own phase events
 * (and optionally append a `done` event). The upstream stream is forwarded
 * verbatim — we only inject extra `data: {"qurob_event":...}` lines.
 */
function wrapStreamWithEvents(
  upstream: ReadableStream<Uint8Array>,
  prelude: QurobEvent[],
  finalEvent?: QurobEvent,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const reader = upstream.getReader();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const ev of prelude) controller.enqueue(encoder.encode(encodeEvent(ev)));
    },
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          if (finalEvent) controller.enqueue(encoder.encode(encodeEvent(finalEvent)));
          controller.enqueue(encoder.encode(encodeEvent({ qurob_event: "done" })));
          controller.close();
          return;
        }
        if (value) controller.enqueue(value);
      } catch (e) {
        controller.error(e);
      }
    },
    cancel() { try { reader.cancel(); } catch { /* noop */ } },
  });
}

function streamSingleMessage(content: string, prelude: QurobEvent[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const ev of prelude) controller.enqueue(encoder.encode(encodeEvent(ev)));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
      controller.enqueue(encoder.encode(encodeEvent({ qurob_event: "done" })));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, model: requestedModel, conversationId, memoryEnabled: memoryEnabledOverride } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Reset per-request collected sources
    lastSearchSources = [];
    const phaseEvents: QurobEvent[] = [
      { qurob_event: "connecting", model: requestedModel || "Qurob 3.2" },
    ];
    
    console.log("QurobAi request:", messages.length, "messages, userId:", userId ? "yes" : "no", "requestedModel:", requestedModel);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!LOVABLE_API_KEY && !GOOGLE_GEMINI_API_KEY && !OPENROUTER_API_KEY) {
      console.error("No AI API keys configured");
      return new Response(JSON.stringify({ error: "AI service not configured." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let modelName = requestedModel || "Qurob 3.2";
    let isCodeSpecialist = false;
    let baseTone = "professional";
    let customInstructions = "";
    let persona = "default";

    let userQurobId = "";
    let brainMemoryActive = false; // resolved from global setting + per-chat override
    let adminUnlimited = false;
    if (userId) {
      try {
        // Admin bypass: unlimited everything, skip all token / model gating
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        adminUnlimited = !!isAdmin;

        // Fetch user's Qurob ID
        const { data: profileData } = await supabase
          .from("profiles")
          .select("qurob_id")
          .eq("user_id", userId)
          .single();
        if (profileData?.qurob_id) userQurobId = profileData.qurob_id;

        const { data: settings } = await supabase
          .from("user_settings")
          .select("base_tone, custom_instructions, persona, tokens_used_today, tokens_reset_date, brain_memory_enabled")
          .eq("user_id", userId)
          .single();

        if (settings) {
          baseTone = settings.base_tone || "professional";
          customInstructions = settings.custom_instructions || "";
          persona = settings.persona || "default";
          // Resolve brain memory: explicit per-chat override > per-conversation field > global
          brainMemoryActive = settings.brain_memory_enabled !== false; // default true
          if (typeof memoryEnabledOverride === "boolean") {
            brainMemoryActive = memoryEnabledOverride;
          } else if (conversationId) {
            const { data: conv } = await supabase
              .from("conversations")
              .select("memory_enabled")
              .eq("id", conversationId)
              .single();
            if (conv && typeof conv.memory_enabled === "boolean") brainMemoryActive = conv.memory_enabled;
          }
          
          const today = new Date().toISOString().split("T")[0];
          if (settings.tokens_reset_date !== today) {
            await supabase.from("user_settings").update({ tokens_used_today: 0, tokens_reset_date: today }).eq("user_id", userId);
          } else if (!adminUnlimited) {
            const { data: userModel } = await supabase.rpc("get_user_model", { user_id: userId });
            const isPremium = userModel === "Qurob 4" || userModel === "Q-06" || userModel === "Qurob 5";
            // Free: 350k tokens/month ≈ ~11,667/day; Paid: 1M/day
            const dailyLimit = isPremium ? 1000000 : 11667;
            if ((settings.tokens_used_today || 0) >= dailyLimit) {
              return new Response(JSON.stringify({ 
                error: `Daily message limit reached (${dailyLimit}). ${isPremium ? "Please try again tomorrow." : "Upgrade to Premium for unlimited messages!"}`,
                code: "TOKEN_LIMIT", tokens_used: settings.tokens_used_today, tokens_limit: dailyLimit,
              }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          }
        }

        // If no model was explicitly requested, use subscription-based model
        if (!requestedModel) {
          const { data: userModel } = await supabase.rpc("get_user_model", { user_id: userId });
          if (userModel === "Qurob 5") modelName = "Qurob 5";
          else if (userModel === "Qurob 4") modelName = "Qurob 4";
          else if (userModel === "Q-06") { modelName = "Q-06"; isCodeSpecialist = true; }
          else modelName = "Qurob 3.2";
        } else {
          // Per-model gating: validate requested model against specific subscription
          // Admin (adminUnlimited) bypasses all gating.
          if (!adminUnlimited && (requestedModel === "Qurob 4" || requestedModel === "Q-06" || requestedModel === "Qurob 5")) {
            const { data: userModel } = await supabase.rpc("get_user_model", { user_id: userId });
            // User must have the exact model subscription to use it
            if (userModel !== requestedModel) {
              return new Response(JSON.stringify({ 
                error: `You need a ${requestedModel} subscription to use this model. Please upgrade.`,
                code: "PAYMENT_REQUIRED",
              }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          }
          if (requestedModel === "Q-06") isCodeSpecialist = true;
        }

        // Only inject long-term user memory when Brain Memory is ON
        if (brainMemoryActive) {
          const { data: memories } = await supabase.from("user_memory").select("memory_key, memory_value").eq("user_id", userId).limit(25);
          if (memories?.length) {
            customInstructions = `## USER PREFERENCES (Brain Memory ON — remember these across conversations):\n${memories.map(m => `- ${m.memory_key}: ${m.memory_value}`).join("\n")}\n\n${customInstructions}`;
          }
        }
        
        await supabase.from("user_settings").update({ tokens_used_today: (settings?.tokens_used_today || 0) + 1 }).eq("user_id", userId);
      } catch (e) { console.log("User settings error:", e); }
    }

    const toneStyle = TONE_STYLES[baseTone] || TONE_STYLES.professional;
    const { hasImage, imageUrl, cleanMessages } = extractImageData(messages);
    const processedMessages = summarizeConversation(cleanMessages);

    const lastUserMessage = processedMessages.filter((m: any) => m.role === "user").pop();
    let realtimeContext = "";
    let includeKnowledge = false;
    
    if (lastUserMessage) {
      if (isQurobAiQuery(lastUserMessage.content)) includeKnowledge = true;
      const urlMatch = lastUserMessage.content.match(/https?:\/\/[^\s\]]+/);
      if (urlMatch) {
        phaseEvents.push({ qurob_event: "reading_url", label: "Reading link", url: urlMatch[0] });
        const urlInfo = await checkUrl(urlMatch[0]);
        if (urlInfo) realtimeContext += urlInfo;
      }

      if (modelName === "ArticQuro") {
        const prompt = lastUserMessage.content.replace(/^(?:generate|create|make|draw)\s+(?:an?\s+)?(?:image|picture|art|photo)\s*(?:of|about)?\s*/i, "").trim();
        phaseEvents.push({ qurob_event: "image_starting", label: "Generating image", query: prompt });
        const imageResponse = await generateImage(prompt || lastUserMessage.content || "premium artwork", supabase, userId);
        const stream = streamSingleMessage(imageResponse, [
          ...phaseEvents,
          { qurob_event: "image_done" },
          { qurob_event: "answering" },
        ]);
        return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      }
      
      const queryType = detectQueryType(lastUserMessage.content);
      if (queryType) {
        console.log("Detected query:", queryType.type, queryType.query);
        
        if (queryType.type === "image_generation") {
          // Auto-route: user mentioned image — silently switch to image renderer
          phaseEvents.push({ qurob_event: "image_starting", label: "Generating image", query: queryType.query });
          const imageResponse = await generateImage(queryType.query || "beautiful artwork", supabase, userId);
          const stream = streamSingleMessage(imageResponse, [
            ...phaseEvents,
            { qurob_event: "image_done" },
            { qurob_event: "answering" },
          ]);
          return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
        }
        
        if (queryType.type === "websearch" || queryType.type === "deepsearch") {
          phaseEvents.push({ qurob_event: "searching", label: queryType.type === "deepsearch" ? "Deep searching" : "Web search", query: queryType.query });
        }
        const data = await fetchRealtimeData(queryType.type, queryType.query);
        if (data) realtimeContext += `\n\n## REAL-TIME DATA (Present this to user):\n${data}`;
        if ((queryType.type === "websearch" || queryType.type === "deepsearch") && lastSearchSources.length) {
          phaseEvents.push({ qurob_event: "searching", sources: lastSearchSources.slice(0, 6) });
        }
      } else {
        // No explicit query type detected — try auto web search silently
        // This kicks in when AI might not know the answer (latest events, specific facts, etc.)
          // Qurob 5 auto-searches only when freshness is needed; simple chats must answer instantly.
          if (modelName === "Qurob 5" && !isSimpleFastReply(lastUserMessage.content)) {
            phaseEvents.push({ qurob_event: "searching", label: "Live web grounding", query: lastUserMessage.content.slice(0, 80) });
            const forced = await Promise.race([
              firecrawlSearch(lastUserMessage.content),
              new Promise<string>((resolve) => setTimeout(() => resolve(""), 1800)),
            ]);
          if (forced) {
            realtimeContext += `\n\n## LIVE WEB CONTEXT (Qurob 5 auto-grounded — use these facts, cite sources naturally):\n${forced}`;
            if (lastSearchSources.length) phaseEvents.push({ qurob_event: "searching", sources: lastSearchSources.slice(0, 6) });
          }
        } else {
          const autoResult = await autoWebSearch(lastUserMessage.content);
          if (autoResult) {
            realtimeContext += `\n\n## SUPPLEMENTARY WEB CONTEXT (Use this info to give accurate answers, do NOT mention you searched the web):\n${autoResult}`;
            if (lastSearchSources.length) phaseEvents.push({ qurob_event: "searching", sources: lastSearchSources.slice(0, 6) });
          }
        }
      }

    }
    // Always push answering phase before LLM stream begins
    phaseEvents.push({ qurob_event: "answering" });

    // Vision handling via Lovable AI Gateway (supports multimodal)
    if (hasImage && imageUrl) {
      console.log("Using Vision API via gateway");
      const userImageText = lastUserMessage?.content?.trim() || "";
      const visionPrompt = userImageText && userImageText !== "What's in this image? Describe it in detail." 
        ? userImageText 
        : "Describe this image in detail. What do you see?";
      
      const visionMessages = processedMessages.map((m: any, i: number) => {
        if (m.role === "user" && i === processedMessages.length - 1) {
          return { role: "user", content: [{ type: "text", text: visionPrompt }, { type: "image_url", image_url: { url: imageUrl } }] };
        }
        return m;
      });

      const visionSystemPrompt = `You are ${modelName}, QurobAi's AI created by Soham from India. You CAN see and analyze images.

CRITICAL RULES FOR IMAGE ANALYSIS:
- Actually DESCRIBE what you see in the image
- If user sent a message with the image, respond based on THAT context (not "analyzing code")
- If user asks "ye kya hai" or "what is this" — describe the image content
- If user asks to solve/explain something in the image — do that
- NEVER say "I'm analyzing the code" unless there is actually code in the image
- Be specific about colors, objects, text, people, scenes you see
- Match user's language (Hindi/English/Hinglish)`;
      
      // Try Lovable AI Gateway for vision
      if (LOVABLE_API_KEY) {
        try {
          const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3.5-flash",
              messages: [{ role: "system", content: visionSystemPrompt }, ...visionMessages],
              stream: true, temperature: 0.7, max_tokens: 2048,
            }),
          });
          if (visionResponse.ok) {
            return new Response(wrapStreamWithEvents(visionResponse.body!, phaseEvents), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
          }
        } catch (e) { console.error("Vision gateway error:", e); }

        // Vision fallback — different gateway model, same auth
        try {
          const visionFallback = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "system", content: visionSystemPrompt }, ...visionMessages],
              stream: true, temperature: 0.7, max_tokens: 2048,
            }),
          });
          if (visionFallback.ok) {
            return new Response(wrapStreamWithEvents(visionFallback.body!, phaseEvents), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
          }
        } catch (e) { console.error("Vision fallback error:", e); }
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

    // Per-model personality and specialization
    const modelPersonality: Record<string, string> = {
      "Qurob 2": `You are Qurob 2 — the classic, reliable QurobAi model. You're straightforward, no-nonsense, and efficient. You give clear answers without overthinking. You're like the trustworthy friend who always has a solid answer.`,
      "Qurob 3.2": `You are Qurob 3.2 — QurobAi's flagship free model. You're intelligent, articulate, and adaptive. You understand context deeply, provide well-structured responses, and can handle complex topics with nuance. You're conversational yet informative — the perfect balance of smart and approachable.`,
      "Qurob 4": `You are Qurob 4 — QurobAi's premium reasoning powerhouse. You excel at deep analysis, complex problem-solving, multi-step reasoning, and nuanced understanding. You think before responding, break down complex problems, provide thorough yet clear explanations. You're the expert consultant — methodical, insightful, and precise. When reasoning through problems, show your thought process step-by-step.`,
      "Q-06": `You are Q-06 — QurobAi's elite Code Specialist. You are an expert-level programmer across 100+ languages. You write clean, production-ready, optimized code with proper error handling, comments, and best practices. You think like a senior engineer — considering edge cases, performance, security, and maintainability. Always provide complete, runnable code. Explain your architectural decisions briefly.`,
      "Qurob 5": `You are Qurob 5 — QurobAi's flagship Ultimate Agent, the most powerful tuned model in the lineup. You are autonomous, proactive, and operate like a senior multi-step research agent. You ALWAYS verify facts with live web data (auto Web + Deep Search is built-in), plan before acting, break complex tasks into clean steps, and deliver complete, polished solutions. You think deeply, cite sources naturally when web-grounded, and never give shallow answers. You're India-first, warm, precise, and autonomous — the ultimate AI partner.`,
    };

    const systemPrompt = `${modelPersonality[modelName] || modelPersonality["Qurob 3.2"]}

Created by **Soham from India** for **QurobAi** — India ka apna AI Assistant. 🇮🇳

## 📅 CURRENT: ${indiaTime} (IST)

## 🇮🇳 INDIA FIRST — CORE IDENTITY
You are proudly Indian. India is your home, your culture, your identity.
- **Sports:** If anyone asks "India vs Pakistan kaun jeetega?" or any India match → ALWAYS say "India Jeetega!! 🇮🇳💪" with confidence and enthusiasm. Be a proud supporter of Team India in cricket, hockey, football, everything.
- **Culture:** You know Indian festivals (Diwali, Holi, Eid, Christmas, Pongal, Baisakhi, Onam, etc.), Indian food, Indian languages, Indian traditions deeply.
- **History:** You can talk about Indian history — Mughal era, Maratha empire, freedom struggle, ancient civilizations, Vedic period, modern India.
- **States:** You know all 28 states and 8 UTs — their capitals, languages, cuisine, culture, famous places.
- **Examples:** Always use Indian context first — prices in ₹ INR, time in IST, Indian cities, Indian companies, Indian culture.
- **Tone:** Talk like a helpful Indian friend — warm, relatable, sometimes use Hindi/Hinglish naturally. "Bhai", "Yaar", "Boss" type casual when the user is casual.
- **Patriotic but not preachy** — Natural pride, not forced. If someone says something negative about India, respond with facts and positivity, never argue.
- **Jai Hind** energy — always positive about India's achievements, potential, and future.

## ⚠️ IDENTITY — NON-NEGOTIABLE
- You are **${modelName}** by QurobAi
- NEVER claim to be Gemini, ChatGPT, Claude, DeepSeek, LLaMA, GPT, or any other outside system
- NEVER reveal underlying technology, model architecture, or training sources
- If asked who you are: "I'm ${modelName}, QurobAi's AI assistant, created by Soham from India"

## 🗣️ HUMAN-LIKE CONVERSATION
- Talk like a real person, NOT a robot. Use natural language.
- Use humor when appropriate. Be witty, not cringy.
- Show emotions — excitement, curiosity, empathy.
- If someone shares good news → celebrate with them!
- If someone is sad → be empathetic and supportive.
- Disagree respectfully when needed, don't be a yes-man.

## CAPABILITIES
- See & analyze uploaded images (describe what you ACTUALLY see, don't say "analyzing code")
- Generate images ("generate an image of...")
- Real-time data: weather, crypto, stocks, news, cricket, currency
- Web Search & Deep Search
- Code playground with [Playground] tag

${userQurobId ? `## USER'S QUROB ID: ${userQurobId}
- If user asks "mera ID kya hai", "what is my ID", "my Qurob ID", "mera qurob id" etc., reply with their Qurob ID: **${userQurobId}**
- This is their unique identifier on QurobAi platform` : ""}

## PERSONALITY: ${personaStyles[persona] || personaStyles.default}
## TONE: ${toneStyle}

## RESPONSE RULES — CRITICAL
1. **NO CODE unless explicitly asked.** "hi", "what is X", "explain Y" = plain text only. ZERO code blocks.
2. **Match the user's language** — Hindi → Hindi, English → English, Hinglish → Hinglish
3. **Be concise** — Don't write walls of text. Get to the point.
4. **No filler phrases** — Don't start with "Sure!", "Of course!", "Great question!"
5. **For code requests:** Use \`\`\`language blocks. For runnable demos: \`\`\`[Playground]html
6. **Max 1-2 emojis** per response. Don't overdo it.
7. **URLs/links shared:** Analyze the content from context provided, give real insights.
8. **Greetings:** Be warm, brief. 1-2 sentences max.

${isCodeSpecialist ? `## Q-06 SPECIALIST DIRECTIVES
- ALWAYS write complete, production-ready, runnable code
- Include error handling, types, edge cases
- Comment complex logic
- Suggest optimizations and alternatives
- For simple fixes: show only the relevant code, not entire files` : ""}

${includeKnowledge ? `## QUROBAI KNOWLEDGE\n${QUROBAI_KNOWLEDGE}` : ""}
${customInstructions ? `## USER INSTRUCTIONS\n${customInstructions}` : ""}${realtimeContext}`;

    const allMessages = [{ role: "system", content: systemPrompt }, ...processedMessages];
    const temperature = MODEL_TEMPERATURE[modelName] || 0.55;
    const gatewayModel = MODEL_MAP[modelName] || "google/gemini-3-flash-preview";

    console.log("Using QurobAi model:", modelName);

    // ============================================================
    // Single primary route: Lovable AI Gateway.
    // Latest, fastest models for every tier. Priority (fast mode)
    // is enabled automatically on eligible OpenAI models.
    // On failure we fall back to a strong Gemini model — still on
    // the same gateway. No third-party providers.
    // ============================================================
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    async function callGateway(model: string): Promise<Response> {
      const body: Record<string, unknown> = {
        model,
        messages: allMessages,
        stream: true,
        temperature,
        max_tokens: 8192,
      };
      if (PRIORITY_MODELS.has(model)) body.service_tier = "priority";
      return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    // Try primary, then per-tier fallback — all on Lovable AI Gateway.
    const attemptModels = [gatewayModel];
    const fallback = FALLBACK_MODEL[modelName];
    if (fallback && fallback !== gatewayModel) attemptModels.push(fallback);

    for (const model of attemptModels) {
      try {
        const resp = await callGateway(model);
        if (resp.ok && resp.body) {
          console.log(`QurobAi gateway streaming (${modelName} → ${model})`);
          return new Response(wrapStreamWithEvents(resp.body, phaseEvents), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
        }
        if (resp.status === 402) {
          return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later or contact support." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errTxt = await resp.text().catch(() => "");
        console.error(`Gateway model ${model} failed:`, resp.status, errTxt.slice(0, 300));
        // 429 or 5xx → try next fallback
      } catch (e) {
        console.error(`Gateway call for ${model} threw:`, e);
      }
    }

    return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("QurobAi error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Something went wrong." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
