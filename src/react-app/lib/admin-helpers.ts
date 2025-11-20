
import { supabase } from '@/lib/supabaseClient';

// Types matching the database schema and dashboard needs
export interface AdminStats {
  totalCustomers: number;
  activeSubscriptions: number;
  todayAppointments: number;
  monthlyRevenue: number;
  pendingAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  revenueGrowth: number;
}

export interface RecentAppointment {
  id: number;
  created_at: string;
  appointment_time: string;
  status: string;
  service_type: string;
  total_price: number;
  make: string;
  model: string;
  customer_email: string;
}

export interface AdminAppointment {
  id: number;
  user_email: string;
  customer_name: string;
  make: string;
  model: string;
  year: number;
  service_type: string;
  status: string;
  date: string;
  time: string;
  special_instructions?: string;
  total_price?: number;
  created_at: string;
}

// Helper to fetch all admin stats
export async function fetchAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  // 1. Total Customers (count profiles)
  const { count: totalCustomers, error: customersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer');

  if (customersError) console.error('Error fetching customers:', customersError);

  // 2. Active Subscriptions
  const activeSubscriptions = 0;

  // 3. Today's Appointments
  const { count: todayAppointments, error: todayError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('appointment_time', startOfToday)
    .lt('appointment_time', endOfToday);

  if (todayError) console.error('Error fetching today appointments:', todayError);

  // 4. Monthly Revenue (Sum total_price of completed appointments this month)
  const { data: revenueData, error: revenueError } = await supabase
    .from('appointments')
    .select('total_price')
    .eq('status', 'completed')
    .gte('appointment_time', startOfMonth)
    .lte('appointment_time', endOfMonth);

  if (revenueError) console.error('Error fetching revenue:', revenueError);

  const monthlyRevenue = revenueData?.reduce((sum, appt) => sum + (Number(appt.total_price) || 0), 0) || 0;

  // 5. Pending Appointments (Using 'scheduled' as pending)
  const { count: pendingAppointments, error: pendingError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled');

  // 6. Completed Appointments
  const { count: completedAppointments, error: completedError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // 7. Canceled Appointments
  const { count: canceledAppointments, error: canceledError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'canceled');

  // 8. Revenue Growth
  const revenueGrowth = 0;

  return {
    totalCustomers: totalCustomers || 0,
    activeSubscriptions,
    todayAppointments: todayAppointments || 0,
    monthlyRevenue,
    pendingAppointments: pendingAppointments || 0,
    completedAppointments: completedAppointments || 0,
    canceledAppointments: canceledAppointments || 0,
    revenueGrowth
  };
}

export async function fetchRecentAppointments(limit = 5): Promise<RecentAppointment[]> {
  // 1. Fetch appointments with vehicles
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      created_at,
      appointment_time,
      status,
      service_type,
      total_price,
      user_id,
      vehicles (
        make,
        model
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent appointments:', error);
    return [];
  }

  if (!appointments || appointments.length === 0) return [];

  // 2. Fetch profiles for the user_ids found
  const userIds = Array.from(new Set(appointments.map(a => a.user_id).filter(Boolean)));

  let profilesMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      profiles?.forEach(p => {
        profilesMap[p.id] = p.email || 'No Email';
      });
    }
  }

  // 3. Merge data
  return appointments.map((item: any) => ({
    id: item.id,
    created_at: item.created_at,
    appointment_time: item.appointment_time,
    status: item.status,
    service_type: item.service_type,
    total_price: item.total_price,
    make: item.vehicles?.make || 'Unknown',
    model: item.vehicles?.model || 'Unknown',
    customer_email: profilesMap[item.user_id] || 'Unknown User'
  }));
}

export async function fetchAllAppointments(): Promise<AdminAppointment[]> {
    // 1. Fetch appointments with vehicles
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        created_at,
        appointment_time,
        status,
        service_type,
        total_price,
        special_instructions,
        user_id,
        vehicles (
          make,
          model,
          year
        )
      `)
      .order('appointment_time', { ascending: false });

    if (error) {
      console.error('Error fetching all appointments:', error);
      return [];
    }

    if (!appointments || appointments.length === 0) return [];

    // 2. Fetch profiles for the user_ids found
    const userIds = Array.from(new Set(appointments.map(a => a.user_id).filter(Boolean)));

    let profilesMap: Record<string, {email: string, name: string}> = {};

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        profiles?.forEach(p => {
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'N/D';
          profilesMap[p.id] = { email: p.email || 'No Email', name };
        });
      }
    }

    // 3. Merge data
    return appointments.map((item: any) => {
        const profile = profilesMap[item.user_id] || { email: 'Unknown User', name: 'N/D' };
        const dateObj = new Date(item.appointment_time);
        return {
            id: item.id,
            user_email: profile.email,
            customer_name: profile.name,
            make: item.vehicles?.make || 'Unknown',
            model: item.vehicles?.model || 'Unknown',
            year: item.vehicles?.year || 0,
            service_type: item.service_type,
            status: item.status,
            date: dateObj.toISOString(),
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            special_instructions: item.special_instructions,
            total_price: item.total_price,
            created_at: item.created_at
        };
    });
}

export async function updateAppointmentStatus(id: number, status: string) {
    const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating appointment status:', error);
        throw error;
    }
}
