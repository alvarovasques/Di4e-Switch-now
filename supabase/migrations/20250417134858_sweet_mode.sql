/*
  # Add RBAC and Metrics Tracking

  1. New Tables
    - `metrics_snapshots` - Stores periodic metrics data
    - `agent_performance` - Tracks individual agent metrics
    - `conversation_metrics` - Stores conversation-specific metrics

  2. Functions
    - Calculate response times
    - Update agent performance metrics
    - Generate dashboard statistics

  3. Policies
    - Role-based access control for different user types
    - Metrics visibility based on user role
*/

-- Update agents table with role-based permissions
DO $$ BEGIN
  ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{
      "can_transfer": false,
      "can_close": false,
      "can_view_metrics": false,
      "can_manage_users": false,
      "can_configure_system": false
    }';
END $$;

-- Set default permissions based on role
CREATE OR REPLACE FUNCTION set_agent_permissions()
RETURNS trigger AS $$
BEGIN
  NEW.permissions = CASE
    WHEN NEW.role = 'agent' THEN
      '{
        "can_transfer": true,
        "can_close": true,
        "can_view_metrics": false,
        "can_manage_users": false,
        "can_configure_system": false
      }'::jsonb
    WHEN NEW.role = 'supervisor' THEN
      '{
        "can_transfer": true,
        "can_close": true,
        "can_view_metrics": true,
        "can_manage_users": false,
        "can_configure_system": false
      }'::jsonb
    WHEN NEW.role = 'manager' THEN
      '{
        "can_transfer": true,
        "can_close": true,
        "can_view_metrics": true,
        "can_manage_users": true,
        "can_configure_system": true
      }'::jsonb
    WHEN NEW.role = 'admin' THEN
      '{
        "can_transfer": true,
        "can_close": true,
        "can_view_metrics": true,
        "can_manage_users": true,
        "can_configure_system": true
      }'::jsonb
    ELSE
      '{
        "can_transfer": false,
        "can_close": false,
        "can_view_metrics": false,
        "can_manage_users": false,
        "can_configure_system": false
      }'::jsonb
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for setting permissions
DROP TRIGGER IF EXISTS set_agent_permissions_trigger ON agents;
CREATE TRIGGER set_agent_permissions_trigger
  BEFORE INSERT OR UPDATE OF role ON agents
  FOR EACH ROW
  EXECUTE FUNCTION set_agent_permissions();

-- Create metrics_snapshots table
CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_time timestamptz DEFAULT now(),
  metrics_type text NOT NULL,
  period text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create agent_performance table
CREATE TABLE IF NOT EXISTS agent_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id),
  date date NOT NULL,
  conversations_handled integer DEFAULT 0,
  avg_response_time interval,
  avg_resolution_time interval,
  customer_satisfaction numeric(3,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, date)
);

-- Create conversation_metrics table
CREATE TABLE IF NOT EXISTS conversation_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  first_response_time interval,
  resolution_time interval,
  transfers_count integer DEFAULT 0,
  messages_count integer DEFAULT 0,
  customer_satisfaction numeric(3,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for metrics_snapshots
CREATE POLICY "Users with metrics permission can view snapshots"
  ON metrics_snapshots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.permissions->>'can_view_metrics')::boolean = true
    )
  );

-- Policies for agent_performance
CREATE POLICY "Agents can view their own performance"
  ON agent_performance FOR SELECT TO authenticated
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE auth_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.permissions->>'can_view_metrics')::boolean = true
    )
  );

-- Policies for conversation_metrics
CREATE POLICY "Users with metrics permission can view conversation metrics"
  ON conversation_metrics FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.permissions->>'can_view_metrics')::boolean = true
    )
  );

-- Function to calculate response times
CREATE OR REPLACE FUNCTION calculate_response_times(conversation_uuid uuid)
RETURNS void AS $$
DECLARE
  first_message_time timestamptz;
  first_response_time timestamptz;
  resolution_time timestamptz;
BEGIN
  -- Get first customer message time
  SELECT created_at INTO first_message_time
  FROM messages
  WHERE conversation_id = conversation_uuid
  AND sender_type = 'customer'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Get first agent response time
  SELECT created_at INTO first_response_time
  FROM messages
  WHERE conversation_id = conversation_uuid
  AND sender_type = 'agent'
  AND created_at > first_message_time
  ORDER BY created_at ASC
  LIMIT 1;

  -- Update conversation metrics
  INSERT INTO conversation_metrics (
    conversation_id,
    first_response_time,
    resolution_time,
    created_at
  ) VALUES (
    conversation_uuid,
    first_response_time - first_message_time,
    CASE 
      WHEN (SELECT status FROM conversations WHERE id = conversation_uuid) = 'resolved'
      THEN (SELECT closed_at FROM conversations WHERE id = conversation_uuid) - first_message_time
      ELSE NULL
    END,
    now()
  )
  ON CONFLICT (conversation_id) DO UPDATE
  SET 
    first_response_time = EXCLUDED.first_response_time,
    resolution_time = EXCLUDED.resolution_time,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update agent performance metrics
CREATE OR REPLACE FUNCTION update_agent_performance(agent_uuid uuid, metric_date date)
RETURNS void AS $$
DECLARE
  total_conversations integer;
  avg_response interval;
  avg_resolution interval;
  satisfaction numeric(3,2);
BEGIN
  -- Calculate metrics
  SELECT 
    COUNT(*),
    AVG(cm.first_response_time),
    AVG(cm.resolution_time),
    AVG(cm.customer_satisfaction)
  INTO
    total_conversations,
    avg_response,
    avg_resolution,
    satisfaction
  FROM conversations c
  JOIN conversation_metrics cm ON cm.conversation_id = c.id
  WHERE c.assigned_to = agent_uuid
  AND DATE(c.created_at) = metric_date;

  -- Update agent_performance
  INSERT INTO agent_performance (
    agent_id,
    date,
    conversations_handled,
    avg_response_time,
    avg_resolution_time,
    customer_satisfaction
  ) VALUES (
    agent_uuid,
    metric_date,
    total_conversations,
    avg_response,
    avg_resolution,
    satisfaction
  )
  ON CONFLICT (agent_id, date) DO UPDATE
  SET 
    conversations_handled = EXCLUDED.conversations_handled,
    avg_response_time = EXCLUDED.avg_response_time,
    avg_resolution_time = EXCLUDED.avg_resolution_time,
    customer_satisfaction = EXCLUDED.customer_satisfaction,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_performance_date ON agent_performance(date);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_conversation_id ON conversation_metrics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_type_period ON metrics_snapshots(metrics_type, period);