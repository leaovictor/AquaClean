import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Helper to format date for SQL queries
const formatDate = (date: Date) => date.toISOString().split('T')[0];

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
    const period = url.searchParams.get('period') || '30' // default to 30 days
    const format = url.searchParams.get('format') // for export functionality

    const days = parseInt(period, 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const startOfMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const startOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);

    // Fetch data for Revenue, Appointments, Customers
    const { data: appointmentData, error: appointmentError } = await supabaseClient
        .from('appointments')
        .select(
            `
            status,
            created_at,
            start_time,
            service_type,
            total_price,
            user_id
        `
        )
        .gte('created_at', formatDate(startDate));

    if (appointmentError) throw appointmentError;

    const { data: customerData, error: customerError } = await supabaseClient
        .from('profiles')
        .select(
            `
            id,
            created_at
        `
        )
        .eq('role', 'customer')
        .gte('created_at', formatDate(startDate)); // Only fetch customers created within the period

    if (customerError) throw customerError;

    // --- Calculate Stats ---

    // Revenue
    const currentMonthAppointments = appointmentData.filter(apt => new Date(apt.created_at) >= startOfMonth);
    const previousMonthAppointments = appointmentData.filter(apt => new Date(apt.created_at) >= startOfPrevMonth && new Date(apt.created_at) <= endOfPrevMonth);

    const currentMonthRevenue = currentMonthAppointments.reduce((sum, apt) => sum + (apt.total_price || 0), 0);
    const previousMonthRevenue = previousMonthAppointments.reduce((sum, apt) => sum + (apt.total_price || 0), 0);
    const revenueGrowth = previousMonthRevenue === 0 ? (currentMonthRevenue > 0 ? 100 : 0) : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    
    // Daily Revenue (for the last 7 days within the queried period)
    const dailyRevenueMap = new Map<string, number>();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(endDate.getDate() - Math.min(days, 7)); // max 7 days, or less if period is shorter

    appointmentData.forEach(apt => {
        const aptDate = new Date(apt.created_at);
        if (aptDate >= sevenDaysAgo) {
            const dateKey = formatDate(aptDate);
            dailyRevenueMap.set(dateKey, (dailyRevenueMap.get(dateKey) || 0) + (apt.total_price || 0));
        }
    });

    const dailyRevenue = Array.from({ length: Math.min(days, 7) }).map((_, i) => {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        const dateKey = formatDate(d);
        return { date: dateKey, amount: dailyRevenueMap.get(dateKey) || 0 };
    });


    // Customers
    const totalCustomers = (await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer')).count || 0;
    const newThisMonthCustomers = customerData.filter(c => new Date(c.created_at) >= startOfMonth).length;
    const previousMonthCustomers = (await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', formatDate(startOfPrevMonth)).lt('created_at', formatDate(startOfMonth))).count || 0;
    const customerGrowth = previousMonthCustomers === 0 ? (newThisMonthCustomers > 0 ? 100 : 0) : ((newThisMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100;

    // Appointments Summary (within chosen period)
    const totalAppointmentsThisPeriod = appointmentData.length;
    const completedAppointments = appointmentData.filter(apt => apt.status === 'completed').length;
    const canceledAppointments = appointmentData.filter(apt => apt.status === 'canceled').length;
    const appointmentCompletionRate = totalAppointmentsThisPeriod === 0 ? 0 : (completedAppointments / totalAppointmentsThisPeriod) * 100;

    // Popular Services
    const serviceCounts = appointmentData.reduce((acc, apt) => {
        acc[apt.service_type] = acc[apt.service_type] || { count: 0, revenue: 0 };
        acc[apt.service_type].count++;
        acc[apt.service_type].revenue += (apt.total_price || 0);
        return acc;
    }, {});
    const popularServices = Object.entries(serviceCounts)
        .map(([service_type, data]) => ({ service_type, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

    // Monthly Trends (for the last 6 months)
    const monthlyTrends = [];
    for (let i = 0; i < 6; i++) {
        const monthStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0, 23, 59, 59);

        const apptsInMonth = appointmentData.filter(apt => new Date(apt.created_at) >= monthStart && new Date(apt.created_at) <= monthEnd);
        const customersInMonth = customerData.filter(c => new Date(c.created_at) >= monthStart && new Date(c.created_at) <= monthEnd);
        
        monthlyTrends.push({
            month: monthStart.toLocaleString('default', { month: 'short', year: '2-digit' }),
            appointments: apptsInMonth.length,
            revenue: apptsInMonth.reduce((sum, apt) => sum + (apt.total_price || 0), 0),
            customers: customersInMonth.length,
        });
    }
    monthlyTrends.reverse(); // To show chronologically


    const report = {
      revenue: {
        current_month: currentMonthRevenue,
        previous_month: previousMonthRevenue,
        growth_percentage: parseFloat(revenueGrowth.toFixed(2)),
        daily_revenue: dailyRevenue,
      },
      customers: {
        total: totalCustomers,
        new_this_month: newThisMonthCustomers,
        growth_percentage: parseFloat(customerGrowth.toFixed(2)),
      },
      appointments: {
        total_this_month: totalAppointmentsThisPeriod,
        completed: completedAppointments,
        canceled: canceledAppointments,
        completion_rate: parseFloat(appointmentCompletionRate.toFixed(2)),
      },
      popular_services: popularServices,
      monthly_trends: monthlyTrends,
    };

    if (format === 'csv') {
        const headers = ["Mês", "Agendamentos", "Receita", "Novos Clientes", "Pedido Médio"];
        const csvRows = monthlyTrends.map(row => 
            `${row.month},${row.appointments},${row.revenue},${row.customers},${row.appointments > 0 ? (row.revenue / row.appointments).toFixed(2) : '0'}`
        );
        const csv = [headers.join(','), ...csvRows].join('\n');
        
        return new Response(csv, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="report-${formatDate(endDate)}.csv"`,
            },
            status: 200,
        });
    }


    return new Response(JSON.stringify(report), {
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
