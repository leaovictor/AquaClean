import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*, vehicles(make, model, year, color)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (req.method === 'POST') {
      // Recebe todos os campos
      const body = await req.json();
      const { vehicle_id, time_slot_id, appointment_date, appointment_time, service_type, special_instructions } = body;

      // PARSING ROBUSTO: time_slot_id é um número (bigint).
      const slotId = Number(time_slot_id);

      // Verifica campos obrigatórios de forma mais explícita:
      if (!vehicle_id || typeof slotId !== 'number' || isNaN(slotId) || !appointment_date || !appointment_time || !service_type) {
        console.error('Missing fields in payload:', { vehicle_id, slotId, appointment_date, appointment_time, service_type });
        return new Response(JSON.stringify({ error: 'Missing required fields or invalid ID format.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      
      // 1. Verificar propriedade do veículo (essencial)
      const { count: vehicleCount, error: vehicleError } = await supabaseAdmin
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('id', vehicle_id)
        .eq('user_id', user.id);

      if (vehicleError || vehicleCount === 0) {
        return new Response(JSON.stringify({ error: 'Vehicle not found or does not belong to the user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      // 2. Inserir o agendamento diretamente
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .insert({
          user_id: user.id,
          vehicle_id,
          time_slot_id: slotId, // Usando o número parseado
          appointment_date, // DATE (ex: 2025-11-12)
          appointment_time, // TIME (ex: 19:00:00)
          // Combina data e hora para criar os timestamps completos (TIMESTAMPTZ)
          start_time: `${appointment_date}T${appointment_time}:00Z`, 
          end_time: `${appointment_date}T${appointment_time}:00Z`, 
          service_type,
          special_instructions: special_instructions ?? null,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation (concorrência ou chave duplicada)
          return new Response(JSON.stringify({ error: 'This time slot is no longer available.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409, // Conflict
          });
        }
        // Se a FK falhar novamente (time_slot_id), o erro será capturado aqui
        console.error('Database Insertion Error:', error);
        throw error;
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  } catch (error) {
    console.error('Final Internal Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});