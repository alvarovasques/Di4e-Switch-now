/*
  # Create webhooks table and functions

  1. New Tables
    - `webhooks`
      - `id` (uuid, primary key)
      - `name` (text)
      - `url` (text)
      - `events` (text[])
      - `is_active` (boolean)
      - `secret_key` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `webhooks` table
    - Add policy for authenticated users to read webhooks
*/

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  secret_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read webhooks"
  ON webhooks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage webhooks"
  ON webhooks FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to notify webhooks
CREATE OR REPLACE FUNCTION notify_webhooks(
  event_type text,
  payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_record RECORD;
BEGIN
  FOR webhook_record IN
    SELECT * FROM webhooks
    WHERE is_active = true
    AND event_type = ANY(events)
  LOOP
    -- In a real implementation, you would queue these notifications
    -- for asynchronous processing
    PERFORM pg_notify(
      'webhook_notifications',
      json_build_object(
        'webhook_id', webhook_record.id,
        'url', webhook_record.url,
        'secret_key', webhook_record.secret_key,
        'event_type', event_type,
        'payload', payload
      )::text
    );
  END LOOP;
END;
$$;