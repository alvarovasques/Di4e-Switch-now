import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const channelId = new URL(req.url).searchParams.get('channel');
    if (!channelId) {
      throw new Error('Channel ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get channel configuration
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      throw new Error('Channel not found');
    }

    if (!channel.is_active) {
      throw new Error('Channel is inactive');
    }

    // Parse incoming message data
    const messageData = await req.json();

    // Register inbound message using RPC function
    const { error: rpcError } = await supabase.rpc('register_inbound_message', {
      p_channel_type: channel.type,
      p_external_id: messageData.from || 'unknown',
      p_content: messageData.content || '',
      p_message_type: messageData.type || 'text',
    });

    if (rpcError) {
      throw rpcError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});