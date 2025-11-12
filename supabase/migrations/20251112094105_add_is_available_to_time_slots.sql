-- Adiciona a coluna 'is_available' com valor padrão TRUE (disponível)
ALTER TABLE public.time_slots
ADD COLUMN is_available boolean DEFAULT TRUE;

-- Opcional: Garante que a coluna terá sempre um valor.
ALTER TABLE public.time_slots
ALTER COLUMN is_available SET NOT NULL;