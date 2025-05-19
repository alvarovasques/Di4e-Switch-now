/*
  # AI Conversation Logs Table

  1. New Table
    - `ai_conversation_logs` - Stores AI conversation data for analysis and improvement
      - Tracks prompts, responses, confidence scores, and user feedback
      - Links to conversations and AI agents
      - Enables performance monitoring and quality assessment

  2. Functions
    - `calculate_ai_confidence()` - Calculates average confidence for a conversation
    - `trigger_ai_handoff()` - Transfers conversation from AI to human agent

  3. Security
    - RLS enabled with policy for metrics viewing permission
    - Proper indexing for performance optimization
*/

-- Create ai_conversation_logs table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_conversation_logs_conversation_id 
ON ai_conversation_logs(conversation_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_logs_agent_id 
ON ai_conversation_logs(agent_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_logs_created_at 
ON ai_conversation_logs(created_at);

-- Enable RLS
ALTER TABLE ai_conversation_logs ENABLE ROW LEVEL SECURITY;

-- Safely create policy only if it doesn't exist
DO $$ 
DECLARE
  policy_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE policyname = 'Authenticated users can read AI conversation logs'
    AND tablename = 'ai_conversation_logs'
    AND schemaname = 'public'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE 'CREATE POLICY "Authenticated users can read AI conversation logs"
      ON ai_conversation_logs FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM agents
          WHERE agents.auth_id = auth.uid()
          AND ((agents.permissions->>''can_view_metrics'')::boolean = true OR agents.role = ''admin'')
        )
      )';
  END IF;
END $$;

-- Create function for AI confidence calculation
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