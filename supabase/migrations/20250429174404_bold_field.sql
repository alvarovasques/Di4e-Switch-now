/*
  # Add customer management policies

  1. Changes
    - Add policies for customer management
    - Allow authenticated users to create and update customers
  
  2. Security
    - Maintain existing RLS policies
*/

-- Check if policies exist before creating them
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can create customers'
    AND tablename = 'customers'
    AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Authenticated users can create customers"
      ON customers FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can update customers'
    AND tablename = 'customers'
    AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Authenticated users can update customers"
      ON customers FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;