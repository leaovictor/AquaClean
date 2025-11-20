import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  console.log("admin-appointments function invoked");
  console.log("Request method:", req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

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

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        console.log("Request body:", body);
        const { page = 1, pageSize = 10 } = body;
        const rangeFrom = (page - 1) * pageSize
        const rangeTo = rangeFrom + pageSize - 1

        const { data: appointments, error, count } = await supabaseClient
          .from('appointments')
          .select(`
            id,
            status,
            service_type,
            start_time,
            total_price,
            created_at,
            special_instructions,
            profiles (
              first_name,
              last_name,
              email
            ),
            vehicles (
              make,
              model,
              year
            )
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(rangeFrom, rangeTo)

        if (error) {
          throw error
        }

        const formattedAppointments = appointments.map(apt => ({
          id: apt.id,
          customer_name: apt.profiles ? `${apt.profiles.first_name} ${apt.profiles.last_name}`: 'N/A',
          user_email: apt.profiles ? apt.profiles.email : 'N/A',
          make: apt.vehicles ? apt.vehicles.make : 'N/A',
          model: apt.vehicles ? apt.vehicles.model : 'N/A',
          year: apt.vehicles ? apt.vehicles.year : 'N/A',
          service_type: apt.service_type,
          status: apt.status,
          date: new Date(apt.start_time).toLocaleDateString(),
          time: new Date(apt.start_time).toLocaleTimeString(),
          special_instructions: apt.special_instructions,
          total_price: apt.total_price,
          created_at: apt.created_at,
        }))

        return new Response(JSON.stringify({ data: formattedAppointments, count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } catch (e) {
        console.error("Error parsing JSON body:", e);
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    } else if (req.method === 'PUT') {
      // This part is likely incorrect and not used in the current flow
      const { id } = await req.json(); // Assuming ID is in the body
      const { status } = await req.json()

      const { data: updatedAppointment, error } = await supabaseClient
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(updatedAppointment), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
