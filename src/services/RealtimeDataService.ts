const REALTIME_DATA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-data`;

export interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weathercode: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

export interface CryptoData {
  [coin: string]: {
    usd: number;
    inr: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
  };
}

export interface StockData {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

export interface WikiData {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop: { page: string } };
}

export interface LocationData {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

class RealtimeDataService {
  private async fetch<T>(body: Record<string, any>): Promise<{ success: boolean; data?: T; source?: string; error?: string }> {
    try {
      const response = await fetch(REALTIME_DATA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getWeather(lat: number, lon: number): Promise<{ success: boolean; data?: WeatherData; source?: string; error?: string }> {
    return this.fetch<WeatherData>({ type: "weather", lat, lon });
  }

  async getCrypto(coins = "bitcoin,ethereum"): Promise<{ success: boolean; data?: CryptoData; source?: string; error?: string }> {
    return this.fetch<CryptoData>({ type: "crypto", query: coins });
  }

  async getStocks(symbols: string[]): Promise<{ success: boolean; data?: StockData[]; source?: string; error?: string }> {
    return this.fetch<StockData[]>({ type: "stocks", symbols });
  }

  async getNews(query = "technology"): Promise<{ success: boolean; data?: { items: NewsItem[] }; source?: string; error?: string }> {
    return this.fetch<{ items: NewsItem[] }>({ type: "news", query });
  }

  async getWiki(query: string): Promise<{ success: boolean; data?: WikiData; source?: string; error?: string }> {
    return this.fetch<WikiData>({ type: "wiki", query });
  }

  async getLocation(query: string): Promise<{ success: boolean; data?: LocationData[]; source?: string; error?: string }> {
    return this.fetch<LocationData[]>({ type: "location", query });
  }

  // Weather code to description
  getWeatherDescription(code: number): string {
    const descriptions: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    };
    return descriptions[code] || "Unknown";
  }
}

export const realtimeDataService = new RealtimeDataService();