import { supabase } from '@/lib/supabaseClient';

// Types matching the database schema
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
  service_type: 'basic' | 'premium' | 'deluxe';
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  date: string;
  time: string;
  special_instructions?: string;
  total_price?: number;
  created_at: string;
}

// ------------------------------
// BASE INVOKE HELPER
// ------------------------------
async function invoke(name: string, method: string, body?: any) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) throw new Error("User not authenticated");

  const { data, error } = await supabase.functions.invoke(name, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (error) throw error;
  return data;
}

// ------------------------------
// FETCH ADMIN STATS
// ------------------------------
export async function fetchAdminStats(): Promise<AdminStats> {
  return invoke('admin-stats', 'GET');
}

// ------------------------------
// FETCH RECENT APPOINTMENTS
// ------------------------------
export async function fetchRecentAppointments(limit = 5): Promise<RecentAppointment[]> {
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
      vehicles(make, model)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !appointments) return [];

  const userIds = [...new Set(appointments.map(a => a.user_id).filter(Boolean))];
  const profilesMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    profiles?.forEach(p => {
      profilesMap[p.id] = p.email || 'No Email';
    });
  }

  return appointments.map((item: any) => ({
    id: item.id,
    created_at: item.created_at,
    start_time: item.start_time,
    status: item.status,
    service_type: item.service_type,
    total_price: item.total_price,
    make: item.vehicles?.make ?? 'Unknown',
    model: item.vehicles?.model ?? 'Unknown',
    customer_email: profilesMap[item.user_id] ?? 'Unknown User'
  }));
}

// ------------------------------
// FETCH ALL APPOINTMENTS
// ------------------------------
export async function fetchAllAppointments(
  page: number,
  pageSize: number
): Promise<{ data: AdminAppointment[]; count: number }> {
  return invoke("admin-appointments", "POST", { page, pageSize });
}

// ------------------------------
// UPDATE STATUS
// ------------------------------
export async function updateAppointmentStatus(id: number, status: string) {
  return invoke("admin-appointments-update", "PUT", { id, status });
}

// ------------------------------
// CANCEL APPOINTMENT
// ------------------------------
export async function cancelAppointment(id: number) {
  return invoke("admin-appointments-cancel", "PUT", { id });
}

// ------------------------------
// RESCHEDULE APPOINTMENT
// ------------------------------
export async function rescheduleAppointment(
  id: number,
  new_start_time: string,
  new_time_slot_id: string | null
) {
  return invoke("admin-appointments-reschedule", "PUT", {
    id,
    new_start_time,
    new_time_slot_id
  });
}
