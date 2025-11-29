


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."create_appointment_with_check"("p_user_id" "uuid", "p_vehicle_id" bigint, "p_time_slot_id" bigint, "p_service_type" "text", "p_special_instructions" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_products" "jsonb" DEFAULT '[]'::"jsonb", "p_total_price" numeric DEFAULT 0, "p_status" "text" DEFAULT 'scheduled'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_existing_count integer;
    v_new_appointment json;
BEGIN
    -- 1. Auto-cancel any 'pending_payment' appointments for THIS user and THIS slot.
    --    This allows the user to retry a booking if they abandoned the previous payment flow.
    UPDATE public.appointments
    SET status = 'canceled'
    WHERE time_slot_id = p_time_slot_id 
    AND user_id = p_user_id 
    AND status = 'pending_payment';

    -- 2. Check for existing blocking appointments for the given time slot
    --    We check for scheduled, confirmed, and pending_payment (from OTHER users)
    SELECT count(*)
    INTO v_existing_count
    FROM public.appointments
    WHERE time_slot_id = p_time_slot_id 
    AND status IN ('scheduled', 'confirmed', 'pending_payment');

    -- If an appointment exists, return an error
    IF v_existing_count > 0 THEN
        RETURN json_build_object('error', 'The selected time slot is no longer available');
    END IF;

    -- 3. If the time slot is available, insert the new appointment
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
        p_status,
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
$$;


ALTER FUNCTION "public"."create_appointment_with_check"("p_user_id" "uuid", "p_vehicle_id" bigint, "p_time_slot_id" bigint, "p_service_type" "text", "p_special_instructions" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_products" "jsonb", "p_total_price" numeric, "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_booked_slots"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS TABLE("start_time" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_booked_slots"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vehicle_stats"() RETURNS TABLE("make" "text", "model" "text", "vehicle_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_vehicle_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_profile_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_profile_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT (auth.role() = 'service_role') INTO is_admin_user;
  RETURN is_admin_user;
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointment_logs" (
    "id" bigint NOT NULL,
    "appointment_id" integer NOT NULL,
    "action" "text" NOT NULL,
    "previous_value" "jsonb",
    "new_value" "jsonb",
    "admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."appointment_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."appointment_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."appointment_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."appointment_logs_id_seq" OWNED BY "public"."appointment_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "vehicle_id" integer,
    "start_time" timestamp with time zone NOT NULL,
    "service_type" "text" DEFAULT 'basic'::"text" NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "special_instructions" "text",
    "total_price" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "time_slot_id" bigint,
    "end_time" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "is_emergency" boolean DEFAULT false,
    "canceled_reason" "text",
    "confirmed_at" timestamp with time zone,
    "products" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text", 'completed'::"text", 'canceled'::"text", 'pending_payment'::"text", 'canceled_by_customer'::"text", 'canceled_by_admin'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."appointments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."appointments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."appointments_id_seq" OWNED BY "public"."appointments"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'system'::"text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."products_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."products_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."products_id_seq" OWNED BY "public"."products"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "role" "text" DEFAULT 'customer'::"text",
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "subscription_status" "text" DEFAULT 'inactive'::"text",
    "whatsapp_number" "text",
    "phone_is_whatsapp" boolean DEFAULT false,
    "subscription_plan_id" bigint,
    "subscription_start_date" timestamp with time zone,
    "subscription_end_date" timestamp with time zone,
    "auto_renew" boolean DEFAULT true,
    "stripe_customer_id" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "duration_minutes" integer DEFAULT 60 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."services_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."services_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."services_id_seq" OWNED BY "public"."services"."id";



CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "duration_months" integer DEFAULT 1 NOT NULL,
    "washes_per_month" integer DEFAULT 4 NOT NULL,
    "features" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."subscription_plans_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."subscription_plans_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subscription_plans_id_seq" OWNED BY "public"."subscription_plans"."id";



CREATE TABLE IF NOT EXISTS "public"."time_slots" (
    "id" integer NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_available" boolean DEFAULT true NOT NULL,
    CONSTRAINT "time_slots_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."time_slots" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."time_slots_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."time_slots_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."time_slots_id_seq" OWNED BY "public"."time_slots"."id";



CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "plate" "text" NOT NULL,
    "model" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_default" boolean DEFAULT false,
    "make" "text",
    "year" "text"
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."vehicles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."vehicles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vehicles_id_seq" OWNED BY "public"."vehicles"."id";



ALTER TABLE ONLY "public"."appointment_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."appointment_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."appointments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."appointments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."products" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."products_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."services" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."services_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."subscription_plans" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subscription_plans_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."time_slots" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."time_slots_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vehicles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vehicles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."appointment_logs"
    ADD CONSTRAINT "appointment_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_slots"
    ADD CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_plate_key" UNIQUE ("plate");



CREATE INDEX "idx_appointments_start_time" ON "public"."appointments" USING "btree" ("start_time");



CREATE INDEX "idx_appointments_status" ON "public"."appointments" USING "btree" ("status");



CREATE UNIQUE INDEX "unique_active_appointment_on_time_slot" ON "public"."appointments" USING "btree" ("time_slot_id") WHERE ("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text"]));



CREATE OR REPLACE TRIGGER "on_profile_update" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_profile_update"();



ALTER TABLE ONLY "public"."appointment_logs"
    ADD CONSTRAINT "appointment_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "public"."time_slots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete all appointments." ON "public"."appointments" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can delete all profiles." ON "public"."profiles" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can delete all vehicles." ON "public"."vehicles" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can delete plans." ON "public"."subscription_plans" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can delete products." ON "public"."products" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can delete services." ON "public"."services" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can delete time slots." ON "public"."time_slots" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert plans." ON "public"."subscription_plans" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert products." ON "public"."products" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert services." ON "public"."services" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert time slots." ON "public"."time_slots" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update all appointments." ON "public"."appointments" FOR UPDATE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can update all profiles." ON "public"."profiles" FOR UPDATE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can update all vehicles." ON "public"."vehicles" FOR UPDATE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can update plans." ON "public"."subscription_plans" FOR UPDATE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can update products." ON "public"."products" FOR UPDATE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can update services." ON "public"."services" FOR UPDATE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can update time slots." ON "public"."time_slots" FOR UPDATE USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view all appointments." ON "public"."appointments" FOR SELECT USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view all profiles." ON "public"."profiles" FOR SELECT USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view all vehicles." ON "public"."vehicles" FOR SELECT USING ("public"."is_admin_user"());



CREATE POLICY "Allow all users to view time slots" ON "public"."time_slots" FOR SELECT USING (true);



CREATE POLICY "Allow service_role to manage time slots" ON "public"."time_slots" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Plans are viewable by everyone." ON "public"."subscription_plans" FOR SELECT USING (true);



CREATE POLICY "Products are viewable by everyone." ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Service role full access" ON "public"."notifications" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Services are viewable by everyone." ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Users can create appointments." ON "public"."appointments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create vehicles." ON "public"."vehicles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own appointments." ON "public"."appointments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own vehicles." ON "public"."vehicles" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own appointments." ON "public"."appointments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own vehicles." ON "public"."vehicles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own appointments." ON "public"."appointments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own vehicles." ON "public"."vehicles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_appointment_with_check"("p_user_id" "uuid", "p_vehicle_id" bigint, "p_time_slot_id" bigint, "p_service_type" "text", "p_special_instructions" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_products" "jsonb", "p_total_price" numeric, "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_appointment_with_check"("p_user_id" "uuid", "p_vehicle_id" bigint, "p_time_slot_id" bigint, "p_service_type" "text", "p_special_instructions" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_products" "jsonb", "p_total_price" numeric, "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_appointment_with_check"("p_user_id" "uuid", "p_vehicle_id" bigint, "p_time_slot_id" bigint, "p_service_type" "text", "p_special_instructions" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_products" "jsonb", "p_total_price" numeric, "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_booked_slots"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_booked_slots"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_booked_slots"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vehicle_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_vehicle_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vehicle_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_profile_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_profile_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_profile_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON TABLE "public"."appointment_logs" TO "anon";
GRANT ALL ON TABLE "public"."appointment_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appointment_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appointment_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appointment_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appointments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appointments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appointments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subscription_plans_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subscription_plans_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subscription_plans_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."time_slots" TO "anon";
GRANT ALL ON TABLE "public"."time_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."time_slots" TO "service_role";



GRANT ALL ON SEQUENCE "public"."time_slots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."time_slots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."time_slots_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vehicles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vehicles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vehicles_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







