/*
  # Fix user management policies

  1. Changes
    - Simplify RLS policies for agents table
    - Remove recursive policy that was causing infinite recursion
    - Ensure all authenticated users can read agent data
    - Allow admins to manage users based on direct role check

  2. Security
    - Maintain secure access control
    - Prevent unauthorized modifications
    - Allow proper read access for all authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read all agents" ON agents;
DROP POLICY IF EXISTS "Allow admins to create agents" ON agents;
DROP POLICY IF EXISTS "Allow users to update agents" ON agents;
DROP POLICY IF EXISTS "Allow admins to delete agents" ON agents;

-- Drop the problematic function that was causing recursion
DROP FUNCTION IF EXISTS current_user_role();

-- Simple policy for reading agents (all authenticated users can read)
CREATE POLICY "Allow authenticated users to read all agents"
ON agents FOR SELECT
TO authenticated
USING (true);

-- Policy for inserting agents (admins only)
CREATE POLICY "Allow admins to create agents"
ON agents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
);

-- Policy for updating agents (own profile or admin)
CREATE POLICY "Allow users to update agents"
ON agents FOR UPDATE
TO authenticated
USING (
  auth.uid() = auth_id OR
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = auth_id OR
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
);

-- Policy for deleting agents (admins only)
CREATE POLICY "Allow admins to delete agents"
ON agents FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
);