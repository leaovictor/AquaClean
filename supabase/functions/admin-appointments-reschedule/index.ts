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

    const { id, new_start_time, new_time_slot_id } = await req.json();

    // fetch previous
    const { data: before } = await supabaseUserClient.from("appointments").select("start_time, time_slot_id").eq("id", id).single();

    const { data, error } = await supabaseUserClient
      .from("appointments")
      .update({
        start_time: new_start_time,
        time_slot_id: new_time_slot_id,
        status: "scheduled",
      })
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
      action: "reschedule",
      previous_value: JSON.stringify({ start_time: before?.start_time, time_slot_id: before?.time_slot_id }),
      new_value: JSON.stringify({ start_time: new_start_time, time_slot_id: new_time_slot_id }),
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
