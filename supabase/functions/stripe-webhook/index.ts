import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    if (!signature) {
        return new Response('No signature', { status: 400 })
    }

    try {
        const body = await req.text()
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
            undefined,
            cryptoProvider
        )

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        let action = 'ignored'
        let details = ''

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object
                const { plan_id, user_id } = session.metadata || {}

                if (plan_id && user_id) {
                    // Update user profile with subscription details
                    const { error } = await supabaseClient
                        .from('profiles')
                        .update({
                            subscription_status: 'active',
                            subscription_plan_id: parseInt(plan_id),
                            stripe_customer_id: session.customer,
                            subscription_start_date: new Date().toISOString(),
                            subscription_end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), // Default 1 month
                            auto_renew: true
                        })
                        .eq('id', user_id)

                    if (error) {
                        action = 'error'
                        details = error.message
                    } else {
                        action = 'profile_updated'
                    }
                } else {
                    details = 'missing_metadata'
                }
                break
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object
                const customerId = invoice.customer

                // Find user by stripe_customer_id
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (profile) {
                    // Extend subscription
                    const { error } = await supabaseClient
                        .from('profiles')
                        .update({
                            subscription_status: 'active',
                            subscription_end_date: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
                        })
                        .eq('id', profile.id)

                    if (error) {
                        action = 'error'
                        details = error.message
                    } else {
                        action = 'subscription_extended'
                    }
                } else {
                    details = 'user_not_found'
                }
                break
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object
                const customerId = subscription.customer

                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (profile) {
                    const { error } = await supabaseClient
                        .from('profiles')
                        .update({
                            subscription_status: 'canceled',
                            auto_renew: false
                        })
                        .eq('id', profile.id)

                    if (error) {
                        action = 'error'
                        details = error.message
                    } else {
                        action = 'subscription_canceled'
                    }
                } else {
                    details = 'user_not_found'
                }
                break
            }
        }

        return new Response(JSON.stringify({ received: true, action, details }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }
})
