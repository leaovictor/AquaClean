import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { supabase } from '../_shared/supabaseClient.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Interface to ensure the API return matches the React frontend interface
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // --- 1. Admin Authentication and Authorization ---
    const { data: { user } } = await supabaseUserClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: profile } = await supabaseUserClient
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
    // --- End of Authorization ---

    switch (req.method) {
      case 'GET': {
        console.log('AdminCustomers Edge Function: GET request received.');
        const { data: profiles, error: profilesError } = await supabase
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
          console.error('AdminCustomers Edge Function: Error fetching profiles:', profilesError);
          throw profilesError;
        }

        if (!profiles) {
          console.log('AdminCustomers Edge Function: No customer profiles found.');
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        console.log(`AdminCustomers Edge Function: Found ${profiles.length} customer profiles.`);

        const formattedCustomers: AdminCustomerAPI[] = await Promise.all(profiles.map(async (customer) => {
            console.log(`AdminCustomers Edge Function: Processing customer ID: ${customer.id}`);
            const { count: vehicleCount, error: vehicleError } = await supabase
                .from('vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', customer.id);

            if (vehicleError) console.error(`AdminCustomers Edge Function: Error fetching vehicle count for ${customer.id}:`, vehicleError);

            const { data: appointmentsData, error: appointmentError } = await supabase
                .from('appointments')
                .select(`
                    total_price,
                    start_time
                `)
                .eq('user_id', customer.id);
            
            if (appointmentError) console.error(`AdminCustomers Edge Function: Error fetching appointments for ${customer.id}:`, appointmentError);
            
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
                subscription_status: 'N/A', 
            }
        }))

        console.log(`AdminCustomers Edge Function: Successfully formatted ${formattedCustomers.length} customers.`);
        return new Response(JSON.stringify(formattedCustomers), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
      }

      case 'PUT': {
        const url = new URL(req.url)
        const id = url.pathname.split('/').pop()

        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing customer ID' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const body = await req.json()

        const { data, error } = await supabase
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
          .single()

        if (error) throw error

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'POST': {
        console.log('AdminCustomers Edge Function: POST request received.');
        const body = await req.json();
        console.log('AdminCustomers Edge Function: Request body:', body);

        console.log('AdminCustomers Edge Function: Attempting to create user with email:', body.email);
        const { data: userData, error: authError } = await supabase.auth.admin.createUser({
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
        });

        if (authError) {
          console.error('AdminCustomers Edge Function: Error creating user:', authError);
          throw authError;
        }
        
        console.log('AdminCustomers Edge Function: User created successfully:', userData.user?.id);
        return new Response(JSON.stringify({ 
            id: userData.user!.id,
            email: userData.user!.email,
            message: 'User created successfully. Frontend should refetch the customer list.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })
      }

      case 'DELETE': {
        const url = new URL(req.url)
        const id = url.pathname.split('/').pop()

        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing customer ID' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)
            
        if (profileError) throw profileError

        const { data, error: authError } = await supabase.auth.admin.deleteUser(id)

        if (authError) throw authError

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