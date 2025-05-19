/*
  # AI Conversation Logs and Metrics

  1. New Tables
    - ai_conversation_logs: Stores detailed logs of AI interactions
  
  2. Features
    - Track AI prompts and responses
    - Measure confidence scores
    - Record processing times
    - Collect user feedback
    - Enable performance analysis
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