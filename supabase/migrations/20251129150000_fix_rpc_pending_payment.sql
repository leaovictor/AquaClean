-- Update create_appointment_with_check function to handle pending_payment retries
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
    -- 1. Auto-cancel any 'pending_payment' appointments for THIS user and THIS slot.
    --    This allows the user to retry a booking if they abandoned the previous payment flow.
    UPDATE public.appointments
    SET status = 'canceled'
    WHERE time_slot_id = p_time_slot_id 
    AND user_id = p_user_id 
    AND status = 'pending_payment';

    -- 2. Check for existing blocking appointments for the given time slot
    --    We check for scheduled, confirmed, and pending_payment (from OTHER users)
    SELECT count(*)
    INTO v_existing_count
    FROM public.appointments
    WHERE time_slot_id = p_time_slot_id 
    AND status IN ('scheduled', 'confirmed', 'pending_payment');

    -- If an appointment exists, return an error
    IF v_existing_count > 0 THEN
        RETURN json_build_object('error', 'The selected time slot is no longer available');
    END IF;

    -- 3. If the time slot is available, insert the new appointment
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
