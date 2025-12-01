import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Admin Auth Check
        const supabaseUserClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
        )
        const { data: { user } } = await supabaseUserClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabaseUserClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') throw new Error('Forbidden')

        // 2. Execute SQL via RPC (if available) or direct connection if we had pg driver. 
        // Since we don't have direct PG access easily here without adding dependencies, 
        // we will use the Service Role to call a Postgres Function if it existed, 
        // BUT we don't have a generic 'exec_sql' function.

        // ALTERNATIVE: We can use the Supabase Management API if we had the Service Key, 
        // but usually we just want to run a migration.

        // WAIT. I cannot run arbitrary SQL from an Edge Function unless I have a "exec_sql" RPC function already defined in the DB.
        // If I don't have that, I cannot add a column from here.

        // RE-EVALUATION: I will skip adding the column via Edge Function because it's risky and might fail if 'exec_sql' isn't there.
        // INSTEAD, I will store 'payment_method' inside the 'products' JSONB array or 'special_instructions' for now, 
        // OR I will ask the user to run the SQL in the Supabase Dashboard SQL Editor.

        // Let's try to be smart. I'll return a message asking the user to run the SQL.
        // actually, I can just use the 'products' JSONB field to store metadata like:
        // products: [{id: 1, name: 'Service'}, {meta: true, payment_method: 'cash'}]
        // This is cleaner than failing.

        // HOWEVER, the user explicitly asked for "Gestão Financeira". A proper column is better.
        // I will assume the user CAN run SQL if I give it to them.

        return new Response(JSON.stringify({
            message: "Please run this SQL in your Supabase Dashboard SQL Editor:",
            sql: "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method text;"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
