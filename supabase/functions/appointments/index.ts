import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

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
      const { vehicle_id, time_slot_id, start_time_utc, service_type, special_instructions, products, appointment_id } = body;

      // --- RETRY PAYMENT LOGIC ---
      if (appointment_id) {
        console.log(`Retry Payment Request for Appointment ID: ${appointment_id}, User ID: ${user.id}`);

        // 1. Fetch existing appointment
        // Removed services(*) as it might cause error if no FK exists.
        const { data: appointment, error: fetchError } = await supabaseAdmin
          .from('appointments')
          .select('*, vehicles(make, model)')
          .eq('id', appointment_id)
          .eq('user_id', user.id) // Security check
          .single();

        if (fetchError || !appointment) {
          console.error('Fetch Error:', fetchError);
          return new Response(JSON.stringify({ error: 'Appointment not found or unauthorized.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          });
        }

        if (appointment.status !== 'pending_payment') {
          return new Response(JSON.stringify({ error: 'Appointment is not pending payment.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        // 2. Create Stripe Checkout Session (Re-using logic)
        // We need service name and price. 
        // Note: The original appointment might not have service details expanded if we didn't join correctly or if structure changed.
        // But we selected `services(*)` above.

        // Fallback for service name if relation is tricky (depends on DB schema, assuming service_type stores name or we have relation)
        // Actually, in the main logic, service_type is used to fetch service. 
        // Let's assume appointment.service_type is the NAME (text) as per DB schema, 
        // BUT we need price. 
        // If `services` relation works, `appointment.services` will have data.
        // Let's check if we need to fetch service manually.

        let serviceName = appointment.service_type;
        let servicePrice = 0; // We use total_price from appointment usually?

        // Better: Use appointment.total_price directly!
        const totalPrice = Number(appointment.total_price);

        const session = await stripe.checkout.sessions.create({
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: 'brl',
                product_data: {
                  name: `Agendamento: ${serviceName}`,
                  description: `Veículo: ${appointment.vehicles?.make} ${appointment.vehicles?.model} - ${new Date(appointment.start_time).toLocaleString('pt-BR')}`,
                },
                unit_amount: Math.round(totalPrice * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${req.headers.get('origin')}/dashboard?payment_success=true`,
          cancel_url: `${req.headers.get('origin')}/dashboard`, // Return to dashboard on cancel
          client_reference_id: String(appointment.id),
          metadata: {
            user_id: user.id,
            appointment_id: String(appointment.id),
            type: 'appointment_payment'
          },
        });

        return new Response(JSON.stringify({ checkoutUrl: session.url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      // --- END RETRY PAYMENT LOGIC ---



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

      // 1.1 Check for active appointments if vehicle is default
      // We need to fetch the vehicle's is_default status first (we already have it in vehicleCount query, let's select it)
      const { data: vehicleData, error: vehicleFetchError } = await supabaseAdmin
        .from('vehicles')
        .select('is_default')
        .eq('id', vehicle_id)
        .single();

      if (vehicleFetchError || !vehicleData) {
        return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      if (vehicleData.is_default) {
        // Check for active appointments for this vehicle
        // Active means status is NOT 'completed' AND NOT 'cancelled'
        const { count: activeAppointmentsCount, error: activeAppointmentsError } = await supabaseAdmin
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('vehicle_id', vehicle_id)
          .eq('vehicle_id', vehicle_id)
          .in('status', ['scheduled', 'confirmed', 'pending_payment', 'in_progress', 'ready_for_pickup', 'checked_in']);

        if (activeAppointmentsError) {
          console.error('Error checking active appointments:', activeAppointmentsError);
          return new Response(JSON.stringify({ error: 'Error checking vehicle availability' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        if (activeAppointmentsCount && activeAppointmentsCount > 0) {
          return new Response(JSON.stringify({ error: 'Veículo padrão já possui um agendamento ativo. Conclua ou cancele o atual antes de agendar outro.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
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
      // Se for assinante E o veículo for o padrão, o preço do serviço é 0.
      const isFreeWash = isSubscriber && vehicleData.is_default;
      const servicePrice = isFreeWash ? 0 : Number(serviceData.price);
      const totalPrice = servicePrice + productsPrice;

      // 6. Calcular horário de término
      const startTime = new Date(start_time_utc);
      const durationInMinutes = Number(serviceData.duration_minutes);
      const endTime = new Date(startTime.getTime() + durationInMinutes * 60000);

      // 7. Handle Payment or Direct Booking
      if (totalPrice > 0) {
        // 1. Create appointment with 'pending_payment' status FIRST
        const { data: appointmentData, error: appointmentError } = await supabaseAdmin.rpc(
          'create_appointment_with_check',
          {
            p_user_id: user.id,
            p_vehicle_id: vehicle_id,
            p_time_slot_id: slotId,
            p_service_type: serviceData.name,
            p_special_instructions: special_instructions ?? null,
            p_start_time: startTime.toISOString(),
            p_end_time: endTime.toISOString(),
            p_products: productsData,
            p_total_price: totalPrice,
            p_status: 'pending_payment'
          }
        );

        if (appointmentError) {
          console.error('RPC Error (Pending Payment):', appointmentError);
          throw appointmentError;
        }

        if (appointmentData && appointmentData.error) {
          return new Response(JSON.stringify({ error: appointmentData.error }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          });
        }

        // 2. Create Stripe Checkout Session with appointment_id in metadata
        const session = await stripe.checkout.sessions.create({
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: 'brl',
                product_data: {
                  name: `Agendamento: ${serviceData.name}`,
                  description: `Veículo: ${vehicleData.make} ${vehicleData.model} - ${startTime.toLocaleString('pt-BR')}`,
                },
                unit_amount: Math.round(totalPrice * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${req.headers.get('origin')}/dashboard?payment_success=true`,
          cancel_url: `${req.headers.get('origin')}/booking`,
          client_reference_id: String(appointmentData.id),
          metadata: {
            user_id: user.id,
            vehicle_id: String(vehicle_id),
            time_slot_id: String(slotId),
            service_type: serviceData.name,
            special_instructions: special_instructions || '',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            products: JSON.stringify(productsData),
            total_price: String(totalPrice),
            type: 'appointment_payment',
            appointment_id: String(appointmentData.id) // Include ID directly
          },
        });

        return new Response(JSON.stringify({ checkoutUrl: session.url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } else {
        // Free Booking (Subscriber Default Vehicle)
        const { data, error } = await supabaseAdmin.rpc(
          'create_appointment_with_check',
          {
            p_user_id: user.id,
            p_vehicle_id: vehicle_id,
            p_time_slot_id: slotId,
            p_service_type: serviceData.name,
            p_special_instructions: special_instructions ?? null,
            p_start_time: startTime.toISOString(),
            p_end_time: endTime.toISOString(),
            p_products: productsData,
            p_total_price: totalPrice,
            p_status: 'scheduled'
          }
        );

        if (error) {
          console.error('RPC Error:', error);
          throw error;
        }

        if (data && data.error) {
          return new Response(JSON.stringify({ error: data.error }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });
      }
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