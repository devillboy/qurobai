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

    const FIREWORKS_API_KEY = Deno.env.get("FIREWORKS_API_KEY");
    
    if (!FIREWORKS_API_KEY) {
      console.error("FIREWORKS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Image generation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating image with prompt:", prompt.slice(0, 100));

    // Call Fireworks AI image generation API
    const response = await fetch(
      "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIREWORKS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          width: 1024,
          height: 1024,
          steps: 4,
          seed: Math.floor(Math.random() * 1000000),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fireworks API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate image. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the image as blob
    const imageBlob = await response.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    console.log("Image generated successfully, size:", imageBlob.size);

    // Optionally upload to Supabase storage
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const fileName = `${userId}/${Date.now()}-generated.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, imageBlob, {
            contentType: "image/png",
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
              base64: `data:image/png;base64,${base64Image}`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (uploadErr) {
        console.error("Storage upload error:", uploadErr);
      }
    }

    // Return base64 image if storage upload failed or no userId
    return new Response(
      JSON.stringify({
        success: true,
        base64: `data:image/png;base64,${base64Image}`,
      }),
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
