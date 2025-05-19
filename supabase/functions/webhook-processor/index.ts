import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// CORS headers para permitir solicitações de diferentes origens
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret",
};

Deno.serve(async (req) => {
  // Lidar com solicitações de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Validar método
    if (req.method !== "POST") {
      throw new Error(`Método ${req.method} não suportado`);
    }

    // Inicializar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Analisar o corpo da solicitação
    const requestData = await req.json();
    
    // Obter ID do evento webhook
    const webhookEventId = requestData.webhook_event_id;
    if (!webhookEventId) {
      throw new Error("ID do evento webhook não fornecido");
    }
    
    // Buscar detalhes do evento
    const { data: webhookEvent, error: eventError } = await supabase
      .from("webhook_events")
      .select(`
        id,
        webhook_id,
        event_type,
        payload,
        status,
        webhook:webhooks(url, secret_key)
      `)
      .eq("id", webhookEventId)
      .single();
      
    if (eventError || !webhookEvent) {
      throw new Error("Evento webhook não encontrado");
    }
    
    if (webhookEvent.status !== "received") {
      throw new Error(`Evento já processado com status: ${webhookEvent.status}`);
    }
    
    // Enviar webhook para o destino
    const webhookUrl = webhookEvent.webhook.url;
    const secretKey = webhookEvent.webhook.secret_key;
    
    console.log(`Enviando webhook para ${webhookUrl}`);
    
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secretKey,
      },
      body: JSON.stringify({
        event_type: webhookEvent.event_type,
        timestamp: new Date().toISOString(),
        data: webhookEvent.payload,
      }),
    });
    
    const responseStatus = webhookResponse.status;
    const responseBody = await webhookResponse.text();
    
    // Atualizar status do evento
    const status = responseStatus >= 200 && responseStatus < 300 ? "processed" : "failed";
    
    await supabase
      .from("webhook_events")
      .update({
        status,
        processed_at: new Date().toISOString(),
        result_data: {
          status_code: responseStatus,
          response: responseBody,
        },
      })
      .eq("id", webhookEventId);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Webhook processado com status: ${status}`,
        status_code: responseStatus,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`Erro ao processar webhook: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});