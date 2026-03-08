import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check if maintenance has ended
  const { data } = await supabase
    .from("maintenance_mode")
    .select("id, is_enabled, ends_at")
    .eq("is_enabled", true)
    .limit(1)
    .maybeSingle();

  if (data?.ends_at && new Date(data.ends_at).getTime() < Date.now()) {
    await supabase
      .from("maintenance_mode")
      .update({ is_enabled: false, enabled_at: null, enabled_by: null, ends_at: null })
      .eq("id", data.id);

    return new Response(JSON.stringify({ status: "maintenance_disabled" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "no_action" }), {
    headers: { "Content-Type": "application/json" },
  });
});
