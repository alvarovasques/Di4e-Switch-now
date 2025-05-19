/*
  # Add Webhook Events Table and Enhance Webhooks

  1. New Tables
    - webhook_events: Stores webhook event history and processing status
  
  2. Changes
    - Add description, last_triggered, and metadata fields to webhooks table
    - Create indexes for better performance
    - Add trigger to update last_triggered timestamp
  
  3. Security
    - Enable RLS on webhook_events table
    - Add policy for authenticated users with system configuration permission
*/

-- Create webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  result_data jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Add new fields to webhooks table if they don't exist
ALTER TABLE webhooks 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS last_triggered timestamptz,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Enable RLS on webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid errors
DROP POLICY IF EXISTS "Authenticated users can read webhook events" ON webhook_events;

-- Create policy for webhook_events
CREATE POLICY "Authenticated users can read webhook events"
  ON webhook_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND ((agents.permissions->>'can_configure_system')::boolean = true OR agents.role = 'admin')
    )
  );

-- Create or replace function to update webhook last_triggered
CREATE OR REPLACE FUNCTION update_webhook_last_triggered()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE webhooks
  SET last_triggered = now()
  WHERE id = NEW.webhook_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS update_webhook_last_triggered ON webhook_events;

-- Create trigger for updating webhook last_triggered
CREATE TRIGGER update_webhook_last_triggered
  AFTER INSERT ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_last_triggered();

-- Insert sample webhook event types for documentation if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM webhooks 
    WHERE name = 'Webhook de Documentação'
  ) THEN
    INSERT INTO webhooks (
      name, 
      url, 
      events, 
      is_active, 
      secret_key, 
      description
    )
    VALUES (
      'Webhook de Documentação',
      'https://exemplo.com/webhook',
      ARRAY['conversation.created', 'message.created', 'customer.created', 'ticket.updated', 'ai.conversation.completed'],
      false,
      'sample_secret_key_123',
      'Este webhook é apenas para documentação e não é acionado em ambiente de produção. Ele lista todos os tipos de eventos disponíveis.'
    );
  END IF;
END $$;