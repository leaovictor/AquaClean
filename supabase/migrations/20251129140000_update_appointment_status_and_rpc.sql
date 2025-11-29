-- Update appointments table status check constraint

-- First, update any existing rows that don't match the new allowed values
UPDATE public.appointments
SET status = 'cancelled'
WHERE status NOT IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'pending_payment', 'canceled_by_customer', 'canceled_by_admin');

ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'pending_payment', 'canceled_by_customer', 'canceled_by_admin'));

-- Update create_appointment_with_check function to accept status
DROP FUNCTION IF EXISTS public.create_appointment_with_check;

CREATE OR REPLACE FUNCTION public.create_appointment_with_check(
    p_user_id uuid,
    p_vehicle_id bigint,
    p_time_slot_id bigint,
    p_service_type text,
    p_special_instructions text,
    p_start_time timestamp with time zone,
    p_end_time timestamp with time zone,
    p_products jsonb DEFAULT '[]'::jsonb,
    p_total_price numeric DEFAULT 0,
    p_status text DEFAULT 'scheduled'
)
RETURNS json AS $$
DECLARE
    v_existing_count integer;
    v_new_appointment json;
BEGIN
    -- Check for existing appointments for the given time slot
    -- We only care about confirmed or scheduled appointments blocking the slot
    -- pending_payment slots might block too, but usually we give them a timeout. 
    -- For simplicity, let's say pending_payment also blocks to avoid double booking while paying.
    SELECT count(*)
    INTO v_existing_count
    FROM public.appointments
    WHERE time_slot_id = p_time_slot_id AND status IN ('scheduled', 'confirmed', 'pending_payment');

    -- If an appointment exists, return an error
    IF v_existing_count > 0 THEN
        RETURN json_build_object('error', 'The selected time slot is no longer available');
    END IF;

    -- If the time slot is available, insert the new appointment
    INSERT INTO public.appointments(
        user_id, 
        vehicle_id, 
        time_slot_id, 
        service_type, 
        special_instructions, 
        start_time, 
        end_time, 
        status,
        products,
        total_price
    )
    VALUES (
        p_user_id, 
        p_vehicle_id, 
        p_time_slot_id, 
        p_service_type, 
        p_special_instructions, 
        p_start_time, 
        p_end_time, 
        p_status,
        p_products,
        p_total_price
    )
    RETURNING json_build_object(
        'id', id,
        'user_id', user_id,
        'vehicle_id', vehicle_id,
        'time_slot_id', time_slot_id,
        'service_type', service_type,
        'special_instructions', special_instructions,
        'start_time', start_time,
        'end_time', end_time,
        'status', status,
        'products', products,
        'total_price', total_price,
        'created_at', created_at
    ) INTO v_new_appointment;

    -- Return the newly created appointment
    RETURN v_new_appointment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
