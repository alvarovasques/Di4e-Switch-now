/*
  # Fix RLS policy for ai_conversation_logs table

  1. Changes
    - Completely removes any existing policy
    - Creates a new, simpler policy with proper syntax
    - Ensures RLS is enabled on the table

  2. Security
    - Maintains proper access control for metrics data
    - Allows admins, managers, and users with metrics permission to view logs
*/

-- First check if the table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'ai_conversation_logs'
  ) THEN
    -- Drop all existing policies on the table
    DROP POLICY IF EXISTS "Authenticated users can read AI conversation logs" ON ai_conversation_logs;
    
    -- Make sure RLS is enabled
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
          AND (agents.role = 'admin' OR agents.role = 'manager' OR (agents.permissions->>'can_view_metrics')::boolean = true)
        )
      );
  END IF;
END $$;