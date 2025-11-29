import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            const { user_id, title, message, type, target_group } = await req.json();

            if ((!user_id && !target_group) || !title || !message) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            let usersToNotify: string[] = [];

            if (target_group) {
                let query = supabase.from('profiles').select('id');

                if (target_group === 'active_subscribers') {
                    query = query.eq('subscription_status', 'active');
                } else if (target_group === 'inactive_subscribers') {
                    query = query.neq('subscription_status', 'active').not('subscription_status', 'is', null);
                } else if (target_group === 'non_subscribers') {
                    query = query.is('subscription_status', null);
                }
                // 'all' - no filter needed

                const { data: profiles, error: profilesError } = await query;

                if (profilesError) throw profilesError;
                usersToNotify = profiles.map(p => p.id);
            } else {
                usersToNotify = [user_id];
            }

            // Add sender (Admin) to the list of recipients so they also receive a copy
            const authHeader = req.headers.get('Authorization');
            if (authHeader) {
                const { data: { user: sender }, error: senderError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
                if (sender && !senderError) {
                    if (!usersToNotify.includes(sender.id)) {
                        usersToNotify.push(sender.id);
                    }
                }
            }

            if (usersToNotify.length === 0) {
                return new Response(JSON.stringify({ message: 'No users found for the selected group' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const notifications = usersToNotify.map(uid => ({
                user_id: uid,
                title,
                message,
                type: type || 'system'
            }));

            const { data, error } = await supabase
                .from('notifications')
                .insert(notifications)
                .select();

            if (error) throw error;

            return new Response(JSON.stringify({ success: true, count: data.length }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // PUT /notifications - Mark as read
        if (req.method === 'PUT') {
            const { id, all } = await req.json();
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) throw new Error('No authorization header');
            const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
            if (userError || !user) throw new Error('Invalid token');

            if (all) {
                const { data, error } = await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('user_id', user.id)
                    .select();

                if (error) throw error;
                return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

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

        // DELETE /notifications - Delete notification(s)
        if (req.method === 'DELETE') {
            const { id, all } = await req.json();
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) throw new Error('No authorization header');
            const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
            if (userError || !user) throw new Error('Invalid token');

            if (all) {
                const { error } = await supabase
                    .from('notifications')
                    .delete()
                    .eq('user_id', user.id);

                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (!id) {
                return new Response(JSON.stringify({ error: 'Missing notification ID' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
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
