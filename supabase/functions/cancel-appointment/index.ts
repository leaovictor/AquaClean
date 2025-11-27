import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { appointment_id } = await req.json();
    if (!appointment_id) {
      return new Response(JSON.stringify({ error: 'appointment_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create a Supabase client with the user's token for RLS
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch the appointment and its time_slot_id, ensuring RLS is applied
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select('start_time, time_slot_id, confirmed_at, status')
      .eq('id', appointment_id)
      .single();

    if (appointmentError) throw appointmentError;

    if (!appointment) {
      return new Response(JSON.stringify({ error: 'Appointment not found or not authorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // If the appointment is confirmed, check the one-hour rule
    if (appointment.confirmed_at) {
      const appointmentDateTime = new Date(appointment.start_time);
      const now = new Date();
      const oneHour = 60 * 60 * 1000; // One hour in milliseconds

      if (appointmentDateTime.getTime() - now.getTime() < oneHour) {
        return new Response(JSON.stringify({ error: 'Confirmed appointments can only be canceled up to one hour before the scheduled time.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    }

    // Update appointment status to 'canceled_by_customer' and set the cancellation timestamp
    const { data: updatedAppointment, error: updateAppointmentError } = await supabaseClient
      .from('appointments')
      .update({ status: 'canceled_by_customer', canceled_at: new Date().toISOString() })
      .eq('id', appointment_id)
      .select()
      .single();

    if (updateAppointmentError) throw updateAppointmentError;
    
    // insert log
    await supabaseClient.from("appointment_logs").insert({
      appointment_id: appointment_id,
      action: "customer_cancellation",
      previous_value: JSON.stringify({ status: appointment.status }),
      new_value: JSON.stringify({ status: "canceled_by_customer" }),
      user_id: user.id
    });

    return new Response(JSON.stringify(updatedAppointment), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
