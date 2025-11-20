-- Add RLS policies for admin access to appointments and profiles
-- Assuming the admin user has a specific email or metadata, or we rely on the is_admin() function
-- which currently checks for 'service_role'.
-- BUT, the client-side calls are made with the authenticated user's token, NOT the service role.
-- So 'auth.role() = service_role' will return FALSE for a logged-in admin user in the browser.

-- We need a way to identify admin users in RLS policies.
-- Standard approach: Check a claim in app_metadata or a field in profiles.
-- The existing `admin-customers` function checks `profile.role === 'admin'`.
-- So we should create a policy that checks this.

-- Function to check if the current user is an admin based on the profiles table
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Update Appointments Policies
CREATE POLICY "Admins can view all appointments." ON public.appointments
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all appointments." ON public.appointments
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete all appointments." ON public.appointments
  FOR DELETE USING (public.is_admin_user());

-- Update Profiles Policies
CREATE POLICY "Admins can view all profiles." ON public.profiles
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all profiles." ON public.profiles
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete all profiles." ON public.profiles
  FOR DELETE USING (public.is_admin_user());

-- Update Vehicles Policies
CREATE POLICY "Admins can view all vehicles." ON public.vehicles
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all vehicles." ON public.vehicles
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete all vehicles." ON public.vehicles
  FOR DELETE USING (public.is_admin_user());

-- Update Time Slots Policies (Admin needs full access)
-- Time slots might already be public read, but write needs admin
CREATE POLICY "Admins can insert time slots." ON public.time_slots
  FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update time slots." ON public.time_slots
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete time slots." ON public.time_slots
  FOR DELETE USING (public.is_admin_user());
