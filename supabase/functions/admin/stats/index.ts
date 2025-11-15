import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../../_shared/cors.ts'

serve(async (req) => {
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

    const { count: totalCustomers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { count: todayAppointments } = await supabaseClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', todayStart)
      .lt('start_time', todayEnd)

    const { count: pendingAppointments } = await supabaseClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')

    const { count: completedAppointments } = await supabaseClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: canceledAppointments } = await supabaseClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')

    const stats = {
      totalCustomers: totalCustomers ?? 0,
      activeSubscriptions: 0, // Not implemented yet
      todayAppointments: todayAppointments ?? 0,
      monthlyRevenue: 0, // Not implemented yet
      pendingAppointments: pendingAppointments ?? 0,
      completedAppointments: completedAppointments ?? 0,
      canceledAppointments: canceledAppointments ?? 0,
      revenueGrowth: 0, // Not implemented yet
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
