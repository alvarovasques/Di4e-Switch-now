/*
  # Add custom channel type support

  1. Changes
    - Add 'custom' to channel_type enum
    - Update existing channel-related functions
*/

-- Add 'custom' to channel_type enum
ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'custom';

-- Update register_inbound_message function to handle custom channels
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