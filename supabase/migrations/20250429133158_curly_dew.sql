/*
  # Knowledge Base and AI Agents Schema

  1. New Tables
    - knowledge_bases: Stores information about knowledge bases
    - documents: Stores documents for knowledge bases
    - document_chunks: Stores document chunks with JSON embeddings instead of vectors
    - ai_agents: Stores AI agent configurations
    - agent_knowledge_bases: Junction table for agents and knowledge bases

  2. Security
    - Enable RLS for all tables
    - Add appropriate policies
*/

-- Create knowledge_bases table
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  department_id uuid REFERENCES departments(id),
  team_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_trained timestamptz
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  file_url text,
  file_type text,
  file_size integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_chunks table (modified to not use vector)
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding_data jsonb DEFAULT NULL, -- Store embedding as JSON array instead of vector
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  is_active boolean DEFAULT true,
  is_global boolean DEFAULT false,
  department_id uuid REFERENCES departments(id),
  team_id uuid REFERENCES teams(id),
  settings jsonb DEFAULT '{
    "greeting": "Olá! Sou o assistente virtual. Como posso ajudar?",
    "max_context_length": 10,
    "temperature": 0.7,
    "model": "gpt-4o",
    "prompt_template": "Você é um assistente útil e amigável para a empresa. Responda às perguntas do cliente de maneira educada e profissional.",
    "conversation_limit": 10
  }',
  performance jsonb DEFAULT '{
    "conversations_handled": 0,
    "success_rate": 0,
    "avg_resolution_time": "0s",
    "handoff_rate": 0
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_knowledge_bases junction table
CREATE TABLE IF NOT EXISTS agent_knowledge_bases (
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  knowledge_base_id uuid REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (agent_id, knowledge_base_id)
);

-- Enable RLS
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge_bases ENABLE ROW LEVEL SECURITY;

-- Create policies for knowledge_bases
CREATE POLICY "Authenticated users can read knowledge bases"
  ON knowledge_bases FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage knowledge bases"
  ON knowledge_bases FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Create policies for documents
CREATE POLICY "Authenticated users can read documents"
  ON documents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage documents"
  ON documents FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Create policies for document_chunks
CREATE POLICY "Only AI system can access document chunks"
  ON document_chunks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin')
    )
  );

-- Create policies for ai_agents
CREATE POLICY "Authenticated users can read AI agents"
  ON ai_agents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage AI agents"
  ON ai_agents FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Create policies for agent_knowledge_bases
CREATE POLICY "Authenticated users can read agent knowledge bases"
  ON agent_knowledge_bases FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage agent knowledge bases"
  ON agent_knowledge_bases FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Create sample data for testing
INSERT INTO knowledge_bases (name, description, is_active)
VALUES 
  ('Base de Conhecimento Geral', 'Documentação geral do produto e FAQ', true),
  ('Suporte Técnico', 'Base de conhecimento para o time de suporte técnico', true),
  ('FAQs de Vendas', 'Perguntas frequentes sobre produtos e serviços', true)
ON CONFLICT DO NOTHING;

-- Functions for AI operations
CREATE OR REPLACE FUNCTION create_embeddings_for_document(document_id uuid)
RETURNS void AS $$
BEGIN
  -- This is a placeholder function
  -- In a real implementation, this would call an Edge Function to generate embeddings
  RAISE NOTICE 'Creating embeddings for document %', document_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update document status when processed
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS trigger AS $$
BEGIN
  NEW.status := 'processed';
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;