/*
  # Fix Customer Table RLS Policies

  1. Changes
    - Add RLS policy for customer creation
    - Add RLS policy for customer updates
    - Ensure authenticated users can create and update customers

  2. Security
    - Maintain existing RLS policies
    - Add necessary policies for AI Chat functionality
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;

-- Create policy for customer creation
CREATE POLICY "Authenticated users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for customer updates
CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);