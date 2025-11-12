-- 1. Drop the existing function to be replaced
DROP FUNCTION IF EXISTS public.create_appointment_with_check;

-- 2. Recreate the function with the new signature and logic
CREATE OR REPLACE FUNCTION public.create_appointment_with_check(
    p_user_id uuid,
    p_vehicle_id bigint,
    p_time_slot_id bigint,
    p_service_type text,
    p_special_instructions text,
    p_appointment_date date,
    p_appointment_time time without time zone
)
RETURNS json AS $$
DECLARE
    v_existing_count integer;
    v_new_appointment json;
BEGIN
    -- Check for existing appointments for the given time slot
    SELECT count(*)
    INTO v_existing_count
    FROM public.appointments
    WHERE time_slot_id = p_time_slot_id AND status IN ('scheduled', 'confirmed');

    -- If an appointment exists, return an error
    IF v_existing_count > 0 THEN
        RETURN json_build_object('error', 'The selected time slot is no longer available');
    END IF;

    -- If the time slot is available, insert the new appointment
    INSERT INTO public.appointments(user_id, vehicle_id, time_slot_id, service_type, special_instructions, appointment_date, appointment_time, status)
    VALUES (p_user_id, p_vehicle_id, p_time_slot_id, p_service_type, p_special_instructions, p_appointment_date, p_appointment_time, 'scheduled')
    RETURNING json_build_object(
        'id', id,
        'user_id', user_id,
        'vehicle_id', vehicle_id,
        'time_slot_id', time_slot_id,
        'service_type', service_type,
        'special_instructions', special_instructions,
        'appointment_date', appointment_date,
        'appointment_time', appointment_time,
        'status', status,
        'created_at', created_at
    ) INTO v_new_appointment;

    -- Return the newly created appointment
    RETURN v_new_appointment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
