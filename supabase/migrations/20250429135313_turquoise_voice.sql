/*
  # Add webhook_events table and enhance webhooks

  This migration adds a webhook_events table to track webhook event history
  and enhances the webhooks table with additional functionality.

  1. Changes
    - Add webhook_events table to track event history
    - Add description field to webhooks
    - Add last_triggered field to webhooks
    - Add metadata field to webhooks
    - Create indexes for better performance

  2. Security
    - Enable RLS on the new table
    - Add appropriate policies
*/

-- Create webhook_events table
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

-- Add new fields to webhooks table
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

-- Create policies for webhook_events
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

-- Update webhook function to track last_triggered
CREATE OR REPLACE FUNCTION update_webhook_last_triggered()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE webhooks
  SET last_triggered = now()
  WHERE id = NEW.webhook_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating webhook last_triggered
CREATE TRIGGER update_webhook_last_triggered
  AFTER INSERT ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_last_triggered();

-- Insert sample webhook event types for documentation
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