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
    const { prompt, userId, model } = await req.json();

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

    // Private QurobAi image routing. Keep upstream labels out of responses and logs.
    const fwEndpoint = model === "sd3"
      ? "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/stable-diffusion-3-medium/text_to_image"
      : "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image";

    console.log("Generating image via QurobAi renderer:", prompt.slice(0, 100));

    const response = await fetch(fwEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIREWORKS_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "image/png",
      },
      body: JSON.stringify({
        prompt,
        width: 1024,
        height: 1024,
        steps: model === "sd3" ? 30 : 4,
        seed: Math.floor(Math.random() * 1000000),
        guidance_scale: 3.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("QurobAi image renderer error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Image generation rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Failed to generate image. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const imgBuf = new Uint8Array(await response.arrayBuffer());
    const mimeType = "image/png";
    // base64 encode in chunks to avoid call-stack issues for large arrays
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < imgBuf.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(imgBuf.subarray(i, i + chunk)) as any);
    }
    const base64Image = btoa(binary);
    console.log("QurobAi image bytes:", imgBuf.length);

    const imageDataUri = `data:${mimeType};base64,${base64Image}`;

    // Optionally upload to Supabase storage
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const fileName = `${userId}/${Date.now()}-generated.png`;
        const bytes = imgBuf;

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
