CREATE OR REPLACE FUNCTION public.get_booked_slots(
    p_start_date timestamp with time zone,
    p_end_date timestamp with time zone
)
RETURNS TABLE (
    start_time timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT a.start_time
    FROM public.appointments a
    WHERE a.start_time >= p_start_date
      AND a.start_time <= p_end_date
      AND a.status IN ('scheduled', 'confirmed', 'in_progress');
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_booked_slots(timestamp with time zone, timestamp with time zone) TO anon, authenticated;
