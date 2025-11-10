import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's auth context
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the token
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    // Check if the user is an admin
    const { data: profile, error: profileError } = await userSupabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Create an admin client to bypass RLS for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle POST request for bulk operations
    if (req.method === 'POST') {
      const { newSlots, editedSlots, deletedSlotIds } = await req.json();
      const results = {
        new: [],
        edited: [],
        deleted: deletedSlotIds.length,
      };

      // Create new slots
      if (newSlots && newSlots.length > 0) {
        const { data, error } = await supabaseAdmin
          .from('time_slots')
          .insert(newSlots)
          .select();
        if (error) throw new Error(`Error creating new slots: ${error.message}`);
        results.new = data;
      }

      // Update existing slots
      if (editedSlots && editedSlots.length > 0) {
        for (const slot of editedSlots) {
          const { id, ...updateData } = slot;
          const { data, error } = await supabaseAdmin
            .from('time_slots')
            .update(updateData)
            .eq('id', id)
            .select();
          if (error) throw new Error(`Error updating slot ${id}: ${error.message}`);
          results.edited.push(data[0]);
        }
      }

      // Delete slots
      if (deletedSlotIds && deletedSlotIds.length > 0) {
        const { error } = await supabaseAdmin
          .from('time_slots')
          .delete()
          .in('id', deletedSlotIds);
        if (error) throw new Error(`Error deleting slots: ${error.message}`);
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // Handle other methods
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
