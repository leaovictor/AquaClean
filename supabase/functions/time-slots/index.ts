import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AvailabilityRule {
  id: number;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // "HH:mm"
  end_time: string; // "HH:mm"
  is_available: boolean;
}

function generateTimeSlots(rules: AvailabilityRule[], daysToGenerate: number): { id: number; date: string; time: string }[] {
  console.log('Generating time slots with rules:', rules);
  const generatedSlots: { id: number; date: string; time: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    const dateString = date.toISOString().split('T')[0];

    const rulesForDay = rules.filter(rule => rule.day_of_week === dayOfWeek && rule.is_available);

    for (const rule of rulesForDay) {
      try {
        const startHour = parseInt(rule.start_time.split(':')[0]);
        const endHour = parseInt(rule.end_time.split(':')[0]);

        if (isNaN(startHour) || isNaN(endHour)) {
          console.error('Invalid time format for rule:', rule);
          continue;
        }

        for (let hour = startHour; hour < endHour; hour++) {
          const time = `${hour.toString().padStart(2, '0')}:00`;
          
          const pseudoId = date.getTime() + hour;

          generatedSlots.push({
            id: pseudoId,
            date: dateString,
            time: time,
          });
        }
      } catch (e) {
        console.error('Error processing rule:', rule, e);
      }
    }
  }
  console.log('Generated slots:', generatedSlots.length);
  return generatedSlots;
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('time-slots function invoked');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('Unauthorized access attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    console.log('Fetching availability rules for user:', user.id);
    const { data: availabilityRules, error } = await supabase
      .from('time_slots')
      .select('id, day_of_week, start_time, end_time, is_available');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Fetched availability rules:', availabilityRules);

    const generatedSlots = generateTimeSlots(availabilityRules || [], 7);

    return new Response(JSON.stringify(generatedSlots), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Caught error in time-slots function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})