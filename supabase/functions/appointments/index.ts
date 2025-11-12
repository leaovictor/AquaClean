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

      // 2. Calcular o horário de término e chamar a função RPC
      const startTime = new Date(`${appointment_date}T${appointment_time}:00`);
      let durationInMinutes = 0;

      switch (service_type) {
        case 'basic':
          durationInMinutes = 20;
          break;
        case 'premium':
          durationInMinutes = 35;
          break;
        case 'deluxe':
          durationInMinutes = 60;
          break;
        default:
          return new Response(JSON.stringify({ error: `Invalid service type: ${service_type}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
      }

      const endTime = new Date(startTime.getTime() + durationInMinutes * 60000);

      const { data, error } = await supabaseAdmin.rpc(
        'create_appointment_with_check',
        {
          p_user_id: user.id,
          p_vehicle_id: vehicle_id,
          p_time_slot_id: slotId,
          p_service_type: service_type,
          p_special_instructions: special_instructions ?? null,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString(),
        }
      );

      if (error) {
        // Lida com erros a nível de RPC (ex: função não encontrada, problema de rede)
        console.error('RPC Error:', error);
        throw error;
      }

      // A função retorna um JSON. Verificamos se há um erro de aplicação dentro do JSON.
      if (data && data.error) {
        return new Response(JSON.stringify({ error: data.error }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409, // Conflict, já que o erro da função é "slot não disponível"
        });
      }

      // Se bem-sucedido, 'data' contém o novo objeto de agendamento
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