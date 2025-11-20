import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

    // --- Auth Check ---
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Fetch Plans
    const { data: plans, error: plansError } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .order('id')
    if (plansError) throw plansError

    // 2. Fetch Time Slots
    const { data: slots, error: slotsError } = await supabaseClient
        .from('time_slots')
        .select('*')
        .order('day_of_week')
        .order('start_time')
    if (slotsError) throw slotsError

    // 3. Fetch Vehicle Stats
    // Using the RPC function if available, or manual query
    let vehicleStats = []
    try {
        const { data, error } = await supabaseClient.rpc('get_vehicle_stats')
        if (!error) vehicleStats = data
        else {
             // Fallback manual query
            const { data: vehicles } = await supabaseClient.from('vehicles').select('make, model')
            const statsMap: Record<string, { make: string, model: string, vehicle_count: number }> = {}
            vehicles?.forEach(v => {
                const key = `${v.make}-${v.model}`
                if (!statsMap[key]) statsMap[key] = { make: v.make, model: v.model, vehicle_count: 0 }
                statsMap[key].vehicle_count++
            })
            vehicleStats = Object.values(statsMap)
        }
    } catch (e) {
        console.error("Error fetching vehicle stats", e)
    }

    return new Response(JSON.stringify({
        plans,
        slots,
        vehicleStats
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
