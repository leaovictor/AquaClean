import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight request
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

    // Create an admin client to fetch time slots, bypassing RLS if necessary,
    // though a well-defined RLS policy for users to read available slots is better.
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

      const { data, error } = await supabaseAdmin
        .from('time_slots')
        .select('*')
        .eq('is_available', true)
        .gte('date', startDateParam)
        .lte('date', endDateParam)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      // Transform the data to match the expected booking format if needed.
      // The current Booking.tsx expects start_time and end_time.
      // Let's assume a fixed duration, e.g., 1 hour, to calculate end_time.
      const formattedSlots = data.map(slot => {
        const startTime = new Date(`${slot.date}T${slot.time}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        return {
          id: slot.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_available: slot.is_available,
        };
      });

      return new Response(JSON.stringify(formattedSlots), {
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
