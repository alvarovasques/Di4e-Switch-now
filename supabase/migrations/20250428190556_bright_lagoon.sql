/*
  # Add business hours to company settings

  1. Changes
    - Add business_hours column to company_settings table
    - Add social_media column to company_settings table
    - Update existing rows with default values
*/

-- Add business_hours column
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{
  "monday": { "open": "09:00", "close": "18:00" },
  "tuesday": { "open": "09:00", "close": "18:00" },
  "wednesday": { "open": "09:00", "close": "18:00" },
  "thursday": { "open": "09:00", "close": "18:00" },
  "friday": { "open": "09:00", "close": "18:00" },
  "saturday": { "open": "", "close": "" },
  "sunday": { "open": "", "close": "" }
}'::jsonb;

-- Add social_media column if it doesn't exist
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS social_media jsonb DEFAULT '{
  "facebook": "",
  "instagram": "",
  "twitter": "",
  "linkedin": ""
}'::jsonb;