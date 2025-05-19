/*
  # Add AI Chat Integration Schema

  1. New Tables
    - webhook_events: Track webhook events for AI integration
    - ai_conversation_logs: Store AI conversation history and metrics

  2. Changes
    - Add AI-specific fields to conversations table
    - Create functions for AI handoff logic
    - Add policies for AI system access
*/

-- Create webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  result_data jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create ai_conversation_logs table
CREATE TABLE IF NOT EXISTS ai_conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES ai_agents(id),
  prompt text NOT NULL,
  response text NOT NULL,
  tokens_used integer,
  processing_time interval,
  confidence_score numeric(3,2),
  feedback_score numeric(2,1),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_conversation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read AI conversation logs"
  ON ai_conversation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND ((agents.permissions->>'can_view_metrics')::boolean = true OR agents.role = 'admin')
    )
  );

-- Create function for AI handoff
CREATE OR REPLACE FUNCTION trigger_ai_handoff(
  conversation_uuid uuid,
  reason text DEFAULT 'low_confidence'
)
RETURNS void AS $$
DECLARE
  v_team_id uuid;
  v_department_id uuid;
BEGIN
  -- Get conversation details
  SELECT team_id, department_id INTO v_team_id, v_department_id
  FROM conversations
  WHERE id = conversation_uuid;
  
  -- Update conversation status
  UPDATE conversations
  SET 
    status = 'new',
    assigned_to = NULL,
    is_ai_handled = false,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{ai_handoff_reason}',
      to_jsonb(reason)
    ),
    updated_at = now()
  WHERE id = conversation_uuid;
  
  -- Create system message about handoff
  INSERT INTO messages (
    conversation_id,
    direction,
    message_type,
    content,
    sender_name
  )
  VALUES (
    conversation_uuid,
    'outbound',
    'system',
    'Esta conversa foi transferida para um atendente humano. ' || 
    CASE 
      WHEN reason = 'low_confidence' THEN 'O assistente virtual não conseguiu responder com confiança suficiente.'
      WHEN reason = 'complex_issue' THEN 'O problema requer análise mais detalhada de um especialista.'
      WHEN reason = 'customer_request' THEN 'O cliente solicitou falar com um atendente humano.'
      ELSE 'Transferência automática baseada nas regras do sistema.'
    END,
    'Sistema'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate AI confidence
CREATE OR REPLACE FUNCTION calculate_ai_confidence(
  conversation_uuid uuid
)
RETURNS numeric AS $$
DECLARE
  avg_confidence numeric(3,2);
BEGIN
  SELECT AVG(confidence_score) INTO avg_confidence
  FROM ai_conversation_logs
  WHERE conversation_id = conversation_uuid
  AND created_at > (now() - interval '1 hour');
  
  RETURN avg_confidence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversation_logs_conversation_id 
ON ai_conversation_logs(conversation_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_logs_agent_id 
ON ai_conversation_logs(agent_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_logs_created_at 
ON ai_conversation_logs(created_at);