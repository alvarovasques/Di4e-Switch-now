-- Create ai_agent_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  model_config jsonb NOT NULL DEFAULT '{
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
  }',
  prompt_templates jsonb NOT NULL DEFAULT '{
    "greeting": "Olá! Sou o assistente virtual. Como posso ajudar?",
    "system_prompt": "Você é um assistente útil e amigável para a empresa. Responda às perguntas do cliente de maneira educada e profissional.",
    "handoff_prompt": "Parece que esta questão requer assistência especializada. Vou transferir você para um atendente humano.",
    "fallback_prompt": "Desculpe, não entendi completamente sua pergunta. Poderia reformulá-la?"
  }',
  behavior_settings jsonb NOT NULL DEFAULT '{
    "confidence_threshold": 0.7,
    "max_conversation_turns": 10,
    "auto_handoff_enabled": true,
    "auto_handoff_threshold": 0.5,
    "auto_handoff_after_turns": 5,
    "use_knowledge_base": true,
    "knowledge_base_weight": 0.8
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'ai.conversation.started',
    'ai.conversation.completed',
    'ai.handoff.requested',
    'ai.handoff.completed',
    'ai.feedback.received',
    'ai.knowledge.used'
  )),
  agent_id uuid REFERENCES ai_agents(id),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_settings_agent_id 
ON ai_agent_settings(agent_id);

CREATE INDEX IF NOT EXISTS idx_ai_webhook_events_event_type 
ON ai_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_ai_webhook_events_conversation_id 
ON ai_webhook_events(conversation_id);

CREATE INDEX IF NOT EXISTS idx_ai_webhook_events_created_at 
ON ai_webhook_events(created_at);

-- Enable RLS
ALTER TABLE ai_agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_webhook_events ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can read AI agent settings" ON ai_agent_settings;
DROP POLICY IF EXISTS "Only admins and managers can manage AI agent settings" ON ai_agent_settings;
DROP POLICY IF EXISTS "Authenticated users can read AI agent settings_new" ON ai_agent_settings;
DROP POLICY IF EXISTS "Only admins and managers can manage AI agent settings_new" ON ai_agent_settings;
DROP POLICY IF EXISTS "Authenticated users can read AI webhook events" ON ai_webhook_events;
DROP POLICY IF EXISTS "Authenticated users can read AI webhook events_new" ON ai_webhook_events;

-- Create new policies with unique names
CREATE POLICY "AI agent settings readable by authenticated_20250502" 
  ON ai_agent_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "AI agent settings manageable by admins_20250502"
  ON ai_agent_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (
        agents.role = 'admin' OR 
        agents.role = 'manager'
      )
    )
  );

CREATE POLICY "AI webhook events readable by authorized_20250502"
  ON ai_webhook_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (
        agents.role = 'admin' OR 
        agents.role = 'manager' OR 
        (agents.permissions->>'can_view_metrics')::boolean = true
      )
    )
  );

-- Create/Replace function to get AI agent settings
CREATE OR REPLACE FUNCTION get_ai_agent_settings(
  agent_uuid uuid
)
RETURNS jsonb AS $$
DECLARE
  settings jsonb;
BEGIN
  SELECT 
    jsonb_build_object(
      'model_config', model_config,
      'prompt_templates', prompt_templates,
      'behavior_settings', behavior_settings
    ) INTO settings
  FROM ai_agent_settings
  WHERE agent_id = agent_uuid;
  
  IF settings IS NULL THEN
    -- Return default settings if none exist
    settings := jsonb_build_object(
      'model_config', '{
        "model": "gpt-4o",
        "temperature": 0.7,
        "max_tokens": 1000,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
      }'::jsonb,
      'prompt_templates', '{
        "greeting": "Olá! Sou o assistente virtual. Como posso ajudar?",
        "system_prompt": "Você é um assistente útil e amigável para a empresa. Responda às perguntas do cliente de maneira educada e profissional.",
        "handoff_prompt": "Parece que esta questão requer assistência especializada. Vou transferir você para um atendente humano.",
        "fallback_prompt": "Desculpe, não entendi completamente sua pergunta. Poderia reformulá-la?"
      }'::jsonb,
      'behavior_settings', '{
        "confidence_threshold": 0.7,
        "max_conversation_turns": 10,
        "auto_handoff_enabled": true,
        "auto_handoff_threshold": 0.5,
        "auto_handoff_after_turns": 5,
        "use_knowledge_base": true,
        "knowledge_base_weight": 0.8
      }'::jsonb
    );
  END IF;
  
  RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update AI agent performance
CREATE OR REPLACE FUNCTION update_ai_agent_performance(
  agent_uuid uuid,
  conversation_count integer DEFAULT 1,
  success_rate numeric DEFAULT NULL,
  resolution_time interval DEFAULT NULL,
  handoff_rate numeric DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_performance jsonb;
  new_performance jsonb;
  total_conversations integer;
BEGIN
  -- Get current performance metrics
  SELECT performance INTO current_performance
  FROM ai_agents
  WHERE id = agent_uuid;
  
  IF current_performance IS NULL THEN
    current_performance := '{
      "conversations_handled": 0,
      "success_rate": 0,
      "avg_resolution_time": "0s",
      "handoff_rate": 0
    }'::jsonb;
  END IF;
  
  -- Calculate new total conversations
  total_conversations := (current_performance->>'conversations_handled')::integer + conversation_count;
  
  -- Calculate new weighted average for success_rate if provided
  IF success_rate IS NOT NULL THEN
    success_rate := (
      ((current_performance->>'success_rate')::numeric * (current_performance->>'conversations_handled')::integer) +
      (success_rate * conversation_count)
    ) / total_conversations;
  ELSE
    success_rate := (current_performance->>'success_rate')::numeric;
  END IF;
  
  -- Calculate new weighted average for handoff_rate if provided
  IF handoff_rate IS NOT NULL THEN
    handoff_rate := (
      ((current_performance->>'handoff_rate')::numeric * (current_performance->>'conversations_handled')::integer) +
      (handoff_rate * conversation_count)
    ) / total_conversations;
  ELSE
    handoff_rate := (current_performance->>'handoff_rate')::numeric;
  END IF;
  
  -- Calculate new weighted average for resolution_time if provided
  IF resolution_time IS NOT NULL THEN
    -- Convert current avg_resolution_time from string to interval
    DECLARE
      current_resolution_time interval;
    BEGIN
      current_resolution_time := (current_performance->>'avg_resolution_time')::interval;
      
      -- Calculate weighted average
      resolution_time := (
        (current_resolution_time * (current_performance->>'conversations_handled')::integer) +
        (resolution_time * conversation_count)
      ) / total_conversations;
    EXCEPTION
      WHEN OTHERS THEN
        resolution_time := resolution_time;
    END;
  ELSE
    resolution_time := (current_performance->>'avg_resolution_time')::interval;
  END IF;
  
  -- Build new performance object
  new_performance := jsonb_build_object(
    'conversations_handled', total_conversations,
    'success_rate', success_rate,
    'avg_resolution_time', resolution_time,
    'handoff_rate', handoff_rate
  );
  
  -- Update agent performance
  UPDATE ai_agents
  SET 
    performance = new_performance,
    updated_at = now()
  WHERE id = agent_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to trigger AI webhook
CREATE OR REPLACE FUNCTION trigger_ai_webhook(
  event_type text,
  agent_uuid uuid,
  conversation_uuid uuid,
  payload jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  webhook_record RECORD;
BEGIN
  -- Insert webhook event
  INSERT INTO ai_webhook_events (
    event_type,
    agent_id,
    conversation_id,
    payload
  )
  VALUES (
    event_type,
    agent_uuid,
    conversation_uuid,
    payload
  );
  
  -- Find webhooks that should be triggered using proper FOR loop syntax
  FOR webhook_record IN 
    SELECT id FROM webhooks
    WHERE is_active = true
    AND event_type = ANY(events)
  LOOP
    -- Insert webhook event to be processed
    INSERT INTO webhook_events (
      webhook_id,
      event_type,
      payload
    )
    VALUES (
      webhook_record.id,
      event_type,
      jsonb_build_object(
        'event_type', event_type,
        'agent_id', agent_uuid,
        'conversation_id', conversation_uuid,
        'timestamp', now(),
        'data', payload
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default settings for existing AI agents
INSERT INTO ai_agent_settings (agent_id)
SELECT id FROM ai_agents
WHERE NOT EXISTS (
  SELECT 1 FROM ai_agent_settings
  WHERE ai_agent_settings.agent_id = ai_agents.id
);