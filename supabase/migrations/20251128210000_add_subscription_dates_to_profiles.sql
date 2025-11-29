ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_plan_id BIGINT REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;
