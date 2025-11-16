-- supabase/migrations/20251115034800_create_admin_helper_functions.sql

-- Função para verificar se o usuário autenticado é um administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT (auth.role() = 'service_role') INTO is_admin_user;
  RETURN is_admin_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas agregadas de veículos
-- Esta é uma implementação de exemplo. Adapte conforme sua necessidade.
CREATE OR REPLACE FUNCTION get_vehicle_stats()
RETURNS TABLE (
  make TEXT,
  model TEXT,
  vehicle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.make,
    v.model,
    COUNT(v.id) AS vehicle_count
  FROM
    public.vehicles v
  GROUP BY
    v.make,
    v.model
  ORDER BY
    vehicle_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Concede permissão de execução para o role 'authenticated'
-- A segurança será aplicada dentro da Edge Function, que exige 'admin'
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_vehicle_stats() TO authenticated;
