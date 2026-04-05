import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Image generation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating image with prompt:", prompt.slice(0, 100));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Generate an image based on this description: ${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate image. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("Lovable AI response received");

    // Extract image from the response - Gemini image models return base64 inline
    const choice = result.choices?.[0];
    const content = choice?.message?.content;

    // Check for inline_data (base64 image) in parts
    const parts = choice?.message?.parts;
    let base64Image: string | null = null;
    let mimeType = "image/png";

    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inline_data) {
          base64Image = part.inline_data.data;
          mimeType = part.inline_data.mime_type || "image/png";
          break;
        }
      }
    }

    // Also check if content itself contains a base64 image or data URI
    if (!base64Image && typeof content === "string") {
      const dataUriMatch = content.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/);
      if (dataUriMatch) {
        mimeType = dataUriMatch[1];
        base64Image = dataUriMatch[2];
      }
    }

    if (!base64Image) {
      console.error("No image data in response:", JSON.stringify(result).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No image was generated. Try a different prompt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Image extracted successfully, mime:", mimeType);

    const imageDataUri = `data:${mimeType};base64,${base64Image}`;

    // Optionally upload to Supabase storage
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const ext = mimeType.includes("png") ? "png" : "jpg";
        const fileName = `${userId}/${Date.now()}-generated.${ext}`;

        // Convert base64 to Uint8Array
        const binaryStr = atob(base64Image);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, bytes, {
            contentType: mimeType,
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("chat-attachments")
            .getPublicUrl(uploadData.path);

          console.log("Image uploaded to storage:", urlData.publicUrl);

          return new Response(
            JSON.stringify({
              success: true,
              imageUrl: urlData.publicUrl,
              base64: imageDataUri,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (uploadError) console.error("Storage upload error:", uploadError);
      } catch (uploadErr) {
        console.error("Storage upload error:", uploadErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, base64: imageDataUri }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Image generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
