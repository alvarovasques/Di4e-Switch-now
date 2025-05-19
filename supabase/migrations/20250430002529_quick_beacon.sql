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

-- Drop policy if it exists to avoid errors
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can read AI conversation logs" ON ai_conversation_logs;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policy for ai_conversation_logs
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

-- Create function to analyze AI performance
CREATE OR REPLACE FUNCTION analyze_ai_performance(
  agent_uuid uuid,
  time_period interval DEFAULT interval '7 days'
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  WITH metrics AS (
    SELECT
      COUNT(*) as total_conversations,
      AVG(confidence_score) as avg_confidence,
      COUNT(CASE WHEN feedback_score >= 4 THEN 1 END)::float / 
        NULLIF(COUNT(CASE WHEN feedback_score IS NOT NULL THEN 1 END), 0) as satisfaction_rate,
      AVG(tokens_used) as avg_tokens,
      AVG(EXTRACT(EPOCH FROM processing_time)) as avg_processing_seconds
    FROM ai_conversation_logs
    WHERE agent_id = agent_uuid
    AND created_at > (now() - time_period)
  )
  SELECT jsonb_build_object(
    'total_conversations', COALESCE((SELECT total_conversations FROM metrics), 0),
    'avg_confidence', COALESCE((SELECT avg_confidence FROM metrics), 0),
    'satisfaction_rate', COALESCE((SELECT satisfaction_rate FROM metrics), 0),
    'avg_tokens', COALESCE((SELECT avg_tokens FROM metrics), 0),
    'avg_processing_seconds', COALESCE((SELECT avg_processing_seconds FROM metrics), 0)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate AI metrics snapshot
CREATE OR REPLACE FUNCTION generate_ai_metrics_snapshot()
RETURNS void AS $$
DECLARE
  daily_metrics jsonb;
  weekly_metrics jsonb;
  monthly_metrics jsonb;
BEGIN
  -- Daily metrics
  WITH daily AS (
    SELECT
      COUNT(*) as conversations,
      AVG(confidence_score) as confidence,
      COUNT(CASE WHEN feedback_score >= 4 THEN 1 END)::float / 
        NULLIF(COUNT(CASE WHEN feedback_score IS NOT NULL THEN 1 END), 0) as satisfaction,
      AVG(tokens_used) as tokens,
      AVG(EXTRACT(EPOCH FROM processing_time)) as response_time
    FROM ai_conversation_logs
    WHERE created_at > (now() - interval '1 day')
  )
  SELECT jsonb_build_object(
    'conversations', COALESCE((SELECT conversations FROM daily), 0),
    'confidence', COALESCE((SELECT confidence FROM daily), 0),
    'satisfaction', COALESCE((SELECT satisfaction FROM daily), 0),
    'tokens', COALESCE((SELECT tokens FROM daily), 0),
    'response_time', COALESCE((SELECT response_time FROM daily), 0)
  ) INTO daily_metrics;
  
  -- Weekly metrics
  WITH weekly AS (
    SELECT
      COUNT(*) as conversations,
      AVG(confidence_score) as confidence,
      COUNT(CASE WHEN feedback_score >= 4 THEN 1 END)::float / 
        NULLIF(COUNT(CASE WHEN feedback_score IS NOT NULL THEN 1 END), 0) as satisfaction,
      AVG(tokens_used) as tokens,
      AVG(EXTRACT(EPOCH FROM processing_time)) as response_time
    FROM ai_conversation_logs
    WHERE created_at > (now() - interval '7 days')
  )
  SELECT jsonb_build_object(
    'conversations', COALESCE((SELECT conversations FROM weekly), 0),
    'confidence', COALESCE((SELECT confidence FROM weekly), 0),
    'satisfaction', COALESCE((SELECT satisfaction FROM weekly), 0),
    'tokens', COALESCE((SELECT tokens FROM weekly), 0),
    'response_time', COALESCE((SELECT response_time FROM weekly), 0)
  ) INTO weekly_metrics;
  
  -- Monthly metrics
  WITH monthly AS (
    SELECT
      COUNT(*) as conversations,
      AVG(confidence_score) as confidence,
      COUNT(CASE WHEN feedback_score >= 4 THEN 1 END)::float / 
        NULLIF(COUNT(CASE WHEN feedback_score IS NOT NULL THEN 1 END), 0) as satisfaction,
      AVG(tokens_used) as tokens,
      AVG(EXTRACT(EPOCH FROM processing_time)) as response_time
    FROM ai_conversation_logs
    WHERE created_at > (now() - interval '30 days')
  )
  SELECT jsonb_build_object(
    'conversations', COALESCE((SELECT conversations FROM monthly), 0),
    'confidence', COALESCE((SELECT confidence FROM monthly), 0),
    'satisfaction', COALESCE((SELECT satisfaction FROM monthly), 0),
    'tokens', COALESCE((SELECT tokens FROM monthly), 0),
    'response_time', COALESCE((SELECT response_time FROM monthly), 0)
  ) INTO monthly_metrics;
  
  -- Insert snapshots
  INSERT INTO metrics_snapshots (metrics_type, period, metrics)
  VALUES 
    ('ai_performance', 'daily', daily_metrics),
    ('ai_performance', 'weekly', weekly_metrics),
    ('ai_performance', 'monthly', monthly_metrics);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;