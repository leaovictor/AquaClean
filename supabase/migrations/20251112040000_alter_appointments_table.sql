-- Remove the foreign key constraint from the appointments table
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_time_slot_id_fkey;

-- Drop the time_slot_id column from the appointments table
ALTER TABLE public.appointments
DROP COLUMN IF EXISTS time_slot_id;

-- Add the appointment_time column to the appointments table
ALTER TABLE public.appointments
ADD COLUMN appointment_time TIMESTAMPTZ;

-- Add a unique constraint to the appointment_time column
ALTER TABLE public.appointments
ADD CONSTRAINT unique_appointment_time UNIQUE (appointment_time);
