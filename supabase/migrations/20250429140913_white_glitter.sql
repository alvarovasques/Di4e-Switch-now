/*
  # Add RLS policy for customer creation

  1. New Policies
    - Allow authenticated users to create customers
    - Maintain existing policies for reading customers

  2. Security
    - Ensure proper access control while allowing customer creation
*/

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