/*
  # Add team management and conversation grouping

  1. New Tables
    - `teams` - For managing agent groups
    - `team_members` - Associates agents with teams
    - `team_departments` - Associates teams with departments

  2. Updates
    - Add team_id to conversations table
    - Update RLS policies for team-based access
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES agents(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid REFERENCES teams(id),
  agent_id uuid REFERENCES agents(id),
  is_leader boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, agent_id)
);

-- Create team_departments table
CREATE TABLE IF NOT EXISTS team_departments (
  team_id uuid REFERENCES teams(id),
  department_id uuid REFERENCES departments(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, department_id)
);

-- Add team_id to conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_departments ENABLE ROW LEVEL SECURITY;

-- Policies for teams
CREATE POLICY "Authenticated users can read teams"
  ON teams FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage teams"
  ON teams FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Policies for team_members
CREATE POLICY "Authenticated users can read team members"
  ON team_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage team members"
  ON team_members FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Policies for team_departments
CREATE POLICY "Authenticated users can read team departments"
  ON team_departments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage team departments"
  ON team_departments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    )
  );

-- Update conversations policy to include team-based access
DROP POLICY IF EXISTS "Agents can read assigned conversations" ON conversations;
CREATE POLICY "Agents can read conversations based on role and team"
  ON conversations FOR SELECT TO authenticated
  USING (
    -- Admin and managers can see all conversations
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND (agents.role = 'admin' OR agents.role = 'manager')
    ) OR
    -- Supervisors can see their team's conversations
    EXISTS (
      SELECT 1 FROM agents a
      JOIN team_members tm ON tm.agent_id = a.id
      WHERE a.auth_id = auth.uid()
      AND a.role = 'supervisor'
      AND tm.team_id = conversations.team_id
    ) OR
    -- Agents can only see their assigned conversations
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.auth_id = auth.uid()
      AND agents.id = conversations.assigned_to
    )
  );

-- Function to assign conversation to team
CREATE OR REPLACE FUNCTION assign_conversation_to_team(
  conversation_uuid uuid,
  team_uuid uuid
) RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET 
    team_id = team_uuid,
    updated_at = now()
  WHERE id = conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_team_id ON conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_agent_id ON team_members(agent_id);