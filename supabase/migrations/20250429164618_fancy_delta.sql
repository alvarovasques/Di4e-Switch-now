/*
  # Add customer management policies

  1. Changes
    - Add policies for authenticated users to create customers
    - Add policies for authenticated users to update customers
    
  2. Security
    - Ensure policies don't conflict with existing ones
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