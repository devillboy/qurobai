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
When users ask for real-time information (weather, news, crypto, stocks, etc.), acknowledge that you can provide general knowledge but real-time data requires external API integration. Offer to help implement such features if they're building an application.
${customInstructions ? `\nUSER'S CUSTOM INSTRUCTIONS:\n${customInstructions}` : ""}`;

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