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
      const { vehicle_id, time_slot_id, start_time_utc, service_type, special_instructions, products } = body;

      // PARSING ROBUSTO: time_slot_id é um número (bigint).
      const slotId = Number(time_slot_id);

      // Verifica campos obrigatórios de forma mais explícita:
      if (!vehicle_id || typeof slotId !== 'number' || isNaN(slotId) || !start_time_utc || !service_type) {
        console.error('Missing fields in payload:', { vehicle_id, slotId, start_time_utc, service_type });
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

      // 2. Buscar detalhes do serviço (Preço e Duração)
      // service_type agora é o ID do serviço (UUID ou Inteiro, dependendo da sua tabela services)
      // Assumindo que services.id é um inteiro ou UUID. Se for string 'basic', 'premium', etc, precisa ajustar a query.
      // Se service_type for o ID da tabela services:
      const { data: serviceData, error: serviceError } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('id', service_type)
        .single();

      if (serviceError || !serviceData) {
        return new Response(JSON.stringify({ error: 'Service not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      // 3. Buscar detalhes dos produtos selecionados
      let productsData: any[] = [];
      let productsPrice = 0;

      if (products && Array.isArray(products) && products.length > 0) {
        const { data: pData, error: pError } = await supabaseAdmin
          .from('products')
          .select('*')
          .in('id', products); // products deve ser array de IDs

        if (pError) {
          console.error('Error fetching products:', pError);
          // Não falha o agendamento, mas ignora produtos? Ou falha? Melhor falhar.
          return new Response(JSON.stringify({ error: 'Error fetching products' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        productsData = pData || [];
        productsPrice = productsData.reduce((sum, p) => sum + Number(p.price), 0);
      }

      // 4. Verificar status de assinatura do usuário
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

      const isSubscriber = profileData?.subscription_status === 'active';

      // 5. Calcular Preço Total
      // Se for assinante, o preço do serviço é 0.
      const servicePrice = isSubscriber ? 0 : Number(serviceData.price);
      const totalPrice = servicePrice + productsPrice;

      // 6. Calcular horário de término
      const startTime = new Date(start_time_utc);
      const durationInMinutes = Number(serviceData.duration_minutes);
      const endTime = new Date(startTime.getTime() + durationInMinutes * 60000);

      // 7. Chamar RPC para criar agendamento
      const { data, error } = await supabaseAdmin.rpc(
        'create_appointment_with_check',
        {
          p_user_id: user.id,
          p_vehicle_id: vehicle_id,
          p_time_slot_id: slotId,
          p_service_type: serviceData.name, // Armazena o nome do serviço para histórico
          p_special_instructions: special_instructions ?? null,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString(),
          p_products: productsData, // Passa o JSON dos produtos
          p_total_price: totalPrice
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
  } catch (error: any) {
    console.error('Final Internal Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});