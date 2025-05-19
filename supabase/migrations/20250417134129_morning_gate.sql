/*
  # Add customer management features

  1. New Tables
    - notes: Store internal notes for customers
    - tasks: Store tasks related to customers
    - interaction_logs: Store customer interaction history
    - campaigns: Store marketing campaign information
    - campaign_customers: Junction table for campaigns and customers

  2. Changes
    - Add new columns to customers table
    - Add relationships and foreign keys
    - Enable RLS on all new tables

  3. Security
    - Enable RLS for all tables
    - Add policies for authenticated access
*/

-- Add new columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS status text,
ADD COLUMN IF NOT EXISTS funnel_stage text,
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES agents(id);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  content text NOT NULL,
  created_by uuid REFERENCES agents(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  status text DEFAULT 'pending',
  assigned_to uuid REFERENCES agents(id),
  created_by uuid REFERENCES agents(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interaction_logs table
CREATE TABLE IF NOT EXISTS interaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  type text NOT NULL,
  description text,
  agent_id uuid REFERENCES agents(id),
  created_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft',
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid REFERENCES agents(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign_customers junction table
CREATE TABLE IF NOT EXISTS campaign_customers (
  campaign_id uuid REFERENCES campaigns(id),
  customer_id uuid REFERENCES customers(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (campaign_id, customer_id)
);

-- Enable RLS on all tables
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_customers ENABLE ROW LEVEL SECURITY;

-- Create policies for notes
CREATE POLICY "Authenticated users can read notes"
ON notes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create notes"
ON notes FOR INSERT TO authenticated
WITH CHECK (true);

-- Create policies for tasks
CREATE POLICY "Authenticated users can read tasks"
ON tasks FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create and update tasks"
ON tasks FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for interaction_logs
CREATE POLICY "Authenticated users can read interaction logs"
ON interaction_logs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create interaction logs"
ON interaction_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Create policies for campaigns
CREATE POLICY "Authenticated users can read campaigns"
ON campaigns FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage campaigns"
ON campaigns FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for campaign_customers
CREATE POLICY "Authenticated users can read campaign customers"
ON campaign_customers FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage campaign customers"
ON campaign_customers FOR ALL TO authenticated
USING (true)
WITH CHECK (true);