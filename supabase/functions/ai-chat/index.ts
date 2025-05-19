import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ChatRequest {
  message: string;
  conversation_id?: string;
  customer_id?: string;
  agent_id?: string;
  context?: string;
}

interface ChatResponse {
  response: string;
  conversation_id: string;
  confidence: number;
  processing_time: number;
  tokens_used: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get request data
    const requestData: ChatRequest = await req.json();
    
    if (!requestData.message) {
      throw new Error('Message is required');
    }

    if (!requestData.conversation_id && !requestData.customer_id) {
      throw new Error('Either conversation_id or customer_id is required');
    }

    // Start timing for processing time measurement
    const startTime = performance.now();

    // Get or create conversation
    let conversationId = requestData.conversation_id;
    if (!conversationId) {
      // Create new conversation
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', requestData.customer_id)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get AI agent
      let agentId = requestData.agent_id;
      if (!agentId) {
        // Get default agent
        const { data: defaultAgent } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('is_active', true)
          .eq('is_global', true)
          .limit(1)
          .single();

        if (defaultAgent) {
          agentId = defaultAgent.id;
        }
      }

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          customer_id: requestData.customer_id,
          channel_type: 'webchat',
          status: 'active',
          priority: 'medium',
          subject: 'AI Chat',
          is_ai_handled: true,
          conversation_type: 'ai_chat',
          knowledge_base_id: null, // Will be updated if we find a relevant knowledge base
          ai_confidence: null, // Will be updated after processing
        })
        .select()
        .single();

      if (convError) throw convError;
      conversationId = conversation.id;
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    // Format conversation history for the AI
    const conversationHistory = messages?.map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content
    })) || [];

    // Add the new message
    conversationHistory.push({
      role: 'user',
      content: requestData.message
    });

    // Get AI agent settings
    let aiSettings = {
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 1000,
      prompt_template: "You are a helpful assistant for a customer service platform. Answer the customer's questions accurately and professionally."
    };

    if (requestData.agent_id) {
      const { data: agent } = await supabase
        .from('ai_agents')
        .select('settings')
        .eq('id', requestData.agent_id)
        .single();

      if (agent?.settings) {
        aiSettings = {
          ...aiSettings,
          ...agent.settings
        };
      }
    }

    // In a real implementation, this would call an actual AI model
    // For this example, we'll simulate an AI response
    const simulatedResponse = {
      response: `Thank you for your question. Based on the information you've provided, I can help with that. ${requestData.message.includes('help') ? 'I understand you need assistance. How can I help you further?' : 'Is there anything else you would like to know?'}`,
      confidence: Math.random() * 0.3 + 0.7, // Random confidence between 0.7 and 1.0
      tokens_used: Math.floor(Math.random() * 500) + 100, // Random token count
    };

    // Record the AI response in the database
    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;
    
    // Store the customer message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'inbound',
        content: requestData.message,
        sender_name: 'Customer',
        message_type: 'text'
      });

    // Store the AI response
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'outbound',
        content: simulatedResponse.response,
        sender_name: 'AI Assistant',
        message_type: 'text'
      });

    // Log the AI conversation
    await supabase
      .from('ai_conversation_logs')
      .insert({
        conversation_id: conversationId,
        agent_id: requestData.agent_id,
        prompt: requestData.message,
        response: simulatedResponse.response,
        tokens_used: simulatedResponse.tokens_used,
        processing_time: `${Math.floor(processingTimeMs / 1000)} seconds`,
        confidence_score: simulatedResponse.confidence
      });

    // Update conversation with AI confidence
    await supabase
      .from('conversations')
      .update({
        ai_confidence: simulatedResponse.confidence,
        ai_response_time: `${Math.floor(processingTimeMs / 1000)} seconds`,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Return the response
    return new Response(
      JSON.stringify({
        response: simulatedResponse.response,
        conversation_id: conversationId,
        confidence: simulatedResponse.confidence,
        processing_time: processingTimeMs,
        tokens_used: simulatedResponse.tokens_used
      } as ChatResponse),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error processing AI chat:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
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