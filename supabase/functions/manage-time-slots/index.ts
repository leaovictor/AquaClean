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

    // Check if the user is an admin
    const { data: profile, error: profileError } = await userSupabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      });
    }

    // Create an admin client to bypass RLS for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle GET request to fetch all time slots
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const dateFilter = url.searchParams.get('date');
      const weekStartFilter = url.searchParams.get('weekStart');
      const weekEndFilter = url.searchParams.get('weekEnd');

      let query = supabaseAdmin
        .from('time_slots')
        .select('*');
      
      if (dateFilter) {
        query = query.eq('date', dateFilter);
      } else if (weekStartFilter && weekEndFilter) {
        query = query.gte('date', weekStartFilter).lte('date', weekEndFilter);
      }

      const { data: timeSlots, error } = await query
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify(timeSlots), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle POST request to create new time slots
    if (req.method === 'POST') {
      const { date, time, is_available } = await req.json();

      const { data, error } = await supabaseAdmin
        .from('time_slots')
        .insert({ date, time, is_available })
        .select();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201, // Created
      });
    }

    // Handle PUT request to update a time slot
    if (req.method === 'PUT') {
      const { id, date, time, is_available } = await req.json();

      const { data, error } = await supabaseAdmin
        .from('time_slots')
        .update({ date, time, is_available })
        .eq('id', id)
        .select();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle DELETE request to delete a time slot
    if (req.method === 'DELETE') {
      const { id } = await req.json();

      const { error } = await supabaseAdmin
        .from('time_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ message: 'Time slot deleted successfully' }), {
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
