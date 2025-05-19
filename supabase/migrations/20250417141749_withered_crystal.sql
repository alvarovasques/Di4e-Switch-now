/*
  # Multichannel Communication System Schema

  1. New Types
    - channel_type: Supported communication channels
    - message_direction: Message flow direction
    - message_type: Types of message content

  2. Tables
    - contacts: Store customer contact information
    - channels: Communication channel configurations
    - messages: Message history and content

  3. Security
    - RLS enabled on all tables
    - Policies for authenticated access
*/

-- Create enum types if they don't exist
DO $$ BEGIN
  CREATE TYPE channel_type AS ENUM ('whatsapp', 'telegram', 'email', 'webchat');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'audio', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables if they exist to ensure clean state
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS channels;

-- Create contacts table
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  name text,
  channel_type channel_type NOT NULL,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(external_id, channel_type)
);

-- Create channels table
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type channel_type NOT NULL,
  name text NOT NULL,
  n8n_webhook_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(type, name)
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction message_direction NOT NULL,
  message_type message_type DEFAULT 'text',
  content text,
  media_url text,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  session_id uuid,
  sender_name text,
  received_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_contacts_external_id ON contacts(external_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read contacts"
  ON contacts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read channels"
  ON channels FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read messages"
  ON messages FOR SELECT TO authenticated
  USING (true);

-- Create RPC functions
CREATE OR REPLACE FUNCTION register_inbound_message(
  p_channel_type text,
  p_external_id text,
  p_content text,
  p_message_type text DEFAULT 'text'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id uuid;
  v_channel_id uuid;
BEGIN
  -- Get or create contact
  SELECT id INTO v_contact_id 
  FROM contacts 
  WHERE external_id = p_external_id AND channel_type::text = p_channel_type;
  
  IF v_contact_id IS NULL THEN
    INSERT INTO contacts (external_id, channel_type) 
    VALUES (p_external_id, p_channel_type::channel_type)
    RETURNING id INTO v_contact_id;
  ELSE
    -- Update last_seen
    UPDATE contacts 
    SET last_seen = now() 
    WHERE id = v_contact_id;
  END IF;

  -- Get active channel
  SELECT id INTO v_channel_id 
  FROM channels 
  WHERE type::text = p_channel_type 
  AND is_active = true 
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    RAISE EXCEPTION 'No active channel found for type: %', p_channel_type;
  END IF;

  -- Insert message
  INSERT INTO messages (
    direction, 
    message_type, 
    content, 
    contact_id, 
    channel_id, 
    sender_name
  )
  VALUES (
    'inbound',
    p_message_type::message_type,
    p_content,
    v_contact_id,
    v_channel_id,
    p_external_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION send_message(
  p_contact_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel_id uuid;
  v_message_id uuid;
BEGIN
  -- Get channel from contact's last message
  SELECT channel_id INTO v_channel_id
  FROM messages
  WHERE contact_id = p_contact_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    RAISE EXCEPTION 'No channel found for contact: %', p_contact_id;
  END IF;

  -- Insert outbound message
  INSERT INTO messages (
    direction,
    message_type,
    content,
    contact_id,
    channel_id,
    sender_name,
    sent_at
  )
  VALUES (
    'outbound',
    p_message_type::message_type,
    p_content,
    p_contact_id,
    v_channel_id,
    'system',
    now()
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

-- Insert default channels
INSERT INTO channels (type, name, is_active)
VALUES
  ('whatsapp', 'WhatsApp Business', true),
  ('telegram', 'Telegram Bot', true),
  ('email', 'Support Email', true),
  ('webchat', 'Website Chat', true)
ON CONFLICT (type, name) DO NOTHING;