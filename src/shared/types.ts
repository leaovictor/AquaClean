export interface Vehicle {
  id: number;
  make: string;
  model: string;
  plate: string;
  year?: number;
  color?: string;
  is_default?: boolean;
}

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  date: string;
  time: string;
}

export interface Appointment {
  id: number;
  status: string;
  service_type: string;
  start_time: string;
  total_price: number;
  created_at: string;
  special_instructions?: string;
  vehicle_id?: number;
  time_slot_id?: number;

  // Relacionamentos
  profiles?: {
    full_name: string;
    email: string;
  };

  vehicles?: {
    make: string;
    model: string;
    plate: string;
  };

  products?: any[];
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  washes_per_month: number;
  features: string[];
  is_active: boolean;
  recommended?: boolean;
}

export interface UserProfile {
  id: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  whatsapp_number?: string;
  phone_is_whatsapp?: boolean;
  subscription_status?: string;
  subscription_plan_id?: number;
}

export interface UserSubscription {
  plan_id: number;
  status: string;
  current_period_end: string;
  remaining_washes: number;
  auto_renew: boolean;
}
