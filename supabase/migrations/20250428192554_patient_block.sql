/*
  # Add tagline column to company_settings table

  1. Changes
    - Add tagline column to company_settings table
    - Add social_media column for social network links
    - Add business_hours column for operating hours
*/

-- Add tagline column
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS social_media jsonb DEFAULT '{
  "twitter": "",
  "facebook": "",
  "linkedin": "",
  "instagram": ""
}'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00"},
  "tuesday": {"open": "09:00", "close": "18:00"},
  "wednesday": {"open": "09:00", "close": "18:00"},
  "thursday": {"open": "09:00", "close": "18:00"},
  "friday": {"open": "09:00", "close": "18:00"},
  "saturday": {"open": "", "close": ""},
  "sunday": {"open": "", "close": ""}
}'::jsonb;