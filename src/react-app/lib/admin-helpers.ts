
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
  start_time: string;
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
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error getting session:', sessionError);
    throw new Error('Could not get user session.');
  }

  const { data, error } = await supabase.functions.invoke('admin-stats', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionData.session?.access_token}`
    }
  });

  if (error) {
    console.error('Error fetching admin stats:', error);
    throw new Error('Could not fetch admin statistics.');
  }

  return data;
}

export async function fetchRecentAppointments(limit = 5): Promise<RecentAppointment[]> {
  // 1. Fetch appointments with vehicles
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      created_at,
      start_time,
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
    }
    else {
      profiles?.forEach(p => {
        profilesMap[p.id] = p.email || 'No Email';
      });
    }
  }

  // 3. Merge data
  return appointments.map((item: any) => ({
    id: item.id,
    created_at: item.created_at,
    start_time: item.start_time,
    status: item.status,
    service_type: item.service_type,
    total_price: item.total_price,
    make: item.vehicles?.make || 'Unknown',
    model: item.vehicles?.model || 'Unknown',
    customer_email: profilesMap[item.user_id] || 'Unknown User'
  }));
}

export async function fetchAllAppointments(page: number, pageSize: number): Promise<{ data: AdminAppointment[], count: number }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error getting session:', sessionError);
    return { data: [], count: 0 };
  }

  const { data, error } = await supabase.functions.invoke('admin-appointments', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionData.session?.access_token}`
    },
    body: JSON.stringify({ page, pageSize })
  });

  if (error) {
    console.error('Error fetching all appointments:', error);
    return { data: [], count: 0 };
  }

  return data;
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
