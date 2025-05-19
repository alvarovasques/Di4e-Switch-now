/*
  # Fix business_hours handling in company_settings

  1. Changes
    - Ensure business_hours is properly typed as jsonb
    - Add default structure for business_hours
    - Add missing tagline column
*/

-- Drop existing business_hours column to fix type
ALTER TABLE company_settings 
DROP COLUMN IF EXISTS business_hours;

-- Re-add business_hours with correct type and default
ALTER TABLE company_settings
ADD COLUMN business_hours jsonb DEFAULT '{
  "friday": {"open": "09:00", "close": "18:00"},
  "monday": {"open": "09:00", "close": "18:00"},
  "sunday": {"open": "", "close": ""},
  "tuesday": {"open": "09:00", "close": "18:00"},
  "saturday": {"open": "", "close": ""},
  "thursday": {"open": "09:00", "close": "18:00"},
  "wednesday": {"open": "09:00", "close": "18:00"}
}'::jsonb;