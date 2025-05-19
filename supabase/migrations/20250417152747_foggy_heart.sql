/*
  # Ticket System Schema

  1. New Tables
    - tickets: Main ticket table with core fields
    - ticket_messages: Messages associated with tickets
    - ticket_logs: Audit trail for ticket actions
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    
  3. Changes
    - Add appropriate indexes for performance
    - Set up foreign key relationships
    - Add check constraints for enums
*/

-- Create ticket status type if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE ticket_status AS ENUM ('new', 'open', 'pending', 'resolved', 'closed');
  END IF;
END $$;

-- Create sender type if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type') THEN
    CREATE TYPE sender_type AS ENUM ('client', 'agent', 'system');
  END IF;
END $$;

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  status ticket_status NOT NULL DEFAULT 'new',
  priority priority_level NOT NULL DEFAULT 'medium',
  client_email text NOT NULL,
  assigned_to uuid REFERENCES agents(id) ON DELETE SET NULL,
  created_by uuid REFERENCES agents(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id),
  team_id uuid REFERENCES teams(id),
  channel text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  sender_email text NOT NULL,
  message text NOT NULL,
  attachment_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ticket_logs table
CREATE TABLE IF NOT EXISTS ticket_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid REFERENCES agents(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_client_email ON tickets(client_email);
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_tickets_team_id ON tickets(team_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket_id ON ticket_logs(ticket_id);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets
CREATE POLICY "Agents can view tickets they have access to" ON tickets
  FOR SELECT
  TO authenticated
  USING (
    -- Admins and managers can see all tickets
    (EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    ))
    OR
    -- Supervisors can see tickets in their teams
    (EXISTS (
      SELECT 1 FROM agents a
      JOIN team_members tm ON tm.agent_id = a.id
      WHERE a.auth_id = auth.uid()
      AND a.role = 'supervisor'
      AND tm.team_id = tickets.team_id
    ))
    OR
    -- Agents can see tickets assigned to them
    (EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND agents.id = tickets.assigned_to
    ))
  );

CREATE POLICY "Agents can create tickets" ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update tickets they have access to" ON tickets
  FOR UPDATE
  TO authenticated
  USING (
    -- Admins and managers can update all tickets
    (EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    ))
    OR
    -- Supervisors can update tickets in their teams
    (EXISTS (
      SELECT 1 FROM agents a
      JOIN team_members tm ON tm.agent_id = a.id
      WHERE a.auth_id = auth.uid()
      AND a.role = 'supervisor'
      AND tm.team_id = tickets.team_id
    ))
    OR
    -- Agents can update tickets assigned to them
    (EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND agents.id = tickets.assigned_to
    ))
  );

-- Create policies for ticket_messages
CREATE POLICY "Agents can view ticket messages they have access to" ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        -- Admins and managers can see all messages
        EXISTS (
          SELECT 1 FROM agents
          WHERE agents.auth_id = auth.uid()
          AND (agents.role = 'admin' OR agents.role = 'manager')
        )
        OR
        -- Supervisors can see messages in their teams
        EXISTS (
          SELECT 1 FROM agents a
          JOIN team_members tm ON tm.agent_id = a.id
          WHERE a.auth_id = auth.uid()
          AND a.role = 'supervisor'
          AND tm.team_id = t.team_id
        )
        OR
        -- Agents can see messages for tickets assigned to them
        EXISTS (
          SELECT 1 FROM agents
          WHERE agents.auth_id = auth.uid()
          AND agents.id = t.assigned_to
        )
      )
    )
  );

CREATE POLICY "Agents can create ticket messages" ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        EXISTS (
          SELECT 1 FROM agents
          WHERE agents.auth_id = auth.uid()
          AND (
            agents.role IN ('admin', 'manager')
            OR agents.id = t.assigned_to
            OR EXISTS (
              SELECT 1 FROM team_members tm
              WHERE tm.agent_id = agents.id
              AND tm.team_id = t.team_id
            )
          )
        )
      )
    )
  );

-- Create policies for ticket_logs
CREATE POLICY "Agents can view ticket logs they have access to" ON ticket_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_logs.ticket_id
      AND (
        -- Admins and managers can see all logs
        EXISTS (
          SELECT 1 FROM agents
          WHERE agents.auth_id = auth.uid()
          AND (agents.role = 'admin' OR agents.role = 'manager')
        )
        OR
        -- Supervisors can see logs in their teams
        EXISTS (
          SELECT 1 FROM agents a
          JOIN team_members tm ON tm.agent_id = a.id
          WHERE a.auth_id = auth.uid()
          AND a.role = 'supervisor'
          AND tm.team_id = t.team_id
        )
        OR
        -- Agents can see logs for tickets assigned to them
        EXISTS (
          SELECT 1 FROM agents
          WHERE agents.auth_id = auth.uid()
          AND agents.id = t.assigned_to
        )
      )
    )
  );

-- Create function to update ticket updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ticket updated_at
CREATE TRIGGER update_ticket_timestamp
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

-- Create function to log ticket changes
CREATE OR REPLACE FUNCTION log_ticket_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF NEW.status != OLD.status THEN
      INSERT INTO ticket_logs (ticket_id, action, performed_by, details)
      VALUES (
        NEW.id,
        'status_change',
        auth.uid()::uuid,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;

    -- Log assignment changes
    IF COALESCE(NEW.assigned_to, '') != COALESCE(OLD.assigned_to, '') THEN
      INSERT INTO ticket_logs (ticket_id, action, performed_by, details)
      VALUES (
        NEW.id,
        'assignment_change',
        auth.uid()::uuid,
        jsonb_build_object(
          'old_assigned_to', OLD.assigned_to,
          'new_assigned_to', NEW.assigned_to
        )
      );
    END IF;

    -- Log priority changes
    IF NEW.priority != OLD.priority THEN
      INSERT INTO ticket_logs (ticket_id, action, performed_by, details)
      VALUES (
        NEW.id,
        'priority_change',
        auth.uid()::uuid,
        jsonb_build_object(
          'old_priority', OLD.priority,
          'new_priority', NEW.priority
        )
      );
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log ticket changes
CREATE TRIGGER log_ticket_changes_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_changes();