/*
  # Fix storage permissions for company settings

  1. Changes
    - Create company-logos bucket if it doesn't exist
    - Add storage policies for authenticated users to manage company logos
    - Add policy for public access to company logos

  2. Security
    - Enable RLS on storage.objects for the company-logos bucket
    - Only authenticated users can upload/delete company logos
    - Public read access for logos
*/

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload company logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' AND
  (storage.foldername(name))[1] != 'private'
);

-- Allow authenticated users to update company logos
CREATE POLICY "Authenticated users can update company logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-logos')
WITH CHECK (bucket_id = 'company-logos');

-- Allow authenticated users to delete company logos
CREATE POLICY "Authenticated users can delete company logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-logos');

-- Allow public access to company logos
CREATE POLICY "Public can view company logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-logos');