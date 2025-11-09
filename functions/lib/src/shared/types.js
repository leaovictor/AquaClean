"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileRequestSchema = exports.CreateAppointmentRequestSchema = exports.CreateVehicleRequestSchema = exports.NotificationSchema = exports.AppointmentSchema = exports.TimeSlotSchema = exports.UserSubscriptionSchema = exports.SubscriptionPlanSchema = exports.VehicleSchema = exports.UserProfileSchema = void 0;
const zod_1 = __importDefault(require("zod"));
// User Profile Schema
exports.UserProfileSchema = zod_1.default.object({
    id: zod_1.default.string(),
    email: zod_1.default.string().email(),
    first_name: zod_1.default.string().optional(),
    last_name: zod_1.default.string().optional(),
    phone: zod_1.default.string().optional(),
    address: zod_1.default.string().optional(),
    city: zod_1.default.string().optional(),
    state: zod_1.default.string().optional(),
    zip_code: zod_1.default.string().optional(),
});
// Vehicle Schema
exports.VehicleSchema = zod_1.default.object({
    id: zod_1.default.number(),
    user_id: zod_1.default.string(),
    make: zod_1.default.string(),
    model: zod_1.default.string(),
    year: zod_1.default.number().optional(),
    color: zod_1.default.string().optional(),
    license_plate: zod_1.default.string().optional(),
    is_default: zod_1.default.boolean().default(false),
});
// Subscription Plan Schema
exports.SubscriptionPlanSchema = zod_1.default.object({
    id: zod_1.default.number(),
    name: zod_1.default.string(),
    description: zod_1.default.string().optional(),
    price: zod_1.default.number(),
    duration_months: zod_1.default.number(),
    washes_per_month: zod_1.default.number(),
    features: zod_1.default.array(zod_1.default.string()),
    is_active: zod_1.default.boolean().default(true),
});
// User Subscription Schema
exports.UserSubscriptionSchema = zod_1.default.object({
    id: zod_1.default.number(),
    user_id: zod_1.default.string(),
    plan_id: zod_1.default.number(),
    stripe_subscription_id: zod_1.default.string().optional(),
    status: zod_1.default.enum(['active', 'canceled', 'past_due', 'incomplete']),
    current_period_start: zod_1.default.string().optional(),
    current_period_end: zod_1.default.string().optional(),
    remaining_washes: zod_1.default.number().default(0),
});
// Time Slot Schema
exports.TimeSlotSchema = zod_1.default.object({
    id: zod_1.default.number(),
    date: zod_1.default.string(), // YYYY-MM-DD format
    time: zod_1.default.string(), // HH:MM format
    is_available: zod_1.default.boolean().default(true),
    max_appointments: zod_1.default.number().default(1),
});
// Appointment Schema
exports.AppointmentSchema = zod_1.default.object({
    id: zod_1.default.number(),
    user_id: zod_1.default.string(),
    vehicle_id: zod_1.default.number(),
    time_slot_id: zod_1.default.number(),
    service_type: zod_1.default.enum(['basic', 'premium', 'deluxe']),
    status: zod_1.default.enum(['scheduled', 'in_progress', 'completed', 'canceled']).default('scheduled'),
    special_instructions: zod_1.default.string().optional(),
    total_price: zod_1.default.number().optional(),
});
// Notification Schema
exports.NotificationSchema = zod_1.default.object({
    id: zod_1.default.number(),
    user_id: zod_1.default.string(),
    title: zod_1.default.string(),
    message: zod_1.default.string(),
    type: zod_1.default.enum(['reminder', 'confirmation', 'promotion']),
    is_read: zod_1.default.boolean().default(false),
    appointment_id: zod_1.default.number().optional(),
});
// API Request/Response Schemas
exports.CreateVehicleRequestSchema = zod_1.default.object({
    make: zod_1.default.string().min(1),
    model: zod_1.default.string().min(1),
    year: zod_1.default.number().min(1900).max(new Date().getFullYear() + 2).optional(),
    color: zod_1.default.string().optional(),
    license_plate: zod_1.default.string().optional(),
    is_default: zod_1.default.boolean().optional(),
});
exports.CreateAppointmentRequestSchema = zod_1.default.object({
    vehicle_id: zod_1.default.number(),
    time_slot_id: zod_1.default.number(),
    service_type: zod_1.default.enum(['basic', 'premium', 'deluxe']),
    special_instructions: zod_1.default.string().optional(),
});
exports.UpdateProfileRequestSchema = zod_1.default.object({
    first_name: zod_1.default.string().optional(),
    last_name: zod_1.default.string().optional(),
    phone: zod_1.default.string().optional(),
    address: zod_1.default.string().optional(),
    city: zod_1.default.string().optional(),
    state: zod_1.default.string().optional(),
    zip_code: zod_1.default.string().optional(),
});
//# sourceMappingURL=types.js.map