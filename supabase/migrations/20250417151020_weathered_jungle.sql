/*
  # Add team members to teams

  1. Changes
    - Add team members to existing teams
    - Associate agents with their respective teams
    - Set team leaders

  2. Teams Structure
    - Support Teams:
      - Suporte Técnico N1: First-level technical support
      - Suporte Técnico N2: Second-level technical support
      - Suporte Avançado: Advanced technical support
    
    - Sales Teams:
      - Vendas Corporativas: Corporate sales team
      - Vendas PME: SMB sales team
    
    - Customer Service Teams:
      - Atendimento Padrão: Standard customer service
      - Atendimento Premium: Premium customer service
      - Faturamento: Billing support
*/

-- Add team members for Support Teams
WITH support_teams AS (
  SELECT 
    t.id as team_id,
    t.name as team_name,
    a.id as agent_id,
    a.name as agent_name,
    a.role as agent_role
  FROM teams t
  CROSS JOIN agents a
  WHERE t.name IN ('Suporte Técnico N1', 'Suporte Técnico N2', 'Suporte Avançado')
  AND a.role IN ('agent', 'supervisor')
  AND a.active = true
)
INSERT INTO team_members (team_id, agent_id, is_leader)
SELECT 
  st.team_id,
  st.agent_id,
  CASE 
    WHEN st.agent_role = 'supervisor' THEN true
    ELSE false
  END as is_leader
FROM support_teams st
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = st.team_id 
  AND tm.agent_id = st.agent_id
);

-- Add team members for Sales Teams
WITH sales_teams AS (
  SELECT 
    t.id as team_id,
    t.name as team_name,
    a.id as agent_id,
    a.name as agent_name,
    a.role as agent_role
  FROM teams t
  CROSS JOIN agents a
  WHERE t.name IN ('Vendas Corporativas', 'Vendas PME')
  AND a.role IN ('agent', 'supervisor')
  AND a.active = true
)
INSERT INTO team_members (team_id, agent_id, is_leader)
SELECT 
  st.team_id,
  st.agent_id,
  CASE 
    WHEN st.agent_role = 'supervisor' THEN true
    ELSE false
  END as is_leader
FROM sales_teams st
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = st.team_id 
  AND tm.agent_id = st.agent_id
);

-- Add team members for Customer Service Teams
WITH service_teams AS (
  SELECT 
    t.id as team_id,
    t.name as team_name,
    a.id as agent_id,
    a.name as agent_name,
    a.role as agent_role
  FROM teams t
  CROSS JOIN agents a
  WHERE t.name IN ('Atendimento Padrão', 'Atendimento Premium', 'Faturamento')
  AND a.role IN ('agent', 'supervisor')
  AND a.active = true
)
INSERT INTO team_members (team_id, agent_id, is_leader)
SELECT 
  st.team_id,
  st.agent_id,
  CASE 
    WHEN st.agent_role = 'supervisor' THEN true
    ELSE false
  END as is_leader
FROM service_teams st
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = st.team_id 
  AND tm.agent_id = st.agent_id
);

-- Ensure each team has at least one supervisor
INSERT INTO team_members (team_id, agent_id, is_leader)
SELECT DISTINCT ON (t.id)
  t.id as team_id,
  a.id as agent_id,
  true as is_leader
FROM teams t
CROSS JOIN agents a
WHERE a.role = 'supervisor'
AND a.active = true
AND NOT EXISTS (
  SELECT 1 
  FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.is_leader = true
);

-- Update conversations to assign them to team members
UPDATE conversations c
SET assigned_to = (
  SELECT tm.agent_id
  FROM team_members tm
  JOIN agents a ON a.id = tm.agent_id
  WHERE tm.team_id = c.team_id
  AND a.role = 'agent'
  AND a.active = true
  AND NOT EXISTS (
    SELECT 1 
    FROM conversations c2 
    WHERE c2.assigned_to = tm.agent_id
    AND c2.status NOT IN ('resolved', 'closed')
  )
  LIMIT 1
)
WHERE c.assigned_to IS NULL;