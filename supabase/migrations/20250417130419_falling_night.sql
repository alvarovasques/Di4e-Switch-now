/*
  # Fix agents table policies and add role function

  1. Changes
    - Create current_user_role function first
    - Update policies to use the function
    - Ensure proper order of operations
  
  2. Security
    - Enable policies for different user roles
    - Maintain proper access control
*/

-- Create function to get current user role first
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM agents WHERE auth_id = auth.uid();
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read all agents" ON agents;
DROP POLICY IF EXISTS "Agents can update their own profile" ON agents;
DROP POLICY IF EXISTS "Admins can manage all agents" ON agents;

-- Policy for reading agents (all authenticated users can read)
CREATE POLICY "Allow authenticated users to read all agents"
ON agents FOR SELECT
TO authenticated
USING (true);

-- Policy for inserting agents (admins only)
CREATE POLICY "Allow admins to create agents"
ON agents FOR INSERT
TO authenticated
WITH CHECK (
  current_user_role() = 'admin'::user_role
);

-- Policy for updating agents (own profile or admin)
CREATE POLICY "Allow users to update agents"
ON agents FOR UPDATE
TO authenticated
USING (
  auth.uid() = auth_id OR
  current_user_role() = 'admin'::user_role
)
WITH CHECK (
  auth.uid() = auth_id OR
  current_user_role() = 'admin'::user_role
);

-- Policy for deleting agents (admins only)
CREATE POLICY "Allow admins to delete agents"
ON agents FOR DELETE
TO authenticated
USING (
  current_user_role() = 'admin'::user_role
);