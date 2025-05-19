/*
  # Add conversation and messaging system

  1. New Tables
    - departments: Store service departments
    - channel_configs: Store channel integration settings
    - queue_settings: Store queue and routing settings
    - conversations: Store chat/ticket conversations (updated schema)
    - messages: Store individual messages

  2. Changes
    - Drop and recreate conversations table with new schema
    - Add conversation status and priority tracking
    - Add SLA tracking
    - Add routing and assignment system

  3. Security
    - Enable RLS for all tables
    - Add policies for authenticated access
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create channel_configs table
CREATE TABLE IF NOT EXISTS channel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type channel_type NOT NULL,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create queue_settings table
CREATE TABLE IF NOT EXISTS queue_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id),
  name text NOT NULL,
  routing_method text NOT NULL DEFAULT 'round-robin',
  is_active boolean DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new conversation status type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE ticket_status AS ENUM (
      'new',
      'open',
      'pending',
      'resolved',
      'closed'
    );
  END IF;
END $$;

-- Add priority level type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
    CREATE TYPE priority_level AS ENUM (
      'low',
      'medium',
      'high',
      'urgent'
    );
  END IF;
END $$;

-- Drop existing conversations table if it exists
DROP TABLE IF EXISTS conversations CASCADE;

-- Create conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  department_id uuid REFERENCES departments(id),
  channel_type channel_type NOT NULL,
  channel_config_id uuid REFERENCES channel_configs(id),
  status ticket_status DEFAULT 'new',
  priority priority_level DEFAULT 'medium',
  subject text,
  assigned_to uuid REFERENCES agents(id),
  previous_agent uuid REFERENCES agents(id),
  sla_due_at timestamptz,
  first_response_at timestamptz,
  resolution_time interval,
  is_ai_handled boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Drop existing messages table if it exists
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'ai')),
  sender_id uuid,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for departments
CREATE POLICY "Authenticated users can read departments"
  ON departments FOR SELECT TO authenticated
  USING (true);

-- Policies for channel_configs
CREATE POLICY "Authenticated users can read channel configs"
  ON channel_configs FOR SELECT TO authenticated
  USING (true);

-- Policies for queue_settings
CREATE POLICY "Authenticated users can read queue settings"
  ON queue_settings FOR SELECT TO authenticated
  USING (true);

-- Policies for conversations
CREATE POLICY "Agents can read assigned conversations"
  ON conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = conversations.assigned_to
      AND agents.auth_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM queue_settings
      WHERE queue_settings.department_id = conversations.department_id
      AND queue_settings.is_active = true
    )
  );

-- Policies for messages
CREATE POLICY "Agents can read conversation messages"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN agents a ON a.id = c.assigned_to
      WHERE c.id = messages.conversation_id
      AND a.auth_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM conversations c
      JOIN queue_settings qs ON qs.department_id = c.department_id
      WHERE c.id = messages.conversation_id
      AND qs.is_active = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Functions for conversation management
CREATE OR REPLACE FUNCTION assign_conversation(
  conversation_uuid uuid,
  agent_uuid uuid
) RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET 
    assigned_to = agent_uuid,
    status = CASE 
      WHEN status = 'new' THEN 'open'::ticket_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate SLA
CREATE OR REPLACE FUNCTION update_conversation_sla(
  conversation_uuid uuid,
  priority priority_level
) RETURNS timestamptz AS $$
DECLARE
  sla_hours integer;
BEGIN
  -- Define SLA hours based on priority
  sla_hours := CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 4
    WHEN 'medium' THEN 8
    WHEN 'low' THEN 24
  END;

  RETURN now() + (sla_hours || ' hours')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;