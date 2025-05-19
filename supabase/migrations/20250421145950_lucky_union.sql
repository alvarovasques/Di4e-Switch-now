/*
  # Add RLS policies for messages table

  1. Changes
    - Enable RLS on messages table
    - Add policies for authenticated users to:
      - Insert messages for conversations they have access to
      - Read messages from conversations they have access to

  2. Security
    - Ensures users can only access messages from conversations they are authorized to view
    - Allows agents to send messages to their assigned conversations
    - Allows supervisors, managers, and admins to access messages based on their roles
*/

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for reading messages
CREATE POLICY "Users can read messages from accessible conversations"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      -- Admin or manager can read all messages
      EXISTS (
        SELECT 1 FROM agents a
        WHERE a.auth_id = auth.uid()
        AND (a.role = 'admin' OR a.role = 'manager')
      )
      OR
      -- Supervisor can read team messages
      EXISTS (
        SELECT 1 FROM agents a
        JOIN team_members tm ON tm.agent_id = a.id
        WHERE a.auth_id = auth.uid()
        AND a.role = 'supervisor'
        AND tm.team_id = c.team_id
      )
      OR
      -- Agent can read their assigned conversations
      EXISTS (
        SELECT 1 FROM agents a
        WHERE a.auth_id = auth.uid()
        AND a.id = c.assigned_to
      )
    )
  )
);

-- Policy for inserting messages
CREATE POLICY "Users can insert messages to accessible conversations"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (
      -- Admin or manager can send messages
      EXISTS (
        SELECT 1 FROM agents a
        WHERE a.auth_id = auth.uid()
        AND (a.role = 'admin' OR a.role = 'manager')
      )
      OR
      -- Supervisor can send messages to team conversations
      EXISTS (
        SELECT 1 FROM agents a
        JOIN team_members tm ON tm.agent_id = a.id
        WHERE a.auth_id = auth.uid()
        AND a.role = 'supervisor'
        AND tm.team_id = c.team_id
      )
      OR
      -- Agent can send messages to assigned conversations
      EXISTS (
        SELECT 1 FROM agents a
        WHERE a.auth_id = auth.uid()
        AND a.id = c.assigned_to
      )
    )
  )
);