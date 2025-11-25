export interface Vehicle {
  id: number;
  make: string;
  model: string;
  plate: string;
}

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
}

export interface Appointment {
  id: number;
  status: string;
  service_type: string;
  start_time: string;
  total_price: number;
  created_at: string;
  special_instructions?: string;

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
}
