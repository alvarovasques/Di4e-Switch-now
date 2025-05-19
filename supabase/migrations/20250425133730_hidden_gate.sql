/*
  # Create default company settings

  1. Changes
    - Add default company settings row if none exists
    - Create trigger to prevent multiple rows
  
  2. Security
    - Maintain existing RLS policies
*/

-- Create function to enforce single row
CREATE OR REPLACE FUNCTION enforce_single_row_company_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM company_settings) > 0 THEN
    RAISE EXCEPTION 'Only one row is allowed in company_settings table';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single row
DROP TRIGGER IF EXISTS ensure_single_row_company_settings ON company_settings;
CREATE TRIGGER ensure_single_row_company_settings
  BEFORE INSERT ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_row_company_settings();

-- Insert default settings if table is empty
INSERT INTO company_settings (
  id,
  name,
  theme,
  primary_color,
  secondary_color,
  font_family
)
SELECT 
  gen_random_uuid(),
  'Default Company',
  'light',
  '#4F46E5',
  '#6366F1',
  'Inter'
WHERE NOT EXISTS (
  SELECT 1 FROM company_settings LIMIT 1
);