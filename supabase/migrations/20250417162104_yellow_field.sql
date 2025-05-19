/*
  # Add priority column to tasks table

  1. Changes
    - Add priority column to tasks table with enum type
    - Set default value to 'medium'
    - Add check constraint to ensure valid values

  2. Notes
    - Priority values: low, medium, high, urgent
    - Default value set to 'medium' for consistency
*/

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority task_priority DEFAULT 'medium'::task_priority NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;