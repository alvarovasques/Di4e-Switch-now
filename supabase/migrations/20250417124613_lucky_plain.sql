/*
  # Initial Schema for Omnichannel CRM

  1. Tables
    - conversations: Stores all customer conversations across channels
    - messages: Individual messages within conversations
    - customers: Customer information and metadata
    - agents: System users (agents, supervisors, admins)
    - assignments: Tracks conversation assignments to agents
    - attachments: Files and media attached to messages
    - tags: Customer and conversation categorization
    - customer_tags: Many-to-many relationship for customer tags

  2. Security
    - RLS enabled on all tables
    - Policies for different user roles
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('agent', 'supervisor', 'manager', 'admin');
CREATE TYPE channel_type AS ENUM ('whatsapp', 'telegram', 'email', 'webchat');
CREATE TYPE conversation_status AS ENUM ('new', 'active', 'waiting', 'resolved', 'closed');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');

-- Agents table
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id uuid REFERENCES auth.users,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id),
  channel channel_type NOT NULL,
  status conversation_status DEFAULT 'new',
  subject text,
  priority smallint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES conversations(id),
  sender_id uuid,
  sender_type text NOT NULL,
  message_type message_type DEFAULT 'text',
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Assignments table
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES conversations(id),
  agent_id uuid REFERENCES agents(id),
  assigned_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Attachments table
CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid REFERENCES messages(id),
  file_url text NOT NULL,
  file_type text,
  file_name text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

-- Tags table
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  color text,
  created_at timestamptz DEFAULT now()
);

-- Customer Tags junction table
CREATE TABLE customer_tags (
  customer_id uuid REFERENCES customers(id),
  tag_id uuid REFERENCES tags(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (customer_id, tag_id)
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Agents can read all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents can read assigned conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.conversation_id = conversations.id
      AND assignments.agent_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND agents.role IN ('supervisor', 'manager', 'admin')
    )
  );

-- Indexes
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_assignments_agent_id ON assignments(agent_id);
CREATE INDEX idx_assignments_conversation_id ON assignments(conversation_id);