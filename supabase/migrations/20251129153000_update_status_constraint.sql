-- Update appointment status constraint to include operational statuses
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check 
CHECK (status IN (
    'scheduled', 
    'confirmed', 
    'checked_in', 
    'in_progress', 
    'ready_for_pickup', 
    'completed', 
    'canceled', 
    'pending_payment', 
    'canceled_by_customer', 
    'canceled_by_admin',
    'no_show'
));
