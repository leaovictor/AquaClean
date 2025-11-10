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

    const { data: profile, error: profileError } = await userSupabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const weekStart = url.searchParams.get('weekStart');
      const weekEnd = url.searchParams.get('weekEnd');

      if (!weekStart || !weekEnd) {
        return new Response(JSON.stringify({ error: 'weekStart and weekEnd are required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const startOfDay = `${weekStart}T00:00:00.000Z`;
      const endOfDay = `${weekEnd}T23:59:59.999Z`;

      const { data, error } = await supabaseAdmin
        .from('time_slots')
        .select('*')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Transform data for the frontend
      const formattedData = data.map(slot => {
        const startTime = new Date(slot.start_time);
        return {
          id: slot.id,
          date: startTime.toISOString().split('T')[0],
          time: startTime.toTimeString().split(' ')[0].substring(0, 5),
          is_available: slot.is_available,
        };
      });

      return new Response(JSON.stringify(formattedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (req.method === 'POST') {
      const { date, time, is_available } = await req.json();
      const startTime = new Date(`${date}T${time}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1-hour slot

      const { data, error } = await supabaseAdmin
        .from('time_slots')
        .insert({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_available
        })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    if (req.method === 'PUT') {
        const { id, date, time, is_available } = await req.json();
        const startTime = new Date(`${date}T${time}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1-hour slot

        const { data, error } = await supabaseAdmin
          .from('time_slots')
          .update({
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_available
          })
          .eq('id', id)
          .select();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      const { error } = await supabaseAdmin.from('time_slots').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ message: 'Slot deleted' }), {
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
