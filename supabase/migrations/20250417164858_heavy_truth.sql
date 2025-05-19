/*
  # Add company settings table

  1. New Tables
    - company_settings: Store company configuration and branding
  
  2. Security
    - Enable RLS
    - Add policies for proper access control
*/

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  primary_color text NOT NULL DEFAULT '#4F46E5',
  secondary_color text NOT NULL DEFAULT '#6366F1',
  font_family text NOT NULL DEFAULT 'Inter',
  email text,
  phone text,
  address text,
  website text,
  billing jsonb NOT NULL DEFAULT '{
    "company_name": "",
    "tax_id": "",
    "billing_email": "",
    "billing_address": ""
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read company settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage company settings"
  ON company_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND agents.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND agents.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO company_settings (
  name,
  theme,
  primary_color,
  secondary_color,
  font_family
)
SELECT
  'Minha Empresa',
  'light',
  '#4F46E5',
  '#6366F1',
  'Inter'
WHERE NOT EXISTS (
  SELECT 1 FROM company_settings
);