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

    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    const isIdPresent = id && id !== 'admin-subscription-plans'

    switch (req.method) {
        case 'GET':
            const { data, error } = await supabaseClient
                .from('subscription_plans')
                .select('*')
                .order('id')

            if (error) throw error
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        case 'POST':
            const body = await req.json()
            const { data: created, error: createError } = await supabaseClient
                .from('subscription_plans')
                .insert(body)
                .select()
                .single()

            if (createError) throw createError
            return new Response(JSON.stringify(created), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        case 'PUT':
            if (!isIdPresent) return new Response('Missing ID', { status: 400 })
            const updateBody = await req.json()
            const { data: updated, error: updateError } = await supabaseClient
                .from('subscription_plans')
                .update(updateBody)
                .eq('id', id)
                .select()
                .single()

            if (updateError) throw updateError
            return new Response(JSON.stringify(updated), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        case 'DELETE':
            if (!isIdPresent) return new Response('Missing ID', { status: 400 })
            const { error: deleteError } = await supabaseClient
                .from('subscription_plans')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        default:
            return new Response('Method Not Allowed', { status: 405 })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
