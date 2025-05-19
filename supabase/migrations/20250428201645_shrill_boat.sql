/*
  # Fix company settings schema

  1. Changes
    - Drop and recreate business_hours with proper structure
    - Add tagline column if missing
    - Update default values
*/

-- Drop existing business_hours column to fix structure
ALTER TABLE company_settings 
DROP COLUMN IF EXISTS business_hours;

-- Re-add business_hours with correct structure
ALTER TABLE company_settings
ADD COLUMN business_hours jsonb DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00"},
  "tuesday": {"open": "09:00", "close": "18:00"},
  "wednesday": {"open": "09:00", "close": "18:00"},
  "thursday": {"open": "09:00", "close": "18:00"},
  "friday": {"open": "09:00", "close": "18:00"},
  "saturday": {"open": "", "close": ""},
  "sunday": {"open": "", "close": ""}
}'::jsonb NOT NULL;

-- Add tagline if missing
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS tagline text;