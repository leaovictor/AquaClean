-- Create products table
CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies for products
CREATE POLICY "Products are viewable by everyone." ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert products." ON public.products
    FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update products." ON public.products
    FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete products." ON public.products
    FOR DELETE USING (public.is_admin_user());

-- Update appointments table to store selected products
ALTER TABLE public.appointments
ADD COLUMN products JSONB DEFAULT '[]'::jsonb;

-- Update create_appointment_with_check function to accept products and total_price
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
    p_total_price numeric DEFAULT 0
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
        'scheduled',
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
