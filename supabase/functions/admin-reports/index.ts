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

    // --- Parse Query Params ---
    const url = new URL(req.url)
    const periodDays = parseInt(url.searchParams.get('period') || '30')
    const now = new Date()
    const startDate = new Date()
    startDate.setDate(now.getDate() - periodDays)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // --- 1. Revenue Stats ---
    // Current Month Revenue
    const { data: currentMonthData } = await supabaseClient
        .from('appointments')
        .select('total_price, appointment_time')
        .eq('status', 'completed')
        .gte('appointment_time', startOfMonth.toISOString())

    const currentMonthRevenue = currentMonthData?.reduce((sum, app) => sum + (Number(app.total_price) || 0), 0) || 0

    // Previous Month Revenue
    const { data: lastMonthData } = await supabaseClient
        .from('appointments')
        .select('total_price')
        .eq('status', 'completed')
        .gte('appointment_time', startOfLastMonth.toISOString())
        .lte('appointment_time', endOfLastMonth.toISOString())

    const lastMonthRevenue = lastMonthData?.reduce((sum, app) => sum + (Number(app.total_price) || 0), 0) || 0

    const revenueGrowth = lastMonthRevenue === 0
        ? (currentMonthRevenue > 0 ? 100 : 0)
        : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

    // Daily Revenue (for the selected period)
    const { data: periodRevenueData } = await supabaseClient
        .from('appointments')
        .select('total_price, appointment_time')
        .eq('status', 'completed')
        .gte('appointment_time', startDate.toISOString())
        .order('appointment_time')

    const dailyRevenueMap: Record<string, number> = {}
    periodRevenueData?.forEach(app => {
        const date = app.appointment_time.split('T')[0]
        dailyRevenueMap[date] = (dailyRevenueMap[date] || 0) + (Number(app.total_price) || 0)
    })

    const dailyRevenue = Object.entries(dailyRevenueMap).map(([date, amount]) => ({ date, amount }))

    // --- 2. Customer Stats ---
    const { count: totalCustomers } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')

    const { count: newCustomersMonth } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
        .gte('created_at', startOfMonth.toISOString())
    
    // Simplified growth calculation for customers (assuming linear or just showing current vs new)
    const customerGrowth = 0 // implementing real growth would require historical data queries

    // --- 3. Appointment Stats ---
    const { data: monthAppointments } = await supabaseClient
        .from('appointments')
        .select('status')
        .gte('appointment_time', startOfMonth.toISOString())

    const totalThisMonth = monthAppointments?.length || 0
    const completedThisMonth = monthAppointments?.filter(a => a.status === 'completed').length || 0
    const canceledThisMonth = monthAppointments?.filter(a => a.status === 'canceled').length || 0
    const completionRate = totalThisMonth > 0 ? Math.round((completedThisMonth / totalThisMonth) * 100) : 0

    // --- 4. Popular Services ---
    const { data: allCompletedServices } = await supabaseClient
        .from('appointments')
        .select('service_type, total_price')
        .eq('status', 'completed')
        .gte('appointment_time', startDate.toISOString())

    const servicesMap: Record<string, { count: number, revenue: number }> = {}
    allCompletedServices?.forEach(app => {
        const type = app.service_type || 'unknown'
        if (!servicesMap[type]) servicesMap[type] = { count: 0, revenue: 0 }
        servicesMap[type].count++
        servicesMap[type].revenue += Number(app.total_price) || 0
    })

    const popularServices = Object.entries(servicesMap)
        .map(([service_type, data]) => ({ service_type, ...data }))
        .sort((a, b) => b.count - a.count)

    // --- 5. Monthly Trends (Last 6 months) ---
    const trendsStartDate = new Date()
    trendsStartDate.setMonth(trendsStartDate.getMonth() - 5)
    trendsStartDate.setDate(1)

    const { data: trendsData } = await supabaseClient
        .from('appointments')
        .select('appointment_time, total_price, status')
        .gte('appointment_time', trendsStartDate.toISOString())

    // Need to also count new customers per month for the trends
    const { data: trendsCustomers } = await supabaseClient
        .from('profiles')
        .select('created_at')
        .eq('role', 'customer')
        .gte('created_at', trendsStartDate.toISOString())

    const monthlyTrendsMap: Record<string, { appointments: number, revenue: number, customers: number }> = {}

    // Initialize map keys
    for (let i = 0; i < 6; i++) {
        const d = new Date(trendsStartDate)
        d.setMonth(d.getMonth() + i)
        const key = d.toLocaleString('default', { month: 'short' })
        monthlyTrendsMap[key] = { appointments: 0, revenue: 0, customers: 0 }
    }

    trendsData?.forEach(app => {
        const date = new Date(app.appointment_time)
        const key = date.toLocaleString('default', { month: 'short' })
        if (monthlyTrendsMap[key]) {
            monthlyTrendsMap[key].appointments++
            if (app.status === 'completed') {
                monthlyTrendsMap[key].revenue += Number(app.total_price) || 0
            }
        }
    })

    trendsCustomers?.forEach(cust => {
        const date = new Date(cust.created_at)
        const key = date.toLocaleString('default', { month: 'short' })
        if (monthlyTrendsMap[key]) {
            monthlyTrendsMap[key].customers++
        }
    })

    const monthlyTrends = Object.entries(monthlyTrendsMap).map(([month, data]) => ({ month, ...data }))


    const reportData = {
        revenue: {
            current_month: currentMonthRevenue,
            previous_month: lastMonthRevenue,
            growth_percentage: Math.round(revenueGrowth),
            daily_revenue: dailyRevenue
        },
        customers: {
            total: totalCustomers || 0,
            new_this_month: newCustomersMonth || 0,
            growth_percentage: customerGrowth
        },
        appointments: {
            total_this_month: totalThisMonth,
            completed: completedThisMonth,
            canceled: canceledThisMonth,
            completion_rate: completionRate
        },
        popular_services: popularServices,
        monthly_trends: monthlyTrends
    }

    return new Response(JSON.stringify(reportData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
