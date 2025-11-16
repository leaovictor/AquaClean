import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Função para criar uma resposta JSON padronizada
const createJsonResponse = (data: unknown, status = 200, headers = {}) => {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
    status,
  });
};

// Função para verificar se o usuário é um administrador
const isAdmin = async (supabaseClient: any): Promise<boolean> => {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return false;
  }
  const { data: adminData, error: rpcError } = await supabaseClient.rpc('is_admin');
  if (rpcError) {
    console.error("RPC is_admin error:", rpcError);
    return false;
  }
  return adminData === true;
};

serve(async (req: Request) => {
  // Trata a requisição OPTIONS (preflight) para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Cria o cliente Supabase com o header de autenticação do request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Verifica se o usuário tem a role 'admin'
    const userIsAdmin = await isAdmin(supabaseClient);
    if (!userIsAdmin) {
      return createJsonResponse({ error: "Acesso negado. Requer privilégios de administrador." }, 403);
    }

    // Executa as consultas em paralelo para otimizar o tempo de resposta
    const [plansResponse, slotsResponse, vehicleStatsResponse] = await Promise.all([
      supabaseClient.from("subscription_plans").select("*"),
      supabaseClient.from("time_slots").select("*"),
      supabaseClient.rpc("get_vehicle_stats")
    ]);

    // Verifica erros em cada consulta individualmente
    if (plansResponse.error) throw plansResponse.error;
    if (slotsResponse.error) throw slotsResponse.error;
    if (vehicleStatsResponse.error) throw vehicleStatsResponse.error;

    // Constrói o objeto de resposta final
    const responsePayload = {
      plans: plansResponse.data,
      slots: slotsResponse.data,
      vehicleStats: vehicleStatsResponse.data,
    };

    return createJsonResponse(responsePayload);

  } catch (error) {
    console.error("Erro ao buscar ativos:", error);
    return createJsonResponse({ error: error.message || "Ocorreu um erro interno no servidor." }, 500);
  }
});
