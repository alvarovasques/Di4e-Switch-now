/*
  # Initial Schema Setup for Omnichannel CRM

  1. New Tables and Types
    - Create enums for roles, channels, statuses, and message types
    - Create all necessary tables with proper relationships
    - Set up indexes for performance
    - Enable RLS and create policies

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access using auth.uid()
*/

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('agent', 'supervisor', 'manager', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('whatsapp', 'telegram', 'email', 'webchat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('new', 'active', 'waiting', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  channel_id text,
  channel_type channel_type,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  channel channel_type NOT NULL,
  status conversation_status DEFAULT 'new',
  subject text,
  priority smallint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  sender_id uuid,
  sender_type text NOT NULL,
  message_type message_type DEFAULT 'text',
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  agent_id uuid REFERENCES agents(id),
  assigned_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id),
  file_url text NOT NULL,
  file_type text,
  file_name text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_tags (
  customer_id uuid REFERENCES customers(id),
  tag_id uuid REFERENCES tags(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (customer_id, tag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_conversation_id ON assignments(conversation_id);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Agents can read all customers" ON customers;
    DROP POLICY IF EXISTS "Agents can read assigned conversations" ON conversations;
    DROP POLICY IF EXISTS "Agents can read messages from assigned conversations" ON messages;
    DROP POLICY IF EXISTS "Agents can read their assignments" ON assignments;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create policies
CREATE POLICY "Agents can read all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents can read assigned conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.conversation_id = conversations.id
      AND assignments.agent_id = auth.uid()
    )) OR
    (EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND agents.role IN ('supervisor', 'manager', 'admin')
    ))
  );

CREATE POLICY "Agents can read messages from assigned conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN assignments a ON a.conversation_id = c.id
      WHERE c.id = messages.conversation_id
      AND a.agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can read their assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());