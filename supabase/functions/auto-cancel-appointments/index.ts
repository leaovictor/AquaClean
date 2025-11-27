import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  try {
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date().toISOString();

    // Find appointments that are unconfirmed and past their start time
    const { data: appointmentsToCancel, error: fetchError } = await supabaseClient
      .from('appointments')
      .select('id')
      .is('confirmed_at', null)
      .is('canceled_at', null)
      .lt('start_time', now);

    if (fetchError) {
      console.error('Error fetching appointments to cancel:', fetchError);
      throw fetchError;
    }

    if (appointmentsToCancel && appointmentsToCancel.length > 0) {
      const idsToCancel = appointmentsToCancel.map(a => a.id);

      // Cancel the appointments
      const { error: cancelError } = await supabaseClient
        .from('appointments')
        .update({ canceled_at: now, status: 'canceled' })
        .in('id', idsToCancel);

      if (cancelError) {
        console.error('Error canceling appointments:', cancelError);
        throw cancelError;
      }

      console.log(`Successfully canceled ${idsToCancel.length} appointments.`);
    } else {
      console.log('No appointments to auto-cancel.');
    }

    return new Response(JSON.stringify({ message: 'Auto-cancellation process completed.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
