import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { pathname } = new URL(req.url);

        // GET /notifications - List notifications for current user
        if (req.method === 'GET') {
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) throw new Error('No authorization header');

            const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
            if (userError || !user) throw new Error('Invalid token');

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // POST /notifications - Send notification (Admin only or Service Role)
        if (req.method === 'POST') {
            const { user_id, title, message, type } = await req.json();

            if (!user_id || !title || !message) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const { data, error } = await supabase
                .from('notifications')
                .insert([
                    { user_id, title, message, type: type || 'system' }
                ])
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // PUT /notifications - Mark as read
        if (req.method === 'PUT') {
            const { id } = await req.json();

            if (!id) {
                return new Response(JSON.stringify({ error: 'Missing notification ID' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
