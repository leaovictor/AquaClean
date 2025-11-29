import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

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

        // Get Stripe Customer ID
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        if (!profile?.stripe_customer_id) {
            throw new Error('Stripe customer not found')
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // List active subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: profile.stripe_customer_id,
            status: 'active',
            limit: 1,
        })

        if (subscriptions.data.length === 0) {
            throw new Error('No active subscription found')
        }

        const subscriptionId = subscriptions.data[0].id

        // Update Stripe Subscription
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: !autoRenew,
        })

        // Update profile to set auto_renew (local fallback, webhook should also handle this)
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
