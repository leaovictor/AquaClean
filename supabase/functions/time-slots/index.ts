import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const dates = [];
  let currentDate = new Date(startDate.toISOString().split('T')[0]);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError || !user) throw new Error("User not found");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const startDateParam = url.searchParams.get('start_date');
      const endDateParam = url.searchParams.get('end_date');

      if (!startDateParam || !endDateParam) {
        return new Response(JSON.stringify({ error: 'start_date and end_date are required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      const { data: timeSlotRules, error: rulesError } = await supabaseAdmin
        .from('time_slots')
        .select('day_of_week, start_time, end_time')
        .eq('is_available', true);

      if (rulesError) throw rulesError;

      const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select('start_time, end_time')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (appointmentsError) throw appointmentsError;

      const availableSlots: { start_time: string; end_time: string }[] = [];
      const datesToGenerate = getDatesBetween(startDate, endDate);

      datesToGenerate.forEach(date => {
        const dayOfWeekJS = date.getDay(); // Sunday is 0, Monday is 1...
        const dayOfWeekDB = dayOfWeekJS === 0 ? 7 : dayOfWeekJS; // DB is Monday 1 ... Sunday 7

        timeSlotRules.forEach(rule => {
          if (rule.day_of_week === dayOfWeekDB) {
            const [startHour, startMinute] = rule.start_time.split(':').map(Number);
            const [endHour, endMinute] = rule.end_time.split(':').map(Number);

            let currentSlotStart = new Date(date);
            currentSlotStart.setUTCHours(startHour, startMinute, 0, 0);

            const endSlot = new Date(date);
            endSlot.setUTCHours(endHour, endMinute, 0, 0);

            while (currentSlotStart < endSlot) {
              const currentSlotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000); // 1 hour slots

              const isBooked = appointments.some(appt => {
                const apptStart = new Date(appt.start_time);
                const apptEnd = new Date(appt.end_time);
                return (currentSlotStart < apptEnd && currentSlotEnd > apptStart);
              });

              if (!isBooked) {
                availableSlots.push({
                  start_time: currentSlotStart.toISOString(),
                  end_time: currentSlotEnd.toISOString(),
                });
              }
              currentSlotStart = currentSlotEnd;
            }
          }
        });
      });

      return new Response(JSON.stringify(availableSlots), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
