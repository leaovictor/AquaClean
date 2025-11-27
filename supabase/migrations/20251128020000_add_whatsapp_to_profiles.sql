ALTER TABLE public.profiles
ADD COLUMN whatsapp_number TEXT,
ADD COLUMN phone_is_whatsapp BOOLEAN DEFAULT false;
