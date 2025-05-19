/*
  # Add storage permissions for company logos

  1. Changes
    - Create storage bucket for company logos
    - Add RLS policies for authenticated users
    - Enable public access for viewing logos
*/

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to company logos
CREATE POLICY "Give public access to company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Allow authenticated users to upload company logos
CREATE POLICY "Allow authenticated users to upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
);

-- Allow authenticated users to update company logos
CREATE POLICY "Allow authenticated users to update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
);

-- Allow authenticated users to delete company logos
CREATE POLICY "Allow authenticated users to delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.auth_id = auth.uid()
    AND agents.role = 'admin'
  )
);