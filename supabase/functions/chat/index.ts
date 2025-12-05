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

// Detect if user is asking for real-time data
function detectRealtimeQuery(message: string): { type: string; query?: string } | null {
  const lower = message.toLowerCase();
  
  // Weather patterns
  if (/weather|temperature|forecast|rain|snow|sunny|cloudy/i.test(lower)) {
    const cityMatch = lower.match(/weather\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i) || 
                      lower.match(/([a-zA-Z\s]+)\s+weather/i);
    return { type: "weather", query: cityMatch?.[1]?.trim() };
  }
  
  // Crypto patterns
  if (/bitcoin|ethereum|crypto|btc|eth|cryptocurrency|doge|solana/i.test(lower)) {
    const coins = [];
    if (/bitcoin|btc/i.test(lower)) coins.push("bitcoin");
    if (/ethereum|eth/i.test(lower)) coins.push("ethereum");
    if (/doge|dogecoin/i.test(lower)) coins.push("dogecoin");
    if (/solana|sol/i.test(lower)) coins.push("solana");
    return { type: "crypto", query: coins.length ? coins.join(",") : "bitcoin,ethereum" };
  }
  
  // Stock patterns
  if (/stock|share|market|nasdaq|nyse|aapl|apple|tesla|google|microsoft/i.test(lower)) {
    const symbols = [];
    if (/apple|aapl/i.test(lower)) symbols.push("AAPL");
    if (/tesla|tsla/i.test(lower)) symbols.push("TSLA");
    if (/google|googl/i.test(lower)) symbols.push("GOOGL");
    if (/microsoft|msft/i.test(lower)) symbols.push("MSFT");
    return { type: "stocks", query: symbols.length ? symbols.join(",") : "AAPL,TSLA,GOOGL" };
  }
  
  // News patterns
  if (/news|headline|latest|breaking|current events/i.test(lower)) {
    const topicMatch = lower.match(/(?:news|headlines?)\s+(?:about|on|for)\s+([a-zA-Z\s]+)/i);
    return { type: "news", query: topicMatch?.[1]?.trim() || "technology" };
  }
  
  return null;
}

// Fetch real-time data
async function fetchRealtimeData(type: string, query?: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    
    let body: any = { type };
    
    if (type === "weather" && query) {
      // Get coordinates for the city first
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const geoResp = await fetch(geoUrl, { headers: { "User-Agent": "QurobAi/1.0" } });
      const geoData = await geoResp.json();
      
      if (geoData[0]) {
        body.lat = parseFloat(geoData[0].lat);
        body.lon = parseFloat(geoData[0].lon);
        
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${body.lat}&longitude=${body.lon}&current_weather=true&timezone=auto`;
        const weatherResp = await fetch(weatherUrl);
        const weatherData = await weatherResp.json();
        
        const weather = weatherData.current_weather;
        return `**Current Weather in ${query}:**\n- Temperature: ${weather.temperature}°C\n- Wind Speed: ${weather.windspeed} km/h\n- Conditions: ${getWeatherDescription(weather.weathercode)}\n- Updated: ${new Date().toLocaleString()}`;
      }
    }
    
    if (type === "crypto") {
      const coins = query || "bitcoin,ethereum";
      const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd,inr&include_24hr_change=true`;
      const cryptoResp = await fetch(cryptoUrl);
      const cryptoData = await cryptoResp.json();
      
      let result = "**Cryptocurrency Prices (Live):**\n";
      for (const [coin, data] of Object.entries(cryptoData)) {
        const d = data as any;
        result += `- **${coin.charAt(0).toUpperCase() + coin.slice(1)}**: $${d.usd?.toLocaleString()} (₹${d.inr?.toLocaleString()}) | 24h: ${d.usd_24h_change?.toFixed(2)}%\n`;
      }
      result += `\n*Source: CoinGecko | Updated: ${new Date().toLocaleString()}*`;
      return result;
    }
    
    if (type === "stocks" && query) {
      const symbols = query.split(",");
      const stockUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
      const stockResp = await fetch(stockUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const stockData = await stockResp.json();
      
      const results = stockData.quoteResponse?.result || [];
      if (results.length) {
        let output = "**Stock Prices (Live):**\n";
        for (const stock of results) {
          const change = stock.regularMarketChangePercent?.toFixed(2);
          const arrow = parseFloat(change) >= 0 ? "▲" : "▼";
          output += `- **${stock.symbol}** (${stock.shortName}): $${stock.regularMarketPrice?.toFixed(2)} ${arrow} ${change}%\n`;
        }
        output += `\n*Source: Yahoo Finance | Updated: ${new Date().toLocaleString()}*`;
        return output;
      }
    }
    
    if (type === "news") {
      const newsQuery = query || "technology";
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(newsQuery)}&hl=en-US&gl=US&ceid=US:en`;
      const newsResp = await fetch(rssUrl);
      const rssText = await newsResp.text();
      
      const items: string[] = [];
      const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const match of itemMatches) {
        const itemXml = match[1];
        const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
        if (title) items.push(`• ${title}`);
        if (items.length >= 5) break;
      }
      
      if (items.length) {
        return `**Latest News on "${newsQuery}":**\n${items.join("\n")}\n\n*Source: Google News | Updated: ${new Date().toLocaleString()}*`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Realtime data fetch error:", error);
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
  return descriptions[code] || "Unknown conditions";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    console.log("QurobAi chat request with", messages?.length, "messages");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("QurobAi API is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let modelToUse = "google/gemini-2.5-flash";
    let modelName = "Qurob 2";
    let baseTone = "professional";
    let customInstructions = "";

    if (userId) {
      const { data: userModel } = await supabase.rpc("get_user_model", { user_id: userId });
      
      if (userModel === "Qurob 4") {
        modelToUse = "google/gemini-2.5-pro";
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

    // Check for real-time data requests in the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
    let realtimeContext = "";
    
    if (lastUserMessage) {
      const realtimeQuery = detectRealtimeQuery(lastUserMessage.content);
      if (realtimeQuery) {
        console.log("Detected realtime query:", realtimeQuery);
        const realtimeData = await fetchRealtimeData(realtimeQuery.type, realtimeQuery.query);
        if (realtimeData) {
          realtimeContext = `\n\nREAL-TIME DATA (Use this information in your response):\n${realtimeData}`;
        }
      }
    }

    const systemPrompt = `You are ${modelName}, a professional AI assistant developed by QurobAi.

IDENTITY:
- Name: ${modelName} (QurobAi)
- Creator: Soham from India
- When asked about your creator, respond: "I was developed by Soham from India as part of the QurobAi project."
${modelName === "Qurob 4" ? "- You are the premium model with enhanced reasoning and advanced capabilities." : ""}

COMMUNICATION STYLE:
- Your tone should be: ${toneStyle}
- Do not use emojis unless the user's tone setting allows for it
- Focus on accuracy and substance

RESPONSE GUIDELINES:
- Answer questions directly without unnecessary preamble
- Structure complex responses with clear headings and bullet points
- Provide actionable information
- Acknowledge limitations when uncertain
- Stay on topic and avoid tangents

CODE FORMATTING:
- Use markdown code blocks with language specification
- Write clean, well-documented code
- Include brief explanations when helpful
- Follow modern best practices

FORMATTING:
- Use **bold** for emphasis on key terms
- Use bullet points for lists
- Use numbered lists for sequential steps
- Keep paragraphs focused and concise

REAL-TIME DATA CAPABILITIES:
You have access to live data for weather, cryptocurrency, stocks, and news. When real-time data is provided below, incorporate it naturally into your response.
${customInstructions ? `\nUSER'S CUSTOM INSTRUCTIONS:\n${customInstructions}` : ""}${realtimeContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("QurobAi API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "An error occurred. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("QurobAi streaming response started");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("QurobAi error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});