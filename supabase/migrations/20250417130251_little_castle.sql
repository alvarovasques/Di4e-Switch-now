/*
  # Add RLS policies for agents table

  1. Security Changes
    - Add policy for authenticated users to read all agents
    - Add policy for agents to update their own profile
    - Add policy for admins to manage all agents
*/

-- Policy for reading agents
CREATE POLICY "Allow authenticated users to read all agents"
ON agents FOR SELECT
TO authenticated
USING (true);

-- Policy for updating own profile
CREATE POLICY "Agents can update their own profile"
ON agents FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- Policy for admin management
CREATE POLICY "Admins can manage all agents"
ON agents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
);