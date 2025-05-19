/*
  # Add CRM funnel fields to customers table

  1. Changes
    - Add funnel_stage field to customers table
    - Add status field to customers table
    - Add default values for new fields
*/

-- Add funnel stage and status fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS funnel_stage text DEFAULT 'lead',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';

-- Add constraint to funnel_stage
ALTER TABLE customers
ADD CONSTRAINT customers_funnel_stage_check
CHECK (funnel_stage IN (
  'lead',
  'contact',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
));

-- Add constraint to status
ALTER TABLE customers
ADD CONSTRAINT customers_status_check
CHECK (status IN (
  'new',
  'active',
  'inactive',
  'blocked'
));