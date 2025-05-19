/*
  # Business Rules and Automation

  1. New Tables
    - `business_rules` - Defines transfer and routing rules
    - `sla_configs` - SLA configuration by priority and department
    - `alerts` - System alerts and notifications
    - `agent_status` - Track agent availability

  2. Updates
    - Add notification preferences to agents
    - Add SLA tracking columns to conversations
    - Add transfer restrictions and routing rules
*/

-- Create business_rules table
CREATE TABLE IF NOT EXISTS business_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL CHECK (rule_type IN ('transfer', 'routing', 'sla')),
  department_id uuid REFERENCES departments(id),
  team_id uuid REFERENCES teams(id),
  conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sla_configs table
CREATE TABLE IF NOT EXISTS sla_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id),
  priority priority_level NOT NULL,
  first_response_time interval NOT NULL,
  resolution_time interval NOT NULL,
  escalation_time interval,
  escalation_to uuid REFERENCES agents(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (department_id, priority)
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('sla_breach', 'queue_threshold', 'system')),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  description text,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  acknowledged_by uuid REFERENCES agents(id),
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create agent_status table
CREATE TABLE IF NOT EXISTS agent_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) UNIQUE,
  status text NOT NULL CHECK (status IN ('online', 'busy', 'away', 'offline')),
  custom_status text,
  last_activity timestamptz DEFAULT now(),
  current_conversations integer DEFAULT 0,
  max_concurrent_chats integer DEFAULT 3,
  updated_at timestamptz DEFAULT now()
);

-- Add SLA tracking columns to conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS sla_first_response_due timestamptz,
ADD COLUMN IF NOT EXISTS sla_resolution_due timestamptz;

-- Add notification preferences to agents
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "sla_warnings": true,
  "queue_alerts": true,
  "team_mentions": true,
  "transfer_requests": true,
  "desktop_notifications": true,
  "email_notifications": true
}'::jsonb;

-- Enable RLS
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

-- Policies for business_rules
CREATE POLICY "Authenticated users can read business rules"
  ON business_rules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage business rules"
  ON business_rules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Policies for sla_configs
CREATE POLICY "Authenticated users can read SLA configs"
  ON sla_configs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage SLA configs"
  ON sla_configs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Policies for alerts
CREATE POLICY "Users can read relevant alerts"
  ON alerts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can acknowledge alerts"
  ON alerts FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    status IN ('acknowledged', 'resolved')
  );

-- Policies for agent_status
CREATE POLICY "Authenticated users can read agent status"
  ON agent_status FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Agents can update their own status"
  ON agent_status FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND agents.id = agent_status.agent_id
    )
  );

-- Function to check transfer rules
CREATE OR REPLACE FUNCTION can_transfer_conversation(
  conversation_uuid uuid,
  from_agent_uuid uuid,
  to_agent_uuid uuid
) RETURNS boolean AS $$
DECLARE
  can_transfer boolean;
  rule record;
BEGIN
  -- Check if target agent is available
  IF NOT EXISTS (
    SELECT 1 FROM agent_status
    WHERE agent_id = to_agent_uuid
    AND status IN ('online', 'busy')
  ) THEN
    RETURN false;
  END IF;

  -- Check if target agent has capacity
  IF EXISTS (
    SELECT 1 FROM agent_status
    WHERE agent_id = to_agent_uuid
    AND current_conversations >= max_concurrent_chats
  ) THEN
    RETURN false;
  END IF;

  -- Check business rules
  FOR rule IN
    SELECT * FROM business_rules
    WHERE rule_type = 'transfer'
    AND is_active = true
    ORDER BY priority DESC
  LOOP
    -- Evaluate rule conditions
    -- This is a simplified example - extend based on your specific rule conditions
    IF rule.conditions->>'require_same_department' = 'true' THEN
      IF NOT EXISTS (
        SELECT 1 FROM agents a1
        JOIN agents a2 ON a1.department_id = a2.department_id
        WHERE a1.id = from_agent_uuid
        AND a2.id = to_agent_uuid
      ) THEN
        RETURN false;
      END IF;
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically assign conversation
CREATE OR REPLACE FUNCTION auto_assign_conversation(
  conversation_uuid uuid
) RETURNS uuid AS $$
DECLARE
  selected_agent_id uuid;
BEGIN
  -- Get the conversation details
  WITH conversation_details AS (
    SELECT c.department_id, c.team_id, c.priority
    FROM conversations c
    WHERE c.id = conversation_uuid
  ),
  -- Get available agents based on status and capacity
  available_agents AS (
    SELECT a.id, ast.current_conversations
    FROM agents a
    JOIN agent_status ast ON ast.agent_id = a.id
    JOIN team_members tm ON tm.agent_id = a.id
    WHERE ast.status = 'online'
    AND ast.current_conversations < ast.max_concurrent_chats
    AND tm.team_id = (SELECT team_id FROM conversation_details)
  )
  -- Select agent using round-robin
  SELECT id INTO selected_agent_id
  FROM available_agents
  ORDER BY current_conversations ASC, RANDOM()
  LIMIT 1;

  -- Update conversation assignment
  IF selected_agent_id IS NOT NULL THEN
    UPDATE conversations
    SET assigned_to = selected_agent_id,
        status = 'open'
    WHERE id = conversation_uuid;

    -- Update agent's conversation count
    UPDATE agent_status
    SET current_conversations = current_conversations + 1
    WHERE agent_id = selected_agent_id;
  END IF;

  RETURN selected_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update SLA status
CREATE OR REPLACE FUNCTION update_sla_status() RETURNS trigger AS $$
DECLARE
  sla_config record;
  should_create_alert boolean := false;
BEGIN
  -- Get applicable SLA config
  SELECT * INTO sla_config
  FROM sla_configs
  WHERE department_id = NEW.department_id
  AND priority = NEW.priority;

  IF FOUND THEN
    -- Update SLA due times if not set
    IF NEW.first_response_at IS NULL AND OLD.first_response_at IS NULL THEN
      NEW.sla_first_response_due := NEW.created_at + sla_config.first_response_time;
    END IF;

    IF NEW.status != 'resolved' AND NEW.status != 'closed' THEN
      NEW.sla_resolution_due := NEW.created_at + sla_config.resolution_time;
    END IF;

    -- Check for SLA breaches
    IF NEW.first_response_at IS NULL AND NEW.sla_first_response_due < now() THEN
      should_create_alert := true;
    END IF;

    IF NEW.status NOT IN ('resolved', 'closed') AND NEW.sla_resolution_due < now() THEN
      should_create_alert := true;
    END IF;

    -- Create alert if needed
    IF should_create_alert THEN
      INSERT INTO alerts (
        type,
        severity,
        title,
        description,
        entity_type,
        entity_id
      ) VALUES (
        'sla_breach',
        'critical',
        'SLA Breach',
        'Conversation has breached SLA thresholds',
        'conversation',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for SLA monitoring
CREATE TRIGGER monitor_sla_status
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_status();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_rules_type ON business_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_agent_status_status ON agent_status(status);