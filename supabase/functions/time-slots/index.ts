import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function getAllTimeSlots() {
  const slots = [];
  const now = new Date();

  // Generate slots for the past 30 days and next 7 days
  for (let i = -30; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    for (let j = 9; j <= 17; j++) {
      const time = `${j.toString().padStart(2, '0')}:00`;
      const slotId = (i * 100) + j;

      slots.push({
        id: slotId,
        date: dateString,
        time: time,
      });
    }
  }
  return slots;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('time_slot_id');

    if (appointmentsError) throw appointmentsError;

    const bookedSlotIds = appointments.map(a => a.time_slot_id);
    const allTimeSlots = getAllTimeSlots();
    const now = new Date();

    const availableTimeSlots = allTimeSlots.filter(slot => {
      const slotTime = new Date(`${slot.date}T${slot.time}:00`);
      const isBooked = bookedSlotIds.includes(slot.id);
      const isPast = slotTime < now;

      // Include the slot if it's booked (even if in the past)
      if (isBooked) {
        return true;
      }

      // Include the slot if it's in the future and not booked
      if (!isPast && !isBooked) {
        return true;
      }

      return false;
    });

    return new Response(JSON.stringify(availableTimeSlots), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
