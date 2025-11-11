import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    if (req.method === 'POST') {
      const { vehicle_id, appointment_time, service_type, special_instructions } = await req.json();

      if (!vehicle_id || !appointment_time || !service_type) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const targetDate = new Date(appointment_time);

      const { count: vehicleCount, error: vehicleError } = await supabaseAdmin
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('id', vehicle_id)
        .eq('user_id', user.id);

      if (vehicleError) throw vehicleError;
      if (vehicleCount === 0) {
        return new Response(JSON.stringify({ error: 'Vehicle not found or does not belong to the user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      const { count: existingAppointment, error: existingError } = await supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_time', targetDate.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      if (existingError) throw existingError;
      if (existingAppointment > 0) {
        return new Response(JSON.stringify({ error: 'The selected time slot is no longer available' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409, // 409 Conflict
        });
      }

      const { data: appointment, error: insertError } = await supabaseAdmin
        .from('appointments')
        .insert({
          user_id: user.id,
          vehicle_id,
          appointment_time: targetDate.toISOString(),
          service_type,
          special_instructions,
          status: 'scheduled',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify(appointment), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }
    
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
