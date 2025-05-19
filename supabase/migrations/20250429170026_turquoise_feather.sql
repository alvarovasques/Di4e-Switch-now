/*
  # Add customer management policies

  1. Changes
    - Add policies for customer management
    - Allow authenticated users to create and update customers
  
  2. Security
    - Ensure proper access control for customer data
*/

-- Create policy for customer creation if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can create customers'
    AND tablename = 'customers'
  ) THEN
    CREATE POLICY "Authenticated users can create customers"
      ON customers FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Create policy for customer updates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can update customers'
    AND tablename = 'customers'
  ) THEN
    CREATE POLICY "Authenticated users can update customers"
      ON customers FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;