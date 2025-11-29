import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not found')
        }

        // Parse request body
        let autoRenew = false
        try {
            const body = await req.json()
            if (typeof body.auto_renew === 'boolean') {
                autoRenew = body.auto_renew
            }
        } catch {
            // If no body or invalid JSON, default to false (cancel)
        }

        // Update profile to set auto_renew
        const { error } = await supabaseClient
            .from('profiles')
            .update({ auto_renew: autoRenew })
            .eq('id', user.id)

        if (error) throw error

        return new Response(
            JSON.stringify({ message: `Subscription ${autoRenew ? 'reactivated' : 'canceled'} successfully` }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
