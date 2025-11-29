-- Drop the constraint FIRST so we can update statuses
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Standardize on 'canceled' (single l) to match existing code
UPDATE public.appointments
SET status = 'canceled'
WHERE status = 'cancelled';

-- Update any other invalid statuses to 'canceled'
UPDATE public.appointments
SET status = 'canceled'
WHERE status NOT IN ('scheduled', 'confirmed', 'completed', 'canceled', 'pending_payment', 'canceled_by_customer', 'canceled_by_admin');

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'pending_payment', 'canceled_by_customer', 'canceled_by_admin'));
