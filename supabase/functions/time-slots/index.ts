import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Helper function to get dates between two dates
function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's auth context
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the token
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    // Create an admin client to bypass RLS for database operations (if needed, but for time slots, RLS should be fine)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle GET request to fetch available time slots
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const startDateParam = url.searchParams.get('start_date');
      const endDateParam = url.searchParams.get('end_date');

      if (!startDateParam || !endDateParam) {
        return new Response(JSON.stringify({ error: 'start_date and end_date are required query parameters.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return new Response(JSON.stringify({ error: 'Invalid date format for start_date or end_date.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // 1. Fetch recurring time slot rules
      const { data: timeSlotRules, error: rulesError } = await supabaseAdmin
        .from('time_slots')
        .select('day_of_week, start_time, end_time')
        .eq('is_available', true);

      if (rulesError) throw rulesError;

      // 2. Fetch existing appointments within the date range
      const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select('start_time, end_time')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (appointmentsError) throw appointmentsError;

      const availableSlots: { start_time: string; end_time: string }[] = [];
      const datesToGenerate = getDatesBetween(startDate, endDate);

      datesToGenerate.forEach(date => {
        const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6

        timeSlotRules.forEach(rule => {
          // Supabase stores day_of_week as 1-7 (Monday-Sunday), JS getDay() is 0-6 (Sunday-Saturday)
          // Adjust rule.day_of_week to match JS getDay()
          const ruleDayOfWeek = rule.day_of_week === 7 ? 0 : rule.day_of_week; // Convert Sunday (7) to 0

          if (ruleDayOfWeek === dayOfWeek) {
            const slotStart = new Date(date);
            const [startHour, startMinute, startSecond] = rule.start_time.split(':').map(Number);
            slotStart.setHours(startHour, startMinute, startSecond, 0);

            const slotEnd = new Date(date);
            const [endHour, endMinute, endSecond] = rule.end_time.split(':').map(Number);
            slotEnd.setHours(endHour, endMinute, endSecond, 0);

            // Check for conflicts with existing appointments
            const isBooked = appointments.some(appointment => {
              const apptStart = new Date(appointment.start_time);
              const apptEnd = new Date(appointment.end_time);

              // Check for overlap:
              // (slotStart < apptEnd) && (slotEnd > apptStart)
              return (slotStart < apptEnd && slotEnd > apptStart);
            });

            if (!isBooked) {
              availableSlots.push({
                start_time: slotStart.toISOString(),
                end_time: slotEnd.toISOString(),
              });
            }
          }
        });
      });

      return new Response(JSON.stringify(availableSlots), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle other methods
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
