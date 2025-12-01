import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUserClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
        )

        // --- 1. Admin Authentication and Authorization ---
        const { data: { user } } = await supabaseUserClient.auth.getUser()
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { data: profile } = await supabaseUserClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }
        // --- End of Authorization ---

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        switch (req.method) {
            case 'GET': {
                const url = new URL(req.url)
                const userId = url.searchParams.get('user_id')

                if (!userId) {
                    return new Response(JSON.stringify({ error: 'Missing user_id' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 400,
                    })
                }

                const { data, error } = await supabaseAdmin
                    .from('vehicles')
                    .select('*')
                    .eq('user_id', userId)

                if (error) throw error

                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }

            case 'POST': {
                const body = await req.json()

                // Validate required fields
                if (!body.user_id || !body.plate || !body.make || !body.model) {
                    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 400,
                    })
                }

                const newVehicle = {
                    ...body,
                    plate: body.plate.toUpperCase()
                }

                const { data, error } = await supabaseAdmin
                    .from('vehicles')
                    .insert(newVehicle)
                    .select()
                    .single()

                if (error) throw error

                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 201,
                })
            }

            case 'PUT': {
                const body = await req.json()
                if (!body.id) {
                    return new Response(JSON.stringify({ error: 'Missing vehicle ID' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 400,
                    })
                }

                const { id, ...updates } = body
                if (updates.plate) updates.plate = updates.plate.toUpperCase()

                const { data, error } = await supabaseAdmin
                    .from('vehicles')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single()

                if (error) throw error

                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }

            case 'DELETE': {
                const url = new URL(req.url)
                const id = url.searchParams.get('id')

                if (!id) {
                    return new Response(JSON.stringify({ error: 'Missing vehicle ID' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 400,
                    })
                }

                const { error } = await supabaseAdmin
                    .from('vehicles')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                return new Response(JSON.stringify({ message: "Vehicle deleted" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }

            default: {
                return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 405,
                })
            }
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
