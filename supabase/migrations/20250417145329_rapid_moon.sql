/*
  # Add conversation_id to messages table

  1. Changes
    - Add conversation_id column to messages table
    - Add foreign key constraint to conversations table
    - Add index for better query performance

  2. Security
    - No changes to RLS policies
*/

-- Add conversation_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE messages 
    ADD COLUMN conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE;

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
    ON messages(conversation_id);
  END IF;
END $$;