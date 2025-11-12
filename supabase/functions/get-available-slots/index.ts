import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SLOT_DURATION_MINUTES = 60; // Duration of each time slot

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { date } = await req.json(); // Expects a date in 'YYYY-MM-DD' format
    if (!date) {
      return new Response(JSON.stringify({ error: 'Date parameter is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    // Fetch availability rules for the given day of the week
    const { data: timeSlots, error: slotsError } = await supabaseAdmin
      .from('time_slots')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (slotsError) throw slotsError;

    // Fetch existing appointments for the target date
    const startDate = `${date}T00:00:00Z`;
    const endDate = `${date}T23:59:59Z`;
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('appointment_time')
      .gte('appointment_time', startDate)
      .lte('appointment_time', endDate)
      .in('status', ['scheduled', 'confirmed']); // Consider only active appointments

    if (appointmentsError) throw appointmentsError;

    const bookedTimes = new Set(
      appointments.map(a => new Date(a.appointment_time).toISOString())
    );

    const availableSlots = [];

    // Generate all possible slots and filter out the booked ones
    for (const slot of timeSlots) {
      const startTime = new Date(`${date}T${slot.start_time}`);
      const endTime = new Date(`${date}T${slot.end_time}`);

      let currentSlotTime = new Date(startTime);

      while (currentSlotTime < endTime) {
        const slotISO = currentSlotTime.toISOString();

        if (!bookedTimes.has(slotISO)) {
          availableSlots.push(slotISO);
        }

        // Move to the next slot
        currentSlotTime = new Date(currentSlotTime.getTime() + SLOT_DURATION_MINUTES * 60000);
      }
    }

    return new Response(JSON.stringify(availableSlots), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
