
CREATE TABLE public.subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 1,
    washes_per_month INTEGER NOT NULL DEFAULT 4,
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (or just authenticated?)
CREATE POLICY "Plans are viewable by everyone." ON public.subscription_plans
  FOR SELECT USING (true);

-- Allow full access to admins (service role) - Supabase service role bypasses RLS,
-- but for user-facing admin panel we might need specific policies if we use client-side calls.
-- However, we are using Edge Functions for Admin CRUD, which use service role (or can).
-- If we want to allow 'admin' role users to edit via client:
-- (Assuming 'is_admin()' function exists from previous migration)

CREATE POLICY "Admins can insert plans." ON public.subscription_plans
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update plans." ON public.subscription_plans
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete plans." ON public.subscription_plans
  FOR DELETE USING (is_admin());
