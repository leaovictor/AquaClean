// supabase/functions/admin-appointments-update/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: req.headers.get("Authorization")! } } });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    const { data: profile } = await supabaseClient.from("profiles").select("role").eq("id", userData.user.id).single();
    if (profile?.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });

    if (req.method !== "PUT") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }


    const body = await req.json().catch(() => null);
    if (!body?.id || !body?.status) return new Response(JSON.stringify({ error: "Missing id or status" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });

    const { id, status } = body;

    // fetch previous
    const { data: before } = await supabaseClient.from("appointments").select("status").eq("id", id).single();

    const { data: updated, error } = await supabaseClient.from("appointments").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });

    // insert log
    await supabaseClient.from("appointment_logs").insert({
      appointment_id: id,
      action: "status_update",
      previous_value: JSON.stringify({ status: before?.status ?? null }),
      new_value: JSON.stringify({ status }),
      admin_id: userData.user.id
    });

    // Trigger Notification
    const { data: appointmentData } = await supabaseClient
      .from("appointments")
      .select("user_id, service_type, start_time")
      .eq("id", id)
      .single();

    if (appointmentData?.user_id) {
      let title = "";
      let message = "";

      switch (status) {
        case "confirmed":
          title = "Agendamento Confirmado";
          message = `Seu agendamento de ${appointmentData.service_type} foi confirmado para ${new Date(appointmentData.start_time).toLocaleDateString('pt-BR')}.`;
          break;
        case "in_progress":
          title = "Lavagem Iniciada";
          message = `Seu veículo começou a ser lavado. Avisaremos quando estiver pronto!`;
          break;
        case "ready_for_pickup":
          title = "Pronto para Retirada";
          message = `Seu veículo está pronto! Pode vir buscá-lo.`;
          break;
        case "completed":
          title = "Serviço Finalizado";
          message = `Obrigado por lavar conosco! Esperamos vê-lo novamente em breve.`;
          break;
        case "canceled_by_admin":
          title = "Agendamento Cancelado";
          message = `Seu agendamento foi cancelado pelo estabelecimento. Entre em contato para mais detalhes.`;
          break;
      }

      if (title && message) {
        await supabaseClient.from("notifications").insert({
          user_id: appointmentData.user_id,
          title,
          message,
          type: "status_update"
        });
      }
    }

    return new Response(JSON.stringify(updated), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err) {
    console.error('Error in catch block:', err);
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
