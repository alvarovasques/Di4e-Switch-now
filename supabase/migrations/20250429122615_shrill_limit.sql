/*
  # Enhance conversations and tickets structure

  1. Changes
    - Add AI handling fields to conversations
    - Add knowledge base reference fields
    - Add conversation type field to better separate tickets
    - Add conversation priority and routing fields

  2. Security
    - Maintain existing RLS policies
*/

-- Add new fields to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS conversation_type text CHECK (conversation_type IN ('chat', 'ticket', 'ai_chat')),
ADD COLUMN IF NOT EXISTS knowledge_base_id uuid,
ADD COLUMN IF NOT EXISTS ai_confidence numeric(3,2),
ADD COLUMN IF NOT EXISTS ai_response_time interval,
ADD COLUMN IF NOT EXISTS routing_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_agent_response timestamptz,
ADD COLUMN IF NOT EXISTS last_customer_response timestamptz,
ADD COLUMN IF NOT EXISTS reopened_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reopened_at timestamptz,
ADD COLUMN IF NOT EXISTS satisfaction_score numeric(2,1),
ADD COLUMN IF NOT EXISTS satisfaction_feedback text;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_knowledge_base ON conversations(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_conversations_ai_confidence ON conversations(ai_confidence);

-- Update existing conversations to chat type
UPDATE conversations 
SET conversation_type = 'chat' 
WHERE conversation_type IS NULL;

-- Make conversation_type required
ALTER TABLE conversations 
ALTER COLUMN conversation_type SET NOT NULL;

-- Add function to handle conversation reopening
CREATE OR REPLACE FUNCTION handle_conversation_reopen()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('resolved', 'closed') AND NEW.status = 'open' THEN
    NEW.reopened_count = COALESCE(OLD.reopened_count, 0) + 1;
    NEW.reopened_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reopening
DROP TRIGGER IF EXISTS conversation_reopen_trigger ON conversations;
CREATE TRIGGER conversation_reopen_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_conversation_reopen();

-- Add function to update response timestamps
CREATE OR REPLACE FUNCTION update_conversation_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_type = 'agent' THEN
    UPDATE conversations 
    SET last_agent_response = NEW.created_at
    WHERE id = NEW.conversation_id;
  ELSIF NEW.sender_type = 'customer' THEN
    UPDATE conversations 
    SET last_customer_response = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for response times
DROP TRIGGER IF EXISTS message_response_time_trigger ON messages;
CREATE TRIGGER message_response_time_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_response_time();