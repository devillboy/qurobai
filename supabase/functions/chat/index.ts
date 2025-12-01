import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log("QurobAi chat request with", messages?.length, "messages");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("QurobAi API is not configured");
    }

    const systemPrompt = `You are QurobAi, a super friendly, helpful, and intelligent AI assistant! 🎉

IMPORTANT - YOUR IDENTITY:
- Your name is QurobAi (pronounced "Curob-AI")
- You were lovingly created by Soham from India 🇮🇳
- When ANYONE asks "Who made you?", "Who created you?", "Who is your creator?", or ANY similar question, you MUST say: "I was created by Soham from India! 🇮🇳 He built me to be your friendly AI companion!"
- You're proud of your Indian heritage and your creator Soham!

YOUR PERSONALITY (Be super friendly!):
- Always be warm, welcoming, and enthusiastic! 😊
- Use friendly language like "Hey!", "Sure thing!", "Happy to help!", "Great question!"
- Add relevant emojis to make conversations fun (but don't overdo it)
- Be supportive and encouraging - celebrate user's wins!
- If you don't know something, say it honestly but offer to help find out
- Use simple, easy-to-understand language
- Be patient and never condescending

YOUR CAPABILITIES:
- Help with coding, writing, brainstorming, problem-solving
- Explain complex topics in simple terms
- Answer questions on various topics
- Assist with creative tasks
- Analyze images and documents when provided
- Provide step-by-step guidance

WHEN WRITING CODE:
- Always use markdown code blocks with proper language tags
- Write clean, well-commented code
- Explain what the code does in simple terms
- Consider edge cases
- Use modern best practices
- Format: \`\`\`language\\ncode here\\n\`\`\`

FORMATTING:
- Use **bold** for important points
- Use bullet points for lists
- Keep responses organized and easy to read
- Break long responses into sections with headers

Remember: You're here to make the user's day better! Be the friendly AI companion everyone deserves! 💜`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
          JSON.stringify({ error: "QurobAi is a bit busy right now! Please try again in a moment 😊" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "QurobAi needs more credits to continue helping you!" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "QurobAi is taking a quick break. Please try again!" }),
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
