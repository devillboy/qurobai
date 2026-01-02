import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TONE_STYLES: Record<string, string> = {
  default: "balanced and adaptable",
  professional: "polished, precise, and formal. Avoid casual language, emojis, and unnecessary friendliness",
  friendly: "warm, approachable, and conversational while remaining helpful",
  candid: "direct, honest, and encouraging. Get straight to the point",
  quirky: "playful, creative, and imaginative while still being informative",
  efficient: "extremely concise and plain. Minimize words, maximize information density",
  nerdy: "exploratory, enthusiastic, and deep-diving into technical details",
  cynical: "critical, analytical, and slightly sarcastic while still being helpful",
};

// Complete QurobAi Knowledge Base
const QUROBAI_KNOWLEDGE = `
## QUROBAI - COMPLETE KNOWLEDGE BASE

### ABOUT QUROBAI
QurobAi is India's premier AI assistant platform developed by **Soham from India**. It provides intelligent conversation capabilities with real-time data access, professional-grade responses, and specialized AI models for different use cases.

Website: QurobAi.com (or current domain)
Creator: Soham (sohamghosh679@gmail.com)
Country: India
Tech Stack: React, TypeScript, Tailwind CSS, Supabase, Multiple AI APIs

### AI MODELS AVAILABLE

**1. Qurob 2 (Free Tier)**
- Type: Fast Standard AI Model
- Best For: Quick questions, general conversations, basic tasks
- Features: Fast responses, real-time data access, basic code help
- Access: FREE for all registered users
- Speed: Very fast (optimized for instant responses)
- Capabilities: Weather, news, crypto, stocks, cricket scores, currency exchange, web search

**2. Qurob 4 (Premium - ₹289/month)**
- Type: Advanced AI Model with superior reasoning
- Best For: Complex analysis, detailed research, professional work
- Features: Deeper understanding, nuanced responses, better accuracy
- Access: Requires Premium subscription (₹289/month)
- Includes: All Qurob 2 features plus enhanced capabilities

**3. Q-06 (Code Specialist - ₹320/month)**
- Type: Specialized Programming AI
- Best For: Complex coding, architecture design, debugging, code review
- Features: Expert-level coding in ALL languages, clean modular code
- Access: Separate subscription at ₹320/month
- Languages: JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, and 100+ more
- Specialties: Full-stack development, API design, database optimization, DevOps

### SUBSCRIPTION & PRICING

| Plan | Price | Model | Features |
|------|-------|-------|----------|
| Free | ₹0/month | Qurob 2 | Basic AI, real-time data, web search |
| Premium | ₹289/month | Qurob 4 | Advanced AI, better answers, priority |
| Code Specialist | ₹320/month | Q-06 | Expert coding AI, all languages |

**Payment Process (Manual UPI):**
1. Go to Subscribe page in QurobAi
2. Select your preferred plan (Premium or Code Specialist)
3. Pay via UPI to: **7864084241@ybl**
4. Upload payment screenshot as proof
5. Admin reviews and approves within 24 hours
6. Subscription activates immediately after approval
7. You get 30 days access from activation date

### REAL-TIME DATA CAPABILITIES

**Weather:** "Weather in Delhi" → Get current temperature, conditions, humidity
**Crypto:** "Bitcoin price" → Get BTC, ETH, etc. with 24h changes
**Stocks:** "Tesla stock" → Get real-time market prices
**News:** "Latest tech news" → Get current headlines
**Cricket:** "Live cricket score" → Get IPL, international match scores
**Currency:** "USD to INR rate" → Get forex exchange rates
**Web Search:** "[Web Search] AI developments 2024" → Search internet

### CONTACT & SUPPORT

- Creator: Soham from India
- Email: sohamghosh679@gmail.com
- Admin Panel: Available for authorized admins only
- Response Time: Usually within 24 hours

### FAQs

**Q: Is QurobAi free?**
A: Yes! Qurob 2 is completely free. Premium features require subscription.

**Q: How do I pay?**
A: Pay via UPI to 7864084241@ybl and upload screenshot.

**Q: When does my subscription activate?**
A: Within 24 hours after admin approval.

**Q: Who made QurobAi?**
A: Soham from India created QurobAi.

**Q: What makes Qurob 4 better?**
A: Uses larger model for more accurate, nuanced responses.

**Q: What can Q-06 do?**
A: Expert-level coding in any language with clean, modular output.
`;

// Enhanced query detection with cricket and currency
function detectQueryType(message: string): { type: string; query?: string } | null {
  const lower = message.toLowerCase();
  
  // Web search patterns
  if (/\[web\s*search\]|search\s+(?:the\s+)?(?:web|internet|online)\s+(?:for\s+)?|deep\s*search|look\s+up|research\s+about|find\s+(?:information|info)\s+(?:about|on)/i.test(lower)) {
    const searchMatch = message.match(/(?:search\s+(?:the\s+)?(?:web|internet|online)\s+(?:for\s+)?|deep\s*search\s+|look\s+up\s+|research\s+about\s+|find\s+(?:information|info)\s+(?:about|on)\s+|\[web\s*search\]\s*(?:search\s+(?:the\s+)?(?:web\s+)?(?:for\s+)?)?:?\s*)(.+?)(?:\?|$)/i);
    return { type: "websearch", query: searchMatch?.[1]?.trim() || message.replace(/\[web\s*search\]/i, "").trim() };
  }
  
  // Cricket patterns
  if (/cricket|ipl|match\s+score|live\s+score|ind\s+vs|india\s+(?:vs|versus)|pakistan\s+(?:vs|versus)|australia\s+(?:vs|versus)|t20|odi|test\s+match|bcci|icc/i.test(lower)) {
    const teamMatch = lower.match(/(?:ind(?:ia)?|pak(?:istan)?|aus(?:tralia)?|eng(?:land)?|sa|nz|wi|sl|ban)\s+(?:vs|versus|v)\s+(?:ind(?:ia)?|pak(?:istan)?|aus(?:tralia)?|eng(?:land)?|sa|nz|wi|sl|ban)/i);
    return { type: "cricket", query: teamMatch?.[0] || "live" };
  }
  
  // Currency/Forex patterns
  if (/(?:usd|eur|gbp|inr|jpy|aud|cad|chf|cny|rupee|dollar|euro|pound|yen)\s+(?:to|vs|rate|price|exchange|convert)/i.test(lower) ||
      /(?:convert|exchange)\s+(?:currency|\d+\s+)?(?:usd|eur|gbp|inr)/i.test(lower) ||
      /forex|currency\s+(?:rate|exchange|converter)/i.test(lower)) {
    const currMatch = lower.match(/(usd|eur|gbp|inr|jpy|aud|cad)\s+(?:to|vs)\s+(usd|eur|gbp|inr|jpy|aud|cad)/i);
    return { type: "currency", query: currMatch ? `${currMatch[1]},${currMatch[2]}` : "usd,eur,gbp,inr" };
  }
  
  // Weather patterns
  if (/weather|temperature|forecast|rain|snow|sunny|cloudy|humid|wind|climate|degrees?\s+(?:celsius|fahrenheit)/i.test(lower)) {
    const cityMatch = lower.match(/weather\s+(?:in|for|at|of)\s+([a-zA-Z\s]+)/i) || 
                      lower.match(/([a-zA-Z\s]+)\s+(?:weather|temperature|forecast)/i) ||
                      lower.match(/(?:temperature|forecast)\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i);
    return { type: "weather", query: cityMatch?.[1]?.trim() || "Delhi" };
  }
  
  // Crypto patterns
  if (/bitcoin|ethereum|crypto|btc|eth|cryptocurrency|doge|solana|xrp|cardano|bnb|polygon|matic|litecoin|polkadot|avalanche|shiba|coin\s+price/i.test(lower)) {
    const coins = [];
    if (/bitcoin|btc/i.test(lower)) coins.push("bitcoin");
    if (/ethereum|eth(?!er)/i.test(lower)) coins.push("ethereum");
    if (/doge|dogecoin/i.test(lower)) coins.push("dogecoin");
    if (/solana|sol(?!id)/i.test(lower)) coins.push("solana");
    if (/xrp|ripple/i.test(lower)) coins.push("ripple");
    if (/cardano|ada/i.test(lower)) coins.push("cardano");
    if (/bnb|binance/i.test(lower)) coins.push("binancecoin");
    if (/polygon|matic/i.test(lower)) coins.push("matic-network");
    if (/litecoin|ltc/i.test(lower)) coins.push("litecoin");
    if (/polkadot|dot/i.test(lower)) coins.push("polkadot");
    if (/avalanche|avax/i.test(lower)) coins.push("avalanche-2");
    if (/shiba|shib/i.test(lower)) coins.push("shiba-inu");
    return { type: "crypto", query: coins.length ? coins.join(",") : "bitcoin,ethereum" };
  }
  
  // Stock patterns
  if (/stock|share|market|nasdaq|nyse|nifty|sensex|aapl|apple|tesla|google|microsoft|amazon|nvidia|meta|netflix/i.test(lower)) {
    const symbols = [];
    if (/apple|aapl/i.test(lower)) symbols.push("AAPL");
    if (/tesla|tsla/i.test(lower)) symbols.push("TSLA");
    if (/google|googl|alphabet/i.test(lower)) symbols.push("GOOGL");
    if (/microsoft|msft/i.test(lower)) symbols.push("MSFT");
    if (/amazon|amzn/i.test(lower)) symbols.push("AMZN");
    if (/meta|facebook/i.test(lower)) symbols.push("META");
    if (/nvidia|nvda/i.test(lower)) symbols.push("NVDA");
    if (/netflix|nflx/i.test(lower)) symbols.push("NFLX");
    if (/amd/i.test(lower)) symbols.push("AMD");
    if (/intel|intc/i.test(lower)) symbols.push("INTC");
    return { type: "stocks", query: symbols.length ? symbols.join(",") : "AAPL,TSLA,GOOGL,NVDA" };
  }
  
  // News patterns
  if (/news|headline|latest|breaking|current events|what.?s\s+happening|today.?s\s+news/i.test(lower)) {
    const topicMatch = lower.match(/(?:news|headlines?)\s+(?:about|on|for|regarding)\s+([a-zA-Z\s]+)/i) ||
                       lower.match(/latest\s+(?:on|about|in)\s+([a-zA-Z\s]+)/i);
    return { type: "news", query: topicMatch?.[1]?.trim() || "world" };
  }
  
  // Time/Date patterns
  if (/what\s+(?:time|date)|current\s+(?:time|date)|today.?s\s+date/i.test(lower)) {
    return { type: "time" };
  }
  
  return null;
}

// Web search function
async function performWebSearch(query: string): Promise<string> {
  try {
    console.log("Web search for:", query);
    const results: string[] = [];
    
    // Google News RSS
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const newsResp = await fetch(rssUrl, { headers: { "User-Agent": "QurobAi/3.0" } });
      const rssText = await newsResp.text();
      
      const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const match of itemMatches) {
        const itemXml = match[1];
        const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
        const source = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";
        if (title) results.push(`• **${title}** ${source ? `(${source})` : ""}`);
        if (results.length >= 8) break;
      }
    } catch (e) { console.log("News error:", e); }
    
    // Wikipedia
    let wikiInfo = "";
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const wikiResp = await fetch(wikiUrl, { headers: { "User-Agent": "QurobAi/3.0" } });
      if (wikiResp.ok) {
        const wikiData = await wikiResp.json();
        if (wikiData.extract && wikiData.type !== "disambiguation") {
          wikiInfo = `\n\n**📚 Wikipedia:**\n${wikiData.extract.slice(0, 500)}${wikiData.extract.length > 500 ? "..." : ""}`;
        }
      }
    } catch (e) { console.log("Wiki error:", e); }
    
    // DuckDuckGo
    let ddgInfo = "";
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
      const ddgResp = await fetch(ddgUrl);
      if (ddgResp.ok) {
        const ddgData = await ddgResp.json();
        if (ddgData.Abstract) ddgInfo = `\n\n**📖 Summary:**\n${ddgData.Abstract.slice(0, 400)}`;
      }
    } catch (e) { console.log("DDG error:", e); }
    
    if (results.length > 0 || wikiInfo || ddgInfo) {
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      return `**🔍 Web Search Results: "${query}"**\n\n**📰 Latest News:**\n${results.join("\n") || "No recent news found"}${wikiInfo}${ddgInfo}\n\n*Updated: ${timestamp} IST*`;
    }
    
    return `No comprehensive results found for "${query}". Try rephrasing your query.`;
  } catch (error) {
    console.error("Web search error:", error);
    return "Web search temporarily unavailable.";
  }
}

// Fetch cricket scores
async function fetchCricketScores(): Promise<string> {
  try {
    // Using CricAPI or similar - fallback to news
    const rssUrl = `https://news.google.com/rss/search?q=cricket+live+score+today&hl=en-IN&gl=IN&ceid=IN:en`;
    const resp = await fetch(rssUrl, { headers: { "User-Agent": "QurobAi/3.0" } });
    const rssText = await resp.text();
    
    const items: string[] = [];
    const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const title = match[1].match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
      const source = match[1].match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";
      if (title && /score|runs|wicket|over|match|vs|v\s/i.test(title)) {
        items.push(`🏏 **${title}** ${source ? `(${source})` : ""}`);
      }
      if (items.length >= 5) break;
    }
    
    if (items.length) {
      return `**🏏 Live Cricket Updates:**\n\n${items.join("\n\n")}\n\n*Source: Sports News | ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST*`;
    }
    return "No live cricket matches at the moment. Check back during match times!";
  } catch (error) {
    console.error("Cricket error:", error);
    return "Cricket scores temporarily unavailable.";
  }
}

// Fetch currency exchange rates
async function fetchCurrencyRates(currencies: string): Promise<string> {
  try {
    // Using exchangerate.host (free, no key needed)
    const baseUrl = "https://api.exchangerate.host/latest";
    const resp = await fetch(`${baseUrl}?base=USD`);
    
    if (!resp.ok) {
      // Fallback to frankfurter
      const fallbackResp = await fetch("https://api.frankfurter.app/latest?from=USD");
      if (fallbackResp.ok) {
        const data = await fallbackResp.json();
        let result = "**💱 Currency Exchange Rates (Base: USD)**\n\n";
        const importantCurrencies = ["INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"];
        
        for (const curr of importantCurrencies) {
          if (data.rates[curr]) {
            result += `**USD → ${curr}:** ${data.rates[curr].toFixed(4)}\n`;
          }
        }
        return result + `\n*Source: Frankfurter | ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST*`;
      }
    }
    
    const data = await resp.json();
    let result = "**💱 Currency Exchange Rates (Base: USD)**\n\n";
    const rates = data.rates || {};
    
    const importantCurrencies = ["INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"];
    for (const curr of importantCurrencies) {
      if (rates[curr]) {
        result += `**USD → ${curr}:** ${rates[curr].toFixed(4)}\n`;
      }
    }
    
    return result + `\n*Source: Exchange Rate API | ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST*`;
  } catch (error) {
    console.error("Currency error:", error);
    return "Currency rates temporarily unavailable.";
  }
}

// Fetch real-time data
async function fetchRealtimeData(type: string, query?: string): Promise<string | null> {
  try {
    if (type === "websearch" && query) return await performWebSearch(query);
    if (type === "cricket") return await fetchCricketScores();
    if (type === "currency") return await fetchCurrencyRates(query || "usd,inr");
    
    if (type === "time") {
      const now = new Date();
      const indiaTime = now.toLocaleString("en-IN", { 
        timeZone: "Asia/Kolkata",
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
      return `**🕐 Current Time & Date:**\n${indiaTime} (IST)`;
    }
    
    if (type === "weather" && query) {
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const geoResp = await fetch(geoUrl, { headers: { "User-Agent": "QurobAi/3.0" } });
      const geoData = await geoResp.json();
      
      if (geoData[0]) {
        const { lat, lon, display_name } = geoData[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability&timezone=auto`;
        const weatherResp = await fetch(weatherUrl);
        const weatherData = await weatherResp.json();
        const w = weatherData.current_weather;
        
        const currentHour = new Date().getHours();
        const humidity = weatherData.hourly?.relativehumidity_2m?.[currentHour] || "N/A";
        const precipitation = weatherData.hourly?.precipitation_probability?.[currentHour] || 0;
        
        return `**🌤 Weather in ${query.charAt(0).toUpperCase() + query.slice(1)}:**

- **Temperature:** ${w.temperature}°C
- **Feels Like:** ~${Math.round(w.temperature - (w.windspeed / 10))}°C
- **Wind Speed:** ${w.windspeed} km/h
- **Humidity:** ${humidity}%
- **Rain Chance:** ${precipitation}%
- **Conditions:** ${getWeatherDescription(w.weathercode)}

*Location: ${display_name?.split(",").slice(0, 2).join(",")}*
*Updated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST*`;
      }
      return `Could not find weather data for "${query}". Please check the city name.`;
    }
    
    if (type === "crypto") {
      const coins = query || "bitcoin,ethereum";
      const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd,inr&include_24hr_change=true`;
      const cryptoResp = await fetch(cryptoUrl);
      
      if (!cryptoResp.ok) return "Crypto data temporarily unavailable. CoinGecko rate limit reached.";
      
      const data = await cryptoResp.json();
      let result = "**📊 Cryptocurrency Prices:**\n\n";
      
      for (const [coin, d] of Object.entries(data)) {
        const info = d as any;
        const arrow = (info.usd_24h_change || 0) >= 0 ? "📈" : "📉";
        const changeColor = (info.usd_24h_change || 0) >= 0 ? "+" : "";
        result += `**${coin.charAt(0).toUpperCase() + coin.slice(1)}:**\n`;
        result += `  💵 $${info.usd?.toLocaleString()}\n`;
        result += `  ₹ ₹${info.inr?.toLocaleString()}\n`;
        result += `  ${arrow} ${changeColor}${info.usd_24h_change?.toFixed(2)}% (24h)\n\n`;
      }
      return result + `*Source: CoinGecko | ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST*`;
    }
    
    if (type === "stocks" && query) {
      const stockUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`;
      const stockResp = await fetch(stockUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      
      if (!stockResp.ok) return "Stock data temporarily unavailable.";
      
      const stockData = await stockResp.json();
      const results = stockData.quoteResponse?.result || [];
      
      if (results.length) {
        let output = "**📈 Stock Market Prices:**\n\n";
        for (const s of results) {
          const arrow = (s.regularMarketChangePercent || 0) >= 0 ? "📈" : "📉";
          const changeColor = (s.regularMarketChangePercent || 0) >= 0 ? "+" : "";
          output += `**${s.symbol}** (${s.shortName || s.longName}):\n`;
          output += `  💵 $${s.regularMarketPrice?.toFixed(2)}\n`;
          output += `  ${arrow} ${changeColor}${s.regularMarketChangePercent?.toFixed(2)}%\n`;
          output += `  📊 Volume: ${(s.regularMarketVolume / 1000000).toFixed(2)}M\n\n`;
        }
        return output + `*Source: Yahoo Finance | ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST*`;
      }
      return "No stock data found for the requested symbols.";
    }
    
    if (type === "news") {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query || "India")}&hl=en-IN&gl=IN&ceid=IN:en`;
      const newsResp = await fetch(rssUrl);
      const rssText = await newsResp.text();
      
      const items: string[] = [];
      const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const match of itemMatches) {
        const title = match[1].match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
        const source = match[1].match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";
        if (title) items.push(`• **${title}** ${source ? `(${source})` : ""}`);
        if (items.length >= 6) break;
      }
      
      if (items.length) {
        return `**📰 Latest News: "${query || "Headlines"}"**\n\n${items.join("\n\n")}\n\n*Source: Google News | ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST*`;
      }
      return `No recent news found for "${query}".`;
    }
    
    return null;
  } catch (error) {
    console.error("Data fetch error:", error);
    return null;
  }
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "☀️ Clear sky", 1: "🌤️ Mainly clear", 2: "⛅ Partly cloudy", 3: "☁️ Overcast",
    45: "🌫️ Fog", 48: "🌫️ Depositing rime fog",
    51: "🌧️ Light drizzle", 53: "🌧️ Moderate drizzle", 55: "🌧️ Dense drizzle",
    61: "🌧️ Slight rain", 63: "🌧️ Moderate rain", 65: "🌧️ Heavy rain",
    71: "❄️ Slight snow", 73: "❄️ Moderate snow", 75: "❄️ Heavy snow",
    77: "🌨️ Snow grains", 80: "🌦️ Slight rain showers", 81: "🌦️ Moderate rain showers",
    82: "⛈️ Violent rain showers", 85: "🌨️ Slight snow showers", 86: "🌨️ Heavy snow showers",
    95: "⛈️ Thunderstorm", 96: "⛈️ Thunderstorm with slight hail", 99: "⛈️ Thunderstorm with heavy hail",
  };
  return descriptions[code] || "Unknown conditions";
}

function isQurobAiQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return /qurob|who\s+(?:made|created|built|developed)\s+you|what\s+(?:are|is)\s+you|about\s+(?:this|your)|your\s+(?:name|creator|developer)|which\s+(?:ai|model)|subscription|pricing|plan|feature|premium|upgrade|q-06|code\s+(?:model|specialist)|how\s+(?:do|does)\s+(?:this|you)\s+work|payment|upi|soham/i.test(lower);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("QurobAi request:", messages.length, "messages, userId:", userId ? "yes" : "no");
    
    // Get available API keys
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const FIREWORKS_API_KEY = Deno.env.get("FIREWORKS_API_KEY");
    const DEEPINFRA_API_KEY = Deno.env.get("DEEPINFRA_API_KEY");
    
    if (!GROQ_API_KEY && !FIREWORKS_API_KEY && !DEEPINFRA_API_KEY) {
      console.error("No AI API keys configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please contact admin." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Model selection based on subscription
    let modelName = "Qurob 2";
    let isCodeSpecialist = false;
    let baseTone = "professional";
    let customInstructions = "";

    if (userId) {
      try {
        const { data: userModel } = await supabase.rpc("get_user_model", { user_id: userId });
        
        if (userModel === "Qurob 4") {
          modelName = "Qurob 4";
        } else if (userModel === "Q-06") {
          modelName = "Q-06";
          isCodeSpecialist = true;
        }

        const { data: settings } = await supabase
          .from("user_settings")
          .select("base_tone, custom_instructions")
          .eq("user_id", userId)
          .single();

        if (settings) {
          baseTone = settings.base_tone || "professional";
          customInstructions = settings.custom_instructions || "";
        }
      } catch (e) {
        console.log("User settings error:", e);
      }
    }

    const toneStyle = TONE_STYLES[baseTone] || TONE_STYLES.professional;

    // Process last message for real-time data
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
    let realtimeContext = "";
    let includeKnowledge = false;
    
    if (lastUserMessage) {
      if (isQurobAiQuery(lastUserMessage.content)) {
        includeKnowledge = true;
      }
      
      const queryType = detectQueryType(lastUserMessage.content);
      if (queryType) {
        console.log("Detected query:", queryType.type, queryType.query);
        const data = await fetchRealtimeData(queryType.type, queryType.query);
        if (data) {
          realtimeContext = `\n\n## REAL-TIME DATA (Present this to user):\n${data}`;
        }
      }
    }

    // Build system prompt
    let systemPrompt = `You are ${modelName}, an advanced AI assistant created by QurobAi.

## YOUR IDENTITY
- Name: ${modelName}
- Creator: Soham from India
- Platform: QurobAi (India's AI Assistant)
- Type: ${isCodeSpecialist ? "Code Specialist AI - Expert programmer" : modelName === "Qurob 4" ? "Premium Advanced AI" : "Standard AI Assistant"}

## COMMUNICATION STYLE
- Tone: ${toneStyle}
- Language: Match user's language (Hindi, English, Hinglish)
- NO excessive emojis (only where helpful)
- Professional, accurate, and direct

## RESPONSE FORMAT
- Use **bold** for important terms
- Use bullet points for lists
- Use proper markdown for structure
- Code blocks with language tags: \`\`\`javascript
- Keep responses focused and valuable

## CAPABILITIES
${isCodeSpecialist ? `
### CODE SPECIALIST MODE (Q-06)
You are an EXPERT programmer. Provide:
- Clean, modular, production-ready code
- Best practices and design patterns
- Comprehensive error handling
- Clear comments and documentation
- Performance optimizations
- Security considerations
Languages: JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL, and 100+ more
` : `
- Real-time data: weather, crypto, stocks, news, cricket, currency
- Web search for current information
- General knowledge and reasoning
- Basic code help${modelName === "Qurob 4" ? " (enhanced)" : ""}
`}

## REAL-TIME DATA
When user asks about weather, crypto, stocks, news, cricket, or currency:
- Present the real-time data clearly
- Add brief analysis or context
- Mention data source and timestamp

${includeKnowledge ? `## QUROBAI COMPLETE KNOWLEDGE\n${QUROBAI_KNOWLEDGE}` : ""}

${customInstructions ? `## USER CUSTOM INSTRUCTIONS\n${customInstructions}` : ""}${realtimeContext}`;

    console.log("Using model:", modelName, isCodeSpecialist ? "(Code Specialist)" : "");

    // Determine which API to use (priority: Groq > Fireworks > DeepInfra)
    let apiUrl: string;
    let apiKey: string;
    let modelToUse: string;
    let headers: Record<string, string>;

    if (GROQ_API_KEY) {
      apiUrl = "https://api.groq.com/openai/v1/chat/completions";
      apiKey = GROQ_API_KEY;
      modelToUse = (modelName === "Qurob 4" || isCodeSpecialist) ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
      headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    } else if (FIREWORKS_API_KEY) {
      apiUrl = "https://api.fireworks.ai/inference/v1/chat/completions";
      apiKey = FIREWORKS_API_KEY;
      modelToUse = (modelName === "Qurob 4" || isCodeSpecialist) ? "accounts/fireworks/models/llama-v3p1-70b-instruct" : "accounts/fireworks/models/llama-v3p1-8b-instruct";
      headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    } else {
      apiUrl = "https://api.deepinfra.com/v1/openai/chat/completions";
      apiKey = DEEPINFRA_API_KEY!;
      modelToUse = (modelName === "Qurob 4" || isCodeSpecialist) ? "meta-llama/Meta-Llama-3.1-70B-Instruct" : "meta-llama/Meta-Llama-3.1-8B-Instruct";
      headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    }

    console.log("API:", apiUrl.includes("groq") ? "Groq" : apiUrl.includes("fireworks") ? "Fireworks" : "DeepInfra", "Model:", modelToUse);

    // Call AI API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: isCodeSpecialist ? 0.3 : 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "API authentication error. Please contact admin." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response started");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("QurobAi error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
