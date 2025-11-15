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

    const url = new URL(req.url)
    const planId = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      const { data: plans, error } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(plans), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (req.method === 'POST') {
      const plan = await req.json()
      const { data: newPlan, error } = await supabaseClient
        .from('subscription_plans')
        .insert(plan)
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(newPlan), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    } else if (req.method === 'PUT') {
      const plan = await req.json()
      const { data: updatedPlan, error } = await supabaseClient
        .from('subscription_plans')
        .update(plan)
        .eq('id', planId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(updatedPlan), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (req.method === 'DELETE') {
      const { error } = await supabaseClient
        .from('subscription_plans')
        .delete()
        .eq('id', planId)

      if (error) {
        throw error
      }

      return new Response(null, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 204,
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
