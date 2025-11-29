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

        const { plan_id } = await req.json()
        if (!plan_id) {
            throw new Error('Plan ID is required')
        }

        // Fetch plan details to get Stripe Price ID (assuming price is stored or mapped)
        // For simplicity, we'll fetch the plan and assume we can derive or look up the price ID.
        // Ideally, subscription_plans table should have a stripe_price_id column.
        // Since it doesn't seem to have it yet based on previous context, we might need to look it up or create it dynamically.
        // However, `create-checkout-session` created prices on the fly or used `unit_amount`.
        // `stripe.subscriptions.update` requires a `price` ID (not amount).
        // If we don't have price IDs, we might need to create a price object or find an existing one.

        // WAIT: `create-checkout-session` used `price_data` with `unit_amount`. It didn't use a pre-existing Price ID.
        // To update a subscription, we generally need a Price ID.
        // Let's check if we can pass `price_data` to `subscriptions.update`.
        // According to Stripe API, `items` array takes `price` (ID) or `price_data`.
        // So we can use `price_data` similar to checkout!

        const { data: plan, error: planError } = await supabaseClient
            .from('subscription_plans')
            .select('*')
            .eq('id', plan_id)
            .single()

        if (planError || !plan) {
            throw new Error('Plan not found')
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

        const subscription = subscriptions.data[0]
        const subscriptionItemId = subscription.items.data[0].id

        // Update Subscription
        // We use price_data to define the new price on the fly
        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
            items: [{
                id: subscriptionItemId,
                price_data: {
                    currency: 'brl',
                    product: subscription.items.data[0].price.product as string, // Reuse existing product or create new? 
                    // Better to find the product associated with the plan or create a new one?
                    // `create-checkout-session` created a product inline with `product_data`.
                    // Here we are updating. If we use `price_data`, we need to specify `product` or `product_data`.
                    // Let's assume we can reuse the product from the current subscription if it's generic, 
                    // OR we should probably create a new Price for this Plan if it doesn't exist.
                    // A cleaner way is to just pass `unit_amount` and `currency` and `product` (id).
                    // Let's try to reuse the product ID from the existing item.
                    unit_amount: Math.round(plan.price * 100),
                    recurring: { interval: 'month' },
                    product_data: {
                        name: plan.name,
                        description: plan.description
                    }
                }
            }],
            metadata: {
                plan_id: String(plan.id),
                user_id: String(user.id)
            },
            proration_behavior: 'always_invoice', // Charge/Credit immediately
        })

        // Update local profile immediately (optimistic)
        await supabaseClient
            .from('profiles')
            .update({
                subscription_plan_id: plan.id,
                auto_renew: true // Re-enable auto-renew if it was disabled
            })
            .eq('id', user.id)

        return new Response(
            JSON.stringify({ message: 'Subscription updated successfully', subscription: updatedSubscription }),
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
