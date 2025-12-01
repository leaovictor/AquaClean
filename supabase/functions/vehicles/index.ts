import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the user's auth context
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the user from the token
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    // Create an admin client to bypass RLS for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle GET request to fetch vehicles
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    // Handle POST request to create a new vehicle
    else if (req.method === 'POST') {
      const vehicleData = await req.json();

      // --- ABUSE PREVENTION: 30-Day Cooldown for Default Vehicle ---
      if (vehicleData.is_default) {
        // 1. Fetch user profile to check last_default_change
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('last_default_change')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile.last_default_change) {
          const lastChange = new Date(profile.last_default_change);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - lastChange.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 30) {
            return new Response(JSON.stringify({
              error: `Você só pode alterar seu veículo padrão uma vez a cada 30 dias. Próxima alteração permitida em ${30 - diffDays} dias.`
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            });
          }
        }

        // 2. Update last_default_change timestamp
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ last_default_change: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // 3. Unset is_default for all other vehicles
        const { error: unsetError } = await supabaseAdmin
          .from('vehicles')
          .update({ is_default: false })
          .eq('user_id', user.id);

        if (unsetError) throw unsetError;
      }
      // --- END ABUSE PREVENTION ---

      const newVehicle = {
        ...vehicleData,
        user_id: user.id,
        plate: vehicleData.plate ? vehicleData.plate.toUpperCase() : vehicleData.plate // Convert plate to uppercase
      };

      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .insert(newVehicle)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    // Handle other methods
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
