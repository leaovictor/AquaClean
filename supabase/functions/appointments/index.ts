import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Este Edge Function lida com a criação e listagem de agendamentos.

serve(async (req) => {
  // 1. Tratamento de CORS OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Define o objeto de erro no escopo para facilitar o tratamento
  let errorResponse = new Response(JSON.stringify({ error: 'Internal Server Error' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 500,
  });

  try {
    console.log('Appointments function invoked');
    const authHeader = req.headers.get('Authorization');

    // --- 2. Autenticação do Usuário ---
    
    if (!authHeader) {
      errorResponse = new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
      throw new Error("Missing authorization header");
    }

    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    )

    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    
    if (userError) {
      console.error('Authentication Error:', userError.message);
      errorResponse = new Response(JSON.stringify({ error: userError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
      throw userError;
    }
    if (!user) {
      throw new Error("User not found after successful token validation");
    }

    console.log('Authenticated User ID:', user.id);

    // --- 3. Cliente Admin para Operações de Banco de Dados ---
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) {
       console.error('SUPABASE_SERVICE_ROLE_KEY is not loaded!');
       throw new Error("Service Role Key is not configured.");
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey 
    );

    // --- 4. Lógica GET (Buscar Agendamentos do Usuário) ---
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select(`
          *,
          vehicles(make, model, year, color)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: true }); // Ordena por data/hora

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- 5. Lógica POST (Criar Novo Agendamento via RPC) ---
    if (req.method === 'POST') {
      const body = await req.json();
      const { vehicle_id, time_slot_id, appointment_date, appointment_time, service_type, special_instructions } = body;

      // Validação de campos obrigatórios (Retorna 400 se faltar algo)
      if (!vehicle_id || !time_slot_id || !appointment_date || !appointment_time || !service_type) {
        errorResponse = new Response(JSON.stringify({ error: 'Missing required fields' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
        throw new Error("Missing required fields");
      }

      // Conversão/Validação de Tipo para garantir que time_slot_id é um número
      // NOTA: O ERRO DE FK ESTAVA AQUI. O slotId deve ser o ID REAL (bigint) do slot,
      // e não um timestamp.
      const slotId = Number(time_slot_id);
      if (isNaN(slotId)) {
        errorResponse = new Response(JSON.stringify({ error: 'Invalid time_slot_id format' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
        throw new Error("Invalid time_slot_id format");
      }

      // 5.1. Checagem de propriedade do Veículo (usando client admin)
      const { count: vehicleCount, error: vehicleError } = await supabaseAdmin
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('id', vehicle_id)
        .eq('user_id', user.id);

      if (vehicleError) throw vehicleError;
      if (vehicleCount === 0) {
        errorResponse = new Response(JSON.stringify({ error: 'Vehicle not found or does not belong to the user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
        throw new Error("Vehicle not found or does not belong to the user");
      }

      // 5.2. Chamar a função de banco de dados para criar o agendamento
      // A função SQL 'create_appointment_with_check' faz a checagem de concorrência.
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
        'create_appointment_with_check',
        {
          p_user_id: user.id,
          p_vehicle_id: vehicle_id,
          p_time_slot_id: slotId,
          p_service_type: service_type,
          p_special_instructions: special_instructions ?? null,
          p_appointment_date: appointment_date,
          p_appointment_time: appointment_time,
        }
      );

      if (rpcError) {
        console.error('RPC Error details:', JSON.stringify(rpcError, null, 2));
        throw rpcError;
      }

      // 5.3. Processar resposta da função SQL
      if (rpcData && rpcData.error) {
        // Erro de concorrência/slot cheio vindo do SQL
        return new Response(JSON.stringify({ error: rpcData.error }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409, // Conflict
        });
      }

      // Sucesso na criação do agendamento
      return new Response(JSON.stringify(rpcData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201, // Created
      });
    }
    
    // --- 6. Método Não Permitido ---
    errorResponse = new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
    throw new Error("Method Not Allowed");


  } catch (error) {
    // --- 7. Tratamento de Erro Genérico Final ---
    // Retorna o Response de erro mais específico que foi definido antes da falha.
    // Se o erro for um erro inesperado do servidor (Service Key, etc.), retorna 500.
    
    // Log detalhado do erro
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error('Final Edge Function Error:', errorMessage);

    // Se o erro não foi um erro de cliente (4xx) tratado, retorna 500
    if (errorResponse.status >= 500 || errorResponse.status < 400) {
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    // Retorna o Response 4xx capturado (401, 400, 404)
    return errorResponse; 
  }
})