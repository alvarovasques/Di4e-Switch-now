/*
  # Fix RLS policy for ai_conversation_logs

  1. Changes
    - Create ai_conversation_logs table if it doesn't exist
    - Drop existing policy safely
    - Create new policy with proper permissions check
    - Add indexes for better performance

  2. Security
    - Ensure only users with metrics permission or admin role can view AI logs
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

-- Safely drop existing policy before creating a new one
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