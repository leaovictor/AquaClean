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

    // Create an admin client to bypass RLS for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle GET request to fetch appointments
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } 
    
    // Handle POST request to create a new appointment
    if (req.method === 'POST') {
      const { vehicle_id, start_time, end_time, service_type, special_instructions } = await req.json();

      // Basic validation for required fields
      if (!vehicle_id || !start_time || !end_time || !service_type) {
        return new Response(JSON.stringify({ error: 'Missing required fields: vehicle_id, start_time, end_time, and service_type are required.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Check for overlapping appointments
      const { count: conflictingAppointments, error: conflictError } = await supabaseAdmin
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('status', 'scheduled') // Only consider scheduled appointments for conflicts
        .or(`and(start_time.lt.${end_time},end_time.gt.${start_time})`); // Check for overlap

      if (conflictError) throw conflictError;
      if (conflictingAppointments && conflictingAppointments > 0) {
        return new Response(JSON.stringify({ error: 'The selected time slot is already booked.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409, // Conflict
        });
      }

      // Insert the new appointment
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .insert({
          user_id: user.id,
          vehicle_id,
          start_time,
          end_time,
          service_type,
          special_instructions,
          status: 'scheduled', // Default status
        })
        .select()
        .single(); // Expect a single result

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201, // Created
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
