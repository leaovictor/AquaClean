-- Fix RLS policies for subscription_plans
DROP POLICY IF EXISTS "Admins can insert plans." ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans." ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can delete plans." ON public.subscription_plans;

CREATE POLICY "Admins can insert plans." ON public.subscription_plans
  FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update plans." ON public.subscription_plans
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete plans." ON public.subscription_plans
  FOR DELETE USING (public.is_admin_user());

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies for services
CREATE POLICY "Services are viewable by everyone." ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert services." ON public.services
  FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update services." ON public.services
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete services." ON public.services
  FOR DELETE USING (public.is_admin_user());
