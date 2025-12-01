import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUserClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
        )

        const { data: { user } } = await supabaseUserClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabaseUserClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') throw new Error('Forbidden')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch all completed appointments
        const { data: appointments, error } = await supabaseAdmin
            .from('appointments')
            .select('total_price, created_at, payment_method, service_type')
            .eq('status', 'completed') // Or confirmed? Usually revenue is realized on completion.
            // Let's include 'confirmed' for POS payments that are "paid" upfront/presencial
            .in('status', ['completed', 'confirmed'])

        if (error) throw error

        // Fetch active subscriptions for MRR (Monthly Recurring Revenue)
        const { data: subscriptions, error: subError } = await supabaseAdmin
            .from('profiles')
            .select('subscription_plan_id')
            .eq('subscription_status', 'active')

        if (subError) throw subError

        // Fetch plan prices
        const { data: plans } = await supabaseAdmin.from('subscription_plans').select('id, price')
        const planMap = new Map(plans?.map(p => [p.id, p.price]) || [])

        // Calculate Stats
        let totalRevenue = 0
        let revenueByMethod: Record<string, number> = {}
        let revenueByService: Record<string, number> = {}
        let monthlyRevenue = 0 // Current month

        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        appointments?.forEach(apt => {
            const price = Number(apt.total_price) || 0
            const date = new Date(apt.created_at)

            totalRevenue += price

            // Payment Method
            const method = apt.payment_method || 'Outros'
            revenueByMethod[method] = (revenueByMethod[method] || 0) + price

            // Service Type
            const service = apt.service_type || 'Unknown'
            revenueByService[service] = (revenueByService[service] || 0) + price

            // Monthly
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                monthlyRevenue += price
            }
        })

        // Add Subscription Revenue to Monthly
        let subscriptionRevenue = 0
        subscriptions?.forEach(sub => {
            const price = Number(planMap.get(sub.subscription_plan_id)) || 0
            subscriptionRevenue += price
        })

        // Add sub revenue to total monthly (assuming 1 billing cycle per active user per month)
        monthlyRevenue += subscriptionRevenue

        return new Response(JSON.stringify({
            totalRevenue,
            monthlyRevenue,
            subscriptionRevenue,
            revenueByMethod,
            revenueByService,
            appointmentCount: appointments?.length || 0,
            activeSubscriptions: subscriptions?.length || 0
        }), {
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
