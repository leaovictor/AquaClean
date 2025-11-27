import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabaseUserClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method !== "PUT") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const { id } = await req.json();

    // fetch previous
    const { data: before } = await supabaseUserClient.from("appointments").select("status").eq("id", id).single();

    const { data, error } = await supabaseUserClient
      .from("appointments")
      .update({ status: "canceled_by_admin", canceled_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // insert log
    await supabaseUserClient.from("appointment_logs").insert({
      appointment_id: id,
      action: "admin_cancellation",
      previous_value: JSON.stringify({ status: before?.status ?? null }),
      new_value: JSON.stringify({ status: "canceled_by_admin" }),
      admin_id: user.id
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
