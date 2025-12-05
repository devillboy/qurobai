import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DataRequest {
  type: "weather" | "crypto" | "news" | "stocks" | "wiki" | "location";
  query?: string;
  lat?: number;
  lon?: number;
  symbols?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, query, lat, lon, symbols } = await req.json() as DataRequest;
    console.log(`Realtime data request: ${type}`, { query, lat, lon, symbols });

    let data: any = null;
    let source = "";

    switch (type) {
      case "weather": {
        if (!lat || !lon) {
          throw new Error("Latitude and longitude required for weather");
        }
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherResp = await fetch(weatherUrl);
        if (!weatherResp.ok) throw new Error("Weather API failed");
        data = await weatherResp.json();
        source = "Open-Meteo";
        break;
      }

      case "crypto": {
        const coins = query || "bitcoin,ethereum";
        const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd,inr&include_24hr_change=true&include_market_cap=true`;
        const cryptoResp = await fetch(cryptoUrl);
        if (!cryptoResp.ok) throw new Error("Crypto API failed");
        data = await cryptoResp.json();
        source = "CoinGecko";
        break;
      }

      case "stocks": {
        const stockSymbols = symbols?.join(",") || "AAPL,TSLA,GOOGL";
        const stockUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${stockSymbols}`;
        const stockResp = await fetch(stockUrl, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!stockResp.ok) throw new Error("Stock API failed");
        const stockData = await stockResp.json();
        data = stockData.quoteResponse?.result || [];
        source = "Yahoo Finance";
        break;
      }

      case "wiki": {
        if (!query) throw new Error("Query required for wiki search");
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const wikiResp = await fetch(wikiUrl);
        if (!wikiResp.ok) throw new Error("Wikipedia API failed");
        data = await wikiResp.json();
        source = "Wikipedia";
        break;
      }

      case "news": {
        // Using Google News RSS (free, no API key)
        const newsQuery = query || "technology";
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(newsQuery)}&hl=en-US&gl=US&ceid=US:en`;
        const newsResp = await fetch(rssUrl);
        if (!newsResp.ok) throw new Error("News API failed");
        const rssText = await newsResp.text();
        
        // Parse RSS XML
        const items: any[] = [];
        const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
        for (const match of itemMatches) {
          const itemXml = match[1];
          const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "";
          const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
          const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
          items.push({ title, link, pubDate });
          if (items.length >= 10) break;
        }
        data = { items };
        source = "Google News RSS";
        break;
      }

      case "location": {
        if (!query) throw new Error("Query required for location search");
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
        const geoResp = await fetch(geoUrl, {
          headers: { "User-Agent": "QurobAi/1.0" }
        });
        if (!geoResp.ok) throw new Error("Location API failed");
        data = await geoResp.json();
        source = "OpenStreetMap";
        break;
      }

      default:
        throw new Error(`Unknown data type: ${type}`);
    }

    console.log(`Realtime data fetched from ${source}`);

    return new Response(
      JSON.stringify({
        success: true,
        data,
        source,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Realtime data error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});