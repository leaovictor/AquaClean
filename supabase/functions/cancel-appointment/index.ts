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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('appointment_time')
      .eq('id', appointment_id)
      .single();

    if (appointmentError) throw appointmentError;

    if (!appointment) {
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const appointmentTime = new Date(appointment.appointment_time);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    if (appointmentTime.getTime() - now.getTime() < oneHour) {
      return new Response(JSON.stringify({ error: 'Appointments can only be canceled up to one hour before the scheduled time.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'canceled' })
      .eq('id', appointment_id)
      .select()
      .single();

    if (updateError) throw updateError;

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
