/*
  # Fix AI Conversation Logs Policy

  1. Changes
    - Checks if the table exists before attempting operations
    - Drops any existing policy with the same name
    - Creates a new, simpler policy with proper permissions
    - Uses a direct approach without complex conditionals
*/

-- First check if the table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'ai_conversation_logs'
  ) THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Authenticated users can read AI conversation logs" ON ai_conversation_logs;
    
    -- Ensure RLS is enabled
    ALTER TABLE ai_conversation_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create a clean policy with a simpler condition
    CREATE POLICY "Authenticated users can read AI conversation logs"
      ON ai_conversation_logs 
      FOR SELECT
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
  END IF;
END $$;