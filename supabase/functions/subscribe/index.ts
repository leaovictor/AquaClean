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

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError) throw userError
        if (!user) throw new Error("User not found")

        const { plan_id } = await req.json()
        if (!plan_id) throw new Error("Plan ID is required")

        // Use Admin client to bypass RLS for profile update
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Calculate dates
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 30) // 30 days subscription

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                subscription_status: 'active',
                subscription_plan_id: plan_id,
                subscription_start_date: startDate.toISOString(),
                subscription_end_date: endDate.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ success: true }), {
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
