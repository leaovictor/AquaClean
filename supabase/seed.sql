-- Defer constraints to allow out-of-order inserts
SET CONSTRAINTS ALL DEFERRED;

-- Clear existing data
TRUNCATE TABLE time_slots RESTART IDENTITY CASCADE;

-- Insert time slots for weekdays (Monday=1 to Friday=5) from 9 AM to 5 PM
DO $$
DECLARE
    day_index INT;
    hour_index INT;
BEGIN
    FOR day_index IN 1..5 LOOP -- Monday to Friday (1 = Segunda, se 1=Sunday, ajuste a faixa)
        FOR hour_index IN 9..17 LOOP -- 9 AM to 5 PM (17:00)
            -- CORREÇÃO: day_of_week deve ser incluído no INSERT
            -- e, provavelmente, is_active deve ser is_available.
            INSERT INTO time_slots (day_of_week, start_time, end_time, is_available) 
            VALUES (
                day_index,
                (hour_index || ':00:00')::TIME,
                ((hour_index + 1) || ':00:00')::TIME,
                TRUE
            );
        END LOOP;
    END LOOP;
END $$;

-- Reset session replication role
SET session_replication_role = 'origin';

-- Você também deve ter a inserção de usuários e veículos AQUI, antes de qualquer teste.
-- (Verifique a ordem para evitar erros de FOREIGN KEY)