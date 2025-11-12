import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Fetch the appointment and its time_slot_id, ensuring RLS is applied
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select('start_time, time_slot_id')
      .eq('id', appointment_id)
      .single();

    if (appointmentError) throw appointmentError;

    if (!appointment) {
      return new Response(JSON.stringify({ error: 'Appointment not found or not authorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Use appointment.start_time directly as it's a TIMESTAMP WITH TIME ZONE
    const appointmentDateTime = new Date(appointment.start_time);
    const now = new Date();
    const oneHour = 60 * 60 * 1000; // One hour in milliseconds

    if (appointmentDateTime.getTime() - now.getTime() < oneHour) {
      return new Response(JSON.stringify({ error: 'Appointments can only be canceled up to one hour before the scheduled time.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Update appointment status to 'canceled'
    const { data: updatedAppointment, error: updateAppointmentError } = await supabaseClient
      .from('appointments')
      .update({ status: 'canceled' })
      .eq('id', appointment_id)
      .select()
      .single();

    if (updateAppointmentError) throw updateAppointmentError;

    // Update the corresponding time slot to be available again
    const { error: updateTimeSlotError } = await supabaseClient
      .from('time_slots')
      .update({ is_available: true })
      .eq('id', appointment.time_slot_id);

    if (updateTimeSlotError) throw updateTimeSlotError;

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
