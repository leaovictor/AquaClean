import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SLOT_DURATION_MINUTES = 60;
const DAYS_TO_GENERATE = 7;

interface TimeSlotRule {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch all active time slot rules
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('time_slots')
      .select('id, day_of_week, start_time, end_time');

    if (rulesError) throw rulesError;

    // 2. Fetch all scheduled appointments for the next `DAYS_TO_GENERATE` days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startDate = today.toISOString();

    const futureDate = new Date(today);
    futureDate.setUTCDate(today.getUTCDate() + DAYS_TO_GENERATE);
    const endDate = futureDate.toISOString();

    console.log('Fetching appointments from:', startDate, 'to:', endDate);

    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('start_time')
      .gte('start_time', startDate)
      .lt('start_time', endDate)
      .in('status', ['scheduled', 'confirmed']);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    console.log('Fetched appointments:', appointments);

    const bookedTimes = new Set(
      appointments.map((a) => new Date(a.start_time).toISOString())
    );

    // 3. Generate all possible slots and filter out booked ones
    const availableSlots: { id: number; date: string; time: string }[] = [];

    for (let i = 0; i < DAYS_TO_GENERATE; i++) {
      const currentDate = new Date(today);
      currentDate.setUTCDate(today.getUTCDate() + i);
      const dayOfWeek = currentDate.getUTCDay();
      const dateString = currentDate.toISOString().split('T')[0];

      const rulesForDay = rules.filter((r: TimeSlotRule) => r.day_of_week === dayOfWeek);

      for (const rule of rulesForDay) {
        const startTime = new Date(`${dateString}T${rule.start_time}`);
        const endTime = new Date(`${dateString}T${rule.end_time}`);
        let currentSlotTime = new Date(`${dateString}T${rule.start_time}`);
        const now = new Date(); // Get current time inside the loop for accurate comparison

        // Adjust currentSlotTime to be at least 'now' if it's for today
        if (currentDate.toDateString() === now.toDateString()) {
          if (currentSlotTime < now) {
            // If the rule's start time is in the past for today,
            // start generating slots from the next available slot after 'now'
            const nextHour = new Date(now.getTime() + SLOT_DURATION_MINUTES * 60000);
            nextHour.setMinutes(0); // Round to the next hour
            if (currentSlotTime < nextHour) {
              currentSlotTime = nextHour;
            }
          }
        }

        while (currentSlotTime < endTime) {
          const slotISO = currentSlotTime.toISOString();
          if (!bookedTimes.has(slotISO)) {
            availableSlots.push({
              id: rule.id, // Use the ID from the time_slots table rule
              date: dateString,
              time: currentSlotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            });
          }
          currentSlotTime = new Date(currentSlotTime.getTime() + SLOT_DURATION_MINUTES * 60000);
        }
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
