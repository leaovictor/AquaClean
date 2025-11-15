import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Interface para garantir que o retorno da API corresponda à interface do frontend React
interface AdminCustomerAPI {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  vehicle_count: number;
  appointment_count: number;
  total_spent: number;
  last_appointment?: string;
  subscription_status?: string;
}

serve(async (req) => {
  // Configuração CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // --- 1. Autenticação e Autorização do Admin ---
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }
    // --- Fim da Autorização ---

    switch (req.method) {
      // --- READ (GET) - Buscando clientes com dados agregados (CORRIGIDO) ---
      case 'GET': {
        
        // 1. Busca todos os perfis de clientes (sem subconsultas aninhadas)
        const { data: profiles, error: profilesError } = await supabaseClient
            .from('profiles')
            .select(`
                id,
                email,
                first_name,
                last_name,
                phone,
                address,
                city,
                state,
                zip_code,
                created_at
            `)
            .eq('role', 'customer')

        if (profilesError) {
            throw profilesError
        }

        if (!profiles) {
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // 2. Busca e Agrega dados de veículos e agendamentos para CADA perfil (Promise.all)
        const formattedCustomers: AdminCustomerAPI[] = await Promise.all(profiles.map(async (customer) => {
            
            // A. Contagem de Veículos
            const { count: vehicleCount, error: vehicleError } = await supabaseClient
                .from('vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', customer.id);

            if (vehicleError) console.error(`Error fetching vehicle count for ${customer.id}:`, vehicleError);

            // B. Agendamentos e Cálculos Financeiros
            const { data: appointmentsData, error: appointmentError } = await supabaseClient
                .from('appointments')
                .select(`
                    total_price,
                    start_time
                `)
                .eq('user_id', customer.id);
            
            if (appointmentError) console.error(`Error fetching appointments for ${customer.id}:`, appointmentError);
            
            const appointments = appointmentsData || [];
            const appointment_count = appointments.length;
            const total_spent = appointments.reduce((acc, apt) => acc + (apt.total_price || 0), 0);
            
            const last_appointment = appointments.length > 0
                ? appointments.reduce((latest, apt) => {
                    const latestDate = new Date(latest.start_time);
                    const aptDate = new Date(apt.start_time);
                    return aptDate > latestDate ? apt : latest;
                  }).start_time
                : undefined;

            return {
                id: customer.id,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
                phone: customer.phone,
                address: customer.address,
                city: customer.city,
                state: customer.state,
                zip_code: customer.zip_code,
                created_at: customer.created_at,
                vehicle_count: vehicleCount || 0,
                appointment_count,
                total_spent,
                last_appointment,
                subscription_status: 'N/A', // Omissão: ajuste aqui se implementar a lógica de assinatura
            }
        }))

        return new Response(JSON.stringify(formattedCustomers), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
      }

      // --- UPDATE (PUT) ---
      case 'PUT': {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const id = pathParts[pathParts.length - 1]

        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing customer ID' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const body = await req.json()

        const { data, error } = await supabaseClient
          .from('profiles')
          .update({
            first_name: body.first_name,
            last_name: body.last_name,
            phone: body.phone,
            address: body.address,
            city: body.city,
            state: body.state,
            zip_code: body.zip_code,
          })
          .eq('id', id)
          .select()
          .single() // Garante que retorne um único objeto

        if (error) {
          throw error
        }

        // Retorna o objeto atualizado
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // --- CREATE (POST) ---
      case 'POST': {
        const body = await req.json()

        // Cria o usuário em auth.users (e espera o trigger criar o perfil)
        const { data: userData, error: authError } = await supabaseClient.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: {
            first_name: body.first_name,
            last_name: body.last_name,
            phone: body.phone,
            address: body.address,
            city: body.city,
            state: body.state,
            zip_code: body.zip_code,
            role: 'customer',
          }
        })

        if (authError) {
          throw authError
        }
        
        // Retorna a confirmação de criação
        return new Response(JSON.stringify({ 
            id: userData.user!.id, // O '!' afirma que user existe
            email: userData.user!.email,
            message: 'User created successfully. Frontend should refetch the customer list.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })
      }

      // --- DELETE (DELETE) ---
      case 'DELETE': {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const id = pathParts[pathParts.length - 1]

        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing customer ID' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        // 1. Deleta o perfil (se não houver ON DELETE CASCADE na FK)
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .delete()
            .eq('id', id)
            
        if (profileError) {
            throw profileError
        }

        // 2. Deleta o usuário de autenticação
        const { data, error: authError } = await supabaseClient.auth.admin.deleteUser(id)

        if (authError) {
            throw authError
        }

        return new Response(JSON.stringify({id, message: "User deleted"}), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default: {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        })
      }
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})