import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "QurobAi <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend error: ${error}`);
  }

  return response.json();
}

interface EmailRequest {
  type: "announcement" | "subscription_approved" | "subscription_gift";
  subject?: string;
  message?: string;
  recipientEmail?: string;
  recipientName?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, subject, message, recipientEmail, recipientName }: EmailRequest = await req.json();
    
    console.log("Email request:", { type, subject, recipientEmail });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const emailTemplate = (title: string, content: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fafafa; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; }
          .content { background: #111; border: 1px solid #222; border-radius: 12px; padding: 30px; }
          .button { display: inline-block; background: #fafafa; color: #0a0a0a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✨ QurobAi</div>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">${title}</h2>
            ${content}
          </div>
          <div class="footer">
            <p>QurobAi - Your AI Companion</p>
            <p>Created by Soham from India 🇮🇳</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (type === "announcement" && subject && message) {
      // Get all user emails from auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching users:", authError);
        throw authError;
      }

      const emails = authData.users
        .filter(u => u.email)
        .map(u => u.email!);

      console.log(`Sending announcement to ${emails.length} users`);

      // Send emails in batches
      const batchSize = 10;
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        await sendEmail(batch, subject, emailTemplate(subject, `<div>${message}</div>`));
      }

      return new Response(
        JSON.stringify({ success: true, sent: emails.length }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (type === "subscription_approved" && recipientEmail) {
      const content = `
        <p>Hi ${recipientName || "there"},</p>
        <p>Great news! Your payment has been approved and your subscription is now active.</p>
        <p>You now have access to all premium features including advanced AI responses, better reasoning, and priority support.</p>
        <p style="margin-top: 30px;">
          <a href="https://qurobai.com" class="button">Start Chatting</a>
        </p>
      `;

      await sendEmail([recipientEmail], "Your QurobAi Subscription is Active! 🎉", emailTemplate("Your Subscription is Active!", content));

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (type === "subscription_gift" && recipientEmail) {
      const content = `
        <p>Hi ${recipientName || "there"},</p>
        <p>Someone has gifted you a QurobAi premium subscription!</p>
        <p>Your account now has access to all premium features. Enjoy!</p>
        <p style="margin-top: 30px;">
          <a href="https://qurobai.com" class="button">Start Chatting</a>
        </p>
      `;

      await sendEmail([recipientEmail], "You've Been Gifted a QurobAi Subscription! 🎁", emailTemplate("You've Been Gifted a Subscription!", content));

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid email type or missing parameters" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
