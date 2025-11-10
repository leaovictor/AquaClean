import z from "zod";

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Vehicle Schema
export const VehicleSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().optional(),
  color: z.string().optional(),
  license_plate: z.string().optional(),
  is_default: z.boolean().default(false),
});

export type Vehicle = z.infer<typeof VehicleSchema>;

// Subscription Plan Schema
export const SubscriptionPlanSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  duration_months: z.number(),
  washes_per_month: z.number(),
  features: z.array(z.string()),
  is_active: z.boolean().default(true),
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

// User Subscription Schema
export const UserSubscriptionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  plan_id: z.number(),
  stripe_subscription_id: z.string().optional(),
  status: z.enum(['active', 'canceled', 'past_due', 'incomplete']),
  current_period_start: z.string().optional(),
  current_period_end: z.string().optional(),
  remaining_washes: z.number().default(0),
});

export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;

// Time Slot Schema
export const TimeSlotSchema = z.object({
  id: z.number(),
  date: z.string(), // YYYY-MM-DD format
  time: z.string(), // HH:MM format
  is_available: z.boolean().default(true),
  max_appointments: z.number().default(1),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

// Appointment Schema
export const AppointmentSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  vehicle_id: z.number(),
  time_slot_id: z.number(),
  service_type: z.enum(['basic', 'premium', 'deluxe']),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'canceled']).default('scheduled'),
  special_instructions: z.string().optional(),
  total_price: z.number().optional(),
  // Added properties for joined data
  vehicle: VehicleSchema.optional(),
  timeSlot: TimeSlotSchema.optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

// Notification Schema
export const NotificationSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['reminder', 'confirmation', 'promotion']),
  is_read: z.boolean().default(false),
  appointment_id: z.number().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// API Request/Response Schemas
export const CreateVehicleRequestSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(1900).max(new Date().getFullYear() + 2).optional(),
  color: z.string().optional(),
  license_plate: z.string().optional(),
  is_default: z.boolean().optional(),
});

export type CreateVehicleRequest = z.infer<typeof CreateVehicleRequestSchema>;

export const CreateAppointmentRequestSchema = z.object({
  vehicle_id: z.number(),
  time_slot_id: z.number(),
  service_type: z.enum(['basic', 'premium', 'deluxe']),
  special_instructions: z.string().optional(),
});

export type CreateAppointmentRequest = z.infer<typeof CreateAppointmentRequestSchema>;

export const UpdateProfileRequestSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
