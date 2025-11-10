import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabaseClient.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient(req)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // For simplicity, we're not checking for admin role here, but you should in a real application.

    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase.from('time_slots').select('*')
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      case 'POST': {
        const { day_of_week, start_time, end_time, max_appointments, is_available } = await req.json()
        const { data, error } = await supabase
          .from('time_slots')
          .insert([{ day_of_week, start_time, end_time, max_appointments, is_available }])
          .select()
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })
      }
      case 'PUT': {
        const { id, ...updateData } = await req.json()
        const { data, error } = await supabase
          .from('time_slots')
          .update(updateData)
          .eq('id', id)
          .select()
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      case 'DELETE': {
        const { id } = await req.json()
        const { error } = await supabase.from('time_slots').delete().eq('id', id)
        if (error) throw error
        return new Response(null, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 204,
        })
      }
      default:
        return new Response('Method Not Allowed', {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
