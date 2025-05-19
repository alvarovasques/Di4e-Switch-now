/*
  # Sample Data Migration

  This migration adds sample data for teams, departments, customers, and related entities.

  1. Teams & Departments
    - Creates additional teams with different specialties
    - Creates additional departments with specific functions

  2. Customers & Conversations
    - Creates sample customers in different funnel stages
    - Adds sample conversations and messages
*/

-- Additional Teams
INSERT INTO teams (name, description, is_active)
SELECT * FROM (VALUES
  ('Vendas Corporativas', 'Equipe especializada em vendas B2B', true),
  ('Vendas Varejo', 'Equipe focada em clientes varejo', true),
  ('Suporte Técnico N1', 'Primeiro nível de suporte técnico', true),
  ('Suporte Técnico N2', 'Segundo nível de suporte técnico', true),
  ('Suporte Técnico N3', 'Terceiro nível de suporte técnico', true),
  ('Atendimento Premium', 'Equipe dedicada a clientes VIP', true),
  ('Atendimento Padrão', 'Equipe de atendimento geral', true),
  ('Retenção Proativa', 'Equipe de prevenção de cancelamentos', true),
  ('Retenção Reativa', 'Equipe de recuperação de clientes', true)
) AS v(name, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM teams WHERE name = v.name
);

-- Additional Departments
INSERT INTO departments (name, description, is_active)
SELECT * FROM (VALUES
  ('Vendas Diretas', 'Vendas diretas ao consumidor', true),
  ('Vendas Corporativas', 'Vendas para empresas', true),
  ('Suporte Básico', 'Suporte para problemas comuns', true),
  ('Suporte Avançado', 'Suporte para problemas complexos', true),
  ('Atendimento VIP', 'Atendimento exclusivo', true),
  ('Faturamento', 'Questões financeiras e cobranças', true),
  ('Cancelamento', 'Processos de cancelamento', true),
  ('Ouvidoria', 'Atendimento de reclamações', true)
) AS v(name, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE name = v.name
);

-- Additional Customers
INSERT INTO customers (name, email, phone, channel_type, funnel_stage, status, first_seen, last_seen)
SELECT 
  v.name,
  v.email,
  v.phone,
  v.channel_type::channel_type,
  v.funnel_stage,
  v.status,
  v.first_seen,
  v.last_seen
FROM (VALUES
  ('Ricardo Mendes', 'ricardo.mendes@email.com', '+5511922222222', 'whatsapp', 'lead', 'new', NOW() - INTERVAL '15 days', NOW()),
  ('Fernanda Lima', 'fernanda.lima@email.com', '+5511933333333', 'telegram', 'contact', 'active', NOW() - INTERVAL '12 days', NOW()),
  ('Gabriel Santos', 'gabriel.santos@email.com', '+5511944444444', 'email', 'qualification', 'active', NOW() - INTERVAL '10 days', NOW()),
  ('Juliana Costa', 'juliana.costa@email.com', '+5511955555555', 'webchat', 'proposal', 'active', NOW() - INTERVAL '8 days', NOW()),
  ('Marcelo Silva', 'marcelo.silva@email.com', '+5511966666666', 'whatsapp', 'negotiation', 'active', NOW() - INTERVAL '5 days', NOW()),
  ('Patricia Oliveira', 'patricia.oliveira@email.com', '+5511977777777', 'telegram', 'closed_won', 'active', NOW() - INTERVAL '3 days', NOW()),
  ('Henrique Souza', 'henrique.souza@email.com', '+5511988888888', 'email', 'closed_lost', 'inactive', NOW() - INTERVAL '2 days', NOW()),
  ('Camila Pereira', 'camila.pereira@email.com', '+5511999999999', 'whatsapp', 'lead', 'new', NOW() - INTERVAL '1 day', NOW()),
  ('Lucas Ferreira', 'lucas.ferreira@email.com', '+5511900000000', 'webchat', 'contact', 'active', NOW() - INTERVAL '6 hours', NOW()),
  ('Amanda Rodrigues', 'amanda.rodrigues@email.com', '+5511911111111', 'email', 'qualification', 'active', NOW() - INTERVAL '2 hours', NOW())
) AS v(name, email, phone, channel_type, funnel_stage, status, first_seen, last_seen)
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE email = v.email
);

-- Link customers with tags
INSERT INTO customer_tags (customer_id, tag_id)
SELECT c.id, t.id
FROM customers c
CROSS JOIN tags t
WHERE c.name = 'Ricardo Mendes' AND t.name = 'Novo Cliente'
   OR c.name = 'Fernanda Lima' AND t.name = 'Oportunidade'
   OR c.name = 'Gabriel Santos' AND t.name = 'Premium'
   OR c.name = 'Juliana Costa' AND t.name = 'VIP'
   OR c.name = 'Marcelo Silva' AND t.name = 'Em Risco';

-- Sample Tasks
INSERT INTO tasks (customer_id, title, description, due_date, status, created_by)
SELECT 
  c.id,
  CASE 
    WHEN c.funnel_stage = 'contact' THEN 'Agendar Demonstração'
    WHEN c.funnel_stage = 'qualification' THEN 'Enviar Material Técnico'
    WHEN c.funnel_stage = 'proposal' THEN 'Preparar Proposta Comercial'
    ELSE 'Fazer Acompanhamento'
  END,
  CASE 
    WHEN c.funnel_stage = 'contact' THEN 'Agendar demonstração do produto via Teams'
    WHEN c.funnel_stage = 'qualification' THEN 'Enviar documentação técnica detalhada'
    WHEN c.funnel_stage = 'proposal' THEN 'Elaborar proposta comercial personalizada'
    ELSE 'Realizar contato de acompanhamento'
  END,
  NOW() + INTERVAL '2 days',
  'pending',
  (SELECT id FROM agents WHERE role = 'agent' LIMIT 1)
FROM customers c
WHERE c.created_at > NOW() - INTERVAL '1 day'
AND c.funnel_stage IN ('contact', 'qualification', 'proposal');

-- Sample Notes
INSERT INTO notes (customer_id, content, created_by)
SELECT 
  c.id,
  CASE 
    WHEN c.funnel_stage = 'contact' THEN 'Cliente interessado em nossa solução enterprise'
    WHEN c.funnel_stage = 'qualification' THEN 'Cliente possui necessidades específicas de integração'
    WHEN c.funnel_stage = 'proposal' THEN 'Cliente solicitou desconto para pagamento anual'
    ELSE 'Cliente demonstrou interesse nos recursos avançados'
  END,
  (SELECT id FROM agents WHERE role = 'agent' LIMIT 1)
FROM customers c
WHERE c.created_at > NOW() - INTERVAL '1 day'
AND c.funnel_stage IN ('contact', 'qualification', 'proposal');

-- Sample Business Rules
INSERT INTO business_rules (name, description, rule_type, conditions, actions, is_active, priority)
VALUES
  ('Distribuição VIP', 'Direcionar clientes VIP para equipe especializada', 'routing', 
   '{"tags": ["VIP"]}', 
   '{"assign_team": "Vendas"}',
   true, 100),
  ('SLA Premium', 'Definir SLA diferenciado para clientes premium', 'sla',
   '{"tags": ["Premium"]}',
   '{"first_response_time": "00:30:00", "resolution_time": "04:00:00"}',
   true, 90);

-- Sample SLA Configs for new departments only
DO $$
DECLARE
  v_department record;
  v_priority priority_level;
BEGIN
  FOR v_department IN 
    SELECT id, name FROM departments 
    WHERE name IN ('Vendas Diretas', 'Vendas Corporativas', 'Suporte Básico', 'Suporte Avançado', 'Atendimento VIP')
    AND NOT EXISTS (
      SELECT 1 FROM sla_configs WHERE department_id = departments.id
    )
  LOOP
    FOR v_priority IN SELECT unnest(enum_range(NULL::priority_level))
    LOOP
      INSERT INTO sla_configs (
        department_id,
        priority,
        first_response_time,
        resolution_time
      ) VALUES (
        v_department.id,
        v_priority,
        CASE 
          WHEN v_priority = 'urgent' THEN INTERVAL '30 minutes'
          WHEN v_priority = 'high' THEN INTERVAL '1 hour'
          WHEN v_priority = 'medium' THEN INTERVAL '4 hours'
          ELSE INTERVAL '24 hours'
        END,
        CASE 
          WHEN v_priority = 'urgent' THEN INTERVAL '4 hours'
          WHEN v_priority = 'high' THEN INTERVAL '8 hours'
          WHEN v_priority = 'medium' THEN INTERVAL '24 hours'
          ELSE INTERVAL '48 hours'
        END
      );
    END LOOP;
  END LOOP;
END $$;