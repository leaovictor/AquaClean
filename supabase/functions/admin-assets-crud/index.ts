import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Função para criar uma resposta JSON padronizada
const createJsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
};

// Função para verificar se o usuário é um administrador
const isAdmin = async (supabaseClient: SupabaseClient): Promise<boolean> => {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) return false;
  const { data: isAdmin } = await supabaseClient.rpc('is_admin');
  return isAdmin === true;
};

// Função principal que trata as requisições
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    if (!await isAdmin(supabaseClient)) {
      return createJsonResponse({ error: "Acesso negado." }, 403);
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const resource = pathSegments[pathSegments.length - 2];
    const resourceId = pathSegments[pathSegments.length - 1];

    let tableName: string;
    if (resource === 'plans') {
      tableName = 'subscription_plans';
    } else if (resource === 'slots') {
      tableName = 'time_slots';
    } else {
      return createJsonResponse({ error: "Recurso inválido. Use 'plans' ou 'slots'." }, 400);
    }

    let responseData;
    const body = req.body ? await req.json() : null;

    switch (req.method) {
      case 'POST': {
        const { data, error } = await supabaseClient.from(tableName).insert(body).select().single();
        if (error) throw error;
        responseData = data;
        break;
      }
      case 'PUT': {
        if (!resourceId) return createJsonResponse({ error: "ID do recurso é obrigatório para PUT." }, 400);
        const { data, error } = await supabaseClient.from(tableName).update(body).eq('id', resourceId).select().single();
        if (error) throw error;
        responseData = data;
        break;
      }
      case 'DELETE': {
        if (!resourceId) return createJsonResponse({ error: "ID do recurso é obrigatório para DELETE." }, 400);
        const { error } = await supabaseClient.from(tableName).delete().eq('id', resourceId);
        if (error) throw error;
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      default:
        return createJsonResponse({ error: "Método não permitido." }, 405);
    }

    return createJsonResponse(responseData);

  } catch (error) {
    console.error("Erro na função CRUD:", error);
    return createJsonResponse({ error: error.message || "Erro interno do servidor." }, 500);
  }
});
