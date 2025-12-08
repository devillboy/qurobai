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
QurobAi is an advanced AI assistant platform developed by **Soham from India**. It provides intelligent conversation capabilities with real-time data access and professional-grade responses.

### AI MODELS AVAILABLE

**1. Qurob 2 (Free Tier)**
- Type: Standard AI Model
- Best For: General conversations, basic questions, everyday tasks
- Features: Fast responses, reliable accuracy, real-time data access
- Access: Free for all users
- Capabilities: Weather, news, crypto prices, general knowledge

**2. Qurob 4 (Premium - ₹289/month)**
- Type: Advanced AI Model with enhanced reasoning
- Best For: Complex analysis, detailed research, professional tasks
- Features: Deeper analysis, better context understanding, priority responses
- Access: Premium subscription required
- Includes: Q-06 Code Specialist access

**3. Q-06 (Code Specialist - Premium Only)**
- Type: Specialized programming AI
- Best For: Complex coding, software architecture, code review, debugging
- Features: Expert-level coding in all languages, clean modular code, best practices
- Access: Included with Qurob 4 subscription
- Languages: JavaScript, TypeScript, Python, React, Node.js, and all major languages

### SUBSCRIPTION & PRICING

| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0 | Qurob 2, basic features, real-time data |
| Premium | ₹289/month | Qurob 4 + Q-06 Code AI, priority support |

**Payment Process:**
1. Go to Subscribe page
2. Select Premium plan
3. Pay via UPI to: **7864084241@ybl**
4. Upload payment screenshot
5. Admin approval within 24 hours
6. Subscription activates automatically

**Coupon Codes:** Available for discounts - contact admin

### PLATFORM FEATURES

1. **Multi-Conversation Support**
   - Create unlimited chat conversations
   - Switch between conversations easily
   - Conversation history saved automatically

2. **File Attachments**
   - Upload images for analysis
   - Share documents (PDF, Word, Text)
   - Code files supported

3. **Real-Time Data**
   - Live weather for any city
   - Cryptocurrency prices (Bitcoin, Ethereum, etc.)
   - Stock market data
   - Latest news headlines

4. **Web Search**
   - Search the internet for current information
   - Get latest news and updates
   - Wikipedia integration for facts

5. **Code Assistance**
   - Syntax highlighting
   - Copy code with one click
   - Multi-language support

6. **Personalization**
   - Choose AI tone (Professional, Friendly, etc.)
   - Custom instructions
   - Tailored responses

7. **Subscription Management**
   - View subscription history
   - Track payment records
   - Expiry notifications (3 days before)

### REAL-TIME CAPABILITIES

- **Weather:** Ask "Weather in [city]" for live conditions
- **Crypto:** Ask about Bitcoin, Ethereum prices
- **Stocks:** Get Apple, Tesla, Google stock prices
- **News:** Latest headlines on any topic
- **Web Search:** Use the search button or say "Search for..."

### CREATOR & CONTACT

- **Creator:** Soham from India
- **Platform:** QurobAi
- **Admin Email:** sohamghosh679@gmail.com
- **Mission:** Accessible, professional AI for everyone

### HOW TO USE

1. **Start Chatting:** Type your question and press Enter
2. **Attach Files:** Click paperclip icon
3. **Web Search:** Click search icon or say "search for..."
4. **Get Real-Time Data:** Ask about weather, crypto, stocks
5. **Code Help:** Ask coding questions for formatted responses

### TECHNICAL STACK

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Supabase Edge Functions
- Authentication: Email/Password
- Storage: Secure cloud storage
- AI: Groq-powered language models (LLaMA)
`;

// Detect query types including web search
function detectQueryType(message: string): { type: string; query?: string } | null {
  const lower = message.toLowerCase();
  
  // Web search patterns
  if (/\[web\s*search\]|search\s+(?:the\s+)?(?:web|internet|online)\s+(?:for\s+)?|deep\s*search|look\s+up|research\s+about/i.test(lower)) {
    const searchMatch = message.match(/(?:search\s+(?:the\s+)?(?:web|internet|online)\s+(?:for\s+)?|deep\s*search\s+|look\s+up\s+|research\s+about\s+|\[web\s*search\]\s*(?:search\s+(?:the\s+)?(?:web\s+)?(?:for\s+)?)?:?\s*)(.+?)(?:\?|$)/i);
    return { type: "websearch", query: searchMatch?.[1]?.trim() || message.replace(/\[web\s*search\]/i, "").trim() };
  }
  
  // Weather patterns
  if (/weather|temperature|forecast|rain|snow|sunny|cloudy/i.test(lower)) {
    const cityMatch = lower.match(/weather\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i) || 
                      lower.match(/([a-zA-Z\s]+)\s+weather/i);
    return { type: "weather", query: cityMatch?.[1]?.trim() };
  }
  
  // Crypto patterns
  if (/bitcoin|ethereum|crypto|btc|eth|cryptocurrency|doge|solana|xrp|cardano/i.test(lower)) {
    const coins = [];
    if (/bitcoin|btc/i.test(lower)) coins.push("bitcoin");
    if (/ethereum|eth/i.test(lower)) coins.push("ethereum");
    if (/doge|dogecoin/i.test(lower)) coins.push("dogecoin");
    if (/solana|sol/i.test(lower)) coins.push("solana");
    if (/xrp|ripple/i.test(lower)) coins.push("ripple");
    if (/cardano|ada/i.test(lower)) coins.push("cardano");
    return { type: "crypto", query: coins.length ? coins.join(",") : "bitcoin,ethereum" };
  }
  
  // Stock patterns
  if (/stock|share|market|nasdaq|nyse|aapl|apple|tesla|google|microsoft|amazon/i.test(lower)) {
    const symbols = [];
    if (/apple|aapl/i.test(lower)) symbols.push("AAPL");
    if (/tesla|tsla/i.test(lower)) symbols.push("TSLA");
    if (/google|googl/i.test(lower)) symbols.push("GOOGL");
    if (/microsoft|msft/i.test(lower)) symbols.push("MSFT");
    if (/amazon|amzn/i.test(lower)) symbols.push("AMZN");
    if (/meta|facebook/i.test(lower)) symbols.push("META");
    return { type: "stocks", query: symbols.length ? symbols.join(",") : "AAPL,TSLA,GOOGL" };
  }
  
  // News patterns
  if (/news|headline|latest|breaking|current events/i.test(lower)) {
    const topicMatch = lower.match(/(?:news|headlines?)\s+(?:about|on|for)\s+([a-zA-Z\s]+)/i);
    return { type: "news", query: topicMatch?.[1]?.trim() || "technology" };
  }
  
  return null;
}

// Web search function
async function performWebSearch(query: string): Promise<string> {
  try {
    console.log("Performing web search for:", query);
    
    const results: string[] = [];
    
    // Google News RSS
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      const newsResp = await fetch(rssUrl);
      const rssText = await newsResp.text();
      
      const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const match of itemMatches) {
        const itemXml = match[1];
        const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
        const source = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";
        if (title) results.push(`• **${title}** ${source ? `(${source})` : ""}`);
        if (results.length >= 6) break;
      }
    } catch (e) {
      console.log("News fetch error:", e);
    }
    
    // Wikipedia
    let wikiInfo = "";
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const wikiResp = await fetch(wikiUrl);
      if (wikiResp.ok) {
        const wikiData = await wikiResp.json();
        if (wikiData.extract) {
          wikiInfo = `\n\n**Wikipedia:**\n${wikiData.extract.slice(0, 400)}${wikiData.extract.length > 400 ? "..." : ""}`;
        }
      }
    } catch (e) {
      console.log("Wikipedia error:", e);
    }
    
    if (results.length > 0 || wikiInfo) {
      return `**🔍 Web Search Results: "${query}"**\n\n${results.join("\n")}${wikiInfo}\n\n*Updated: ${new Date().toLocaleString()}*`;
    }
    
    return `No results found for "${query}".`;
  } catch (error) {
    console.error("Web search error:", error);
    return "Web search temporarily unavailable.";
  }
}

// Fetch real-time data
async function fetchRealtimeData(type: string, query?: string): Promise<string | null> {
  try {
    if (type === "websearch" && query) {
      return await performWebSearch(query);
    }
    
    if (type === "weather" && query) {
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const geoResp = await fetch(geoUrl, { headers: { "User-Agent": "QurobAi/1.0" } });
      const geoData = await geoResp.json();
      
      if (geoData[0]) {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geoData[0].lat}&longitude=${geoData[0].lon}&current_weather=true&timezone=auto`;
        const weatherResp = await fetch(weatherUrl);
        const weatherData = await weatherResp.json();
        const w = weatherData.current_weather;
        return `**🌤 Weather in ${query}:**\n- Temperature: ${w.temperature}°C\n- Wind: ${w.windspeed} km/h\n- Conditions: ${getWeatherDescription(w.weathercode)}\n\n*Updated: ${new Date().toLocaleString()}*`;
      }
    }
    
    if (type === "crypto") {
      const coins = query || "bitcoin,ethereum";
      const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd,inr&include_24hr_change=true`;
      const cryptoResp = await fetch(cryptoUrl);
      const data = await cryptoResp.json();
      
      let result = "**📊 Crypto Prices:**\n";
      for (const [coin, d] of Object.entries(data)) {
        const info = d as any;
        const arrow = (info.usd_24h_change || 0) >= 0 ? "▲" : "▼";
        result += `- **${coin.charAt(0).toUpperCase() + coin.slice(1)}**: $${info.usd?.toLocaleString()} (₹${info.inr?.toLocaleString()}) ${arrow} ${info.usd_24h_change?.toFixed(2)}%\n`;
      }
      return result + `\n*Source: CoinGecko | ${new Date().toLocaleString()}*`;
    }
    
    if (type === "stocks" && query) {
      const stockUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`;
      const stockResp = await fetch(stockUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const stockData = await stockResp.json();
      const results = stockData.quoteResponse?.result || [];
      
      if (results.length) {
        let output = "**📈 Stock Prices:**\n";
        for (const s of results) {
          const arrow = (s.regularMarketChangePercent || 0) >= 0 ? "▲" : "▼";
          output += `- **${s.symbol}** (${s.shortName}): $${s.regularMarketPrice?.toFixed(2)} ${arrow} ${s.regularMarketChangePercent?.toFixed(2)}%\n`;
        }
        return output + `\n*Source: Yahoo Finance | ${new Date().toLocaleString()}*`;
      }
    }
    
    if (type === "news") {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query || "technology")}&hl=en-US&gl=US&ceid=US:en`;
      const newsResp = await fetch(rssUrl);
      const rssText = await newsResp.text();
      
      const items: string[] = [];
      const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const match of itemMatches) {
        const title = match[1].match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
        if (title) items.push(`• ${title}`);
        if (items.length >= 5) break;
      }
      
      if (items.length) {
        return `**📰 News: "${query}"**\n${items.join("\n")}\n\n*Source: Google News | ${new Date().toLocaleString()}*`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Data fetch error:", error);
    return null;
  }
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Moderate showers", 82: "Heavy showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm",
  };
  return descriptions[code] || "Unknown";
}

function isQurobAiQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return /qurob|who\s+(?:made|created|built|developed)\s+you|what\s+(?:are|is)\s+you|about\s+(?:this|your)|your\s+(?:name|creator)|which\s+(?:ai|model)|subscription|pricing|plan|feature|premium|upgrade|q-06|code\s+model/i.test(lower);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    console.log("QurobAi request:", messages?.length, "messages");
    
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("Groq API not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Groq models: llama-3.3-70b-versatile for premium, llama-3.1-8b-instant for free
    let modelToUse = "llama-3.1-8b-instant";
    let modelName = "Qurob 2";
    let baseTone = "professional";
    let customInstructions = "";

    if (userId) {
      const { data: userModel } = await supabase.rpc("get_user_model", { user_id: userId });
      
      if (userModel === "Qurob 4") {
        modelToUse = "llama-3.3-70b-versatile";
        modelName = "Qurob 4";
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
        console.log("Query type:", queryType);
        const data = await fetchRealtimeData(queryType.type, queryType.query);
        if (data) realtimeContext = `\n\nREAL-TIME DATA:\n${data}`;
      }
    }

    const systemPrompt = `You are ${modelName}, an AI assistant by QurobAi.

## IDENTITY
- Name: ${modelName}
- Creator: Soham from India
- Platform: QurobAi
${modelName === "Qurob 4" ? "- Premium model with Q-06 code specialist capabilities" : "- Free tier model for general use"}

## STYLE
- Tone: ${toneStyle}
- No emojis (unless user prefers)
- Professional and accurate
- Direct answers without fluff

## RESPONSE FORMAT
- Use **bold** for key terms
- Use bullet points for lists
- Code blocks with language tags
- Keep responses focused

## CAPABILITIES
- Real-time: weather, crypto, stocks, news
- Web search for current information
- Code assistance (${modelName === "Qurob 4" ? "expert Q-06 level" : "basic help"})
- General knowledge
${includeKnowledge ? `\n## QUROBAI KNOWLEDGE\n${QUROBAI_KNOWLEDGE}` : ""}
${customInstructions ? `\n## USER INSTRUCTIONS\n${customInstructions}` : ""}${realtimeContext}`;

    console.log("Model:", modelToUse, "as", modelName);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("QurobAi error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
