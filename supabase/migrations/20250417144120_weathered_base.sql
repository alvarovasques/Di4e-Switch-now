/*
  # Add sample data for demonstration

  This migration adds sample data while checking for existing records to avoid duplicates:
  1. Teams and Departments
  2. Customers with different funnel stages
  3. Business Rules and SLA Configs
  4. Tags and Customer Tags
  5. Tasks and Notes
  6. Webhooks
  7. Conversations and Messages
*/

-- Sample Teams
INSERT INTO teams (name, description, is_active)
SELECT 'Vendas', 'Equipe de vendas', true
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Vendas');

INSERT INTO teams (name, description, is_active)
SELECT 'Suporte', 'Equipe de suporte técnico', true
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Suporte');

INSERT INTO teams (name, description, is_active)
SELECT 'Atendimento', 'Equipe de atendimento ao cliente', true
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Atendimento');

INSERT INTO teams (name, description, is_active)
SELECT 'Retenção', 'Equipe de retenção de clientes', true
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Retenção');

-- Sample Departments
INSERT INTO departments (name, description, is_active)
SELECT 'Comercial', 'Departamento comercial', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Comercial');

INSERT INTO departments (name, description, is_active)
SELECT 'Suporte Técnico', 'Departamento de suporte técnico', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Suporte Técnico');

INSERT INTO departments (name, description, is_active)
SELECT 'SAC', 'Serviço de atendimento ao cliente', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'SAC');

INSERT INTO departments (name, description, is_active)
SELECT 'Pós-Venda', 'Departamento de pós-venda', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Pós-Venda');

-- Sample Tags
INSERT INTO tags (name, color)
SELECT 'VIP', '#FF6B6B'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'VIP');

INSERT INTO tags (name, color)
SELECT 'Novo Cliente', '#4ECDC4'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Novo Cliente');

INSERT INTO tags (name, color)
SELECT 'Premium', '#45B7D1'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Premium');

INSERT INTO tags (name, color)
SELECT 'Em Risco', '#FF9F1C'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Em Risco');

INSERT INTO tags (name, color)
SELECT 'Oportunidade', '#98CA3F'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Oportunidade');

-- Sample Customers with different funnel stages
DO $$
DECLARE
  v_customer_id uuid;
BEGIN
  -- João Silva
  INSERT INTO customers (name, email, phone, channel_type, funnel_stage, status, first_seen, last_seen)
  SELECT 'João Silva', 'joao.silva@email.com', '+5511999999999', 'whatsapp', 'lead', 'new', NOW() - INTERVAL '30 days', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'joao.silva@email.com')
  RETURNING id INTO v_customer_id;

  IF v_customer_id IS NOT NULL THEN
    INSERT INTO customer_tags (customer_id, tag_id)
    SELECT v_customer_id, id FROM tags WHERE name = 'Novo Cliente';
  END IF;

  -- Maria Santos
  INSERT INTO customers (name, email, phone, channel_type, funnel_stage, status, first_seen, last_seen)
  SELECT 'Maria Santos', 'maria.santos@email.com', '+5511988888888', 'telegram', 'contact', 'active', NOW() - INTERVAL '25 days', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'maria.santos@email.com')
  RETURNING id INTO v_customer_id;

  IF v_customer_id IS NOT NULL THEN
    INSERT INTO customer_tags (customer_id, tag_id)
    SELECT v_customer_id, id FROM tags WHERE name = 'Oportunidade';
  END IF;

  -- Additional customers
  INSERT INTO customers (name, email, phone, channel_type, funnel_stage, status, first_seen, last_seen)
  SELECT 'Pedro Oliveira', 'pedro.oliveira@email.com', '+5511977777777', 'email', 'qualification', 'active', NOW() - INTERVAL '20 days', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'pedro.oliveira@email.com');

  INSERT INTO customers (name, email, phone, channel_type, funnel_stage, status, first_seen, last_seen)
  SELECT 'Ana Costa', 'ana.costa@email.com', '+5511966666666', 'webchat', 'proposal', 'active', NOW() - INTERVAL '15 days', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'ana.costa@email.com');

  INSERT INTO customers (name, email, phone, channel_type, funnel_stage, status, first_seen, last_seen)
  SELECT 'Carlos Ferreira', 'carlos.ferreira@email.com', '+5511955555555', 'whatsapp', 'negotiation', 'active', NOW() - INTERVAL '10 days', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'carlos.ferreira@email.com');
END $$;

-- Sample Business Rules
INSERT INTO business_rules (name, description, rule_type, conditions, actions, is_active, priority)
SELECT 'Distribuição VIP', 'Direcionar clientes VIP para equipe especializada', 'routing', 
  '{"tags": ["VIP"]}', 
  '{"assign_team": "Vendas"}',
  true, 100
WHERE NOT EXISTS (SELECT 1 FROM business_rules WHERE name = 'Distribuição VIP');

INSERT INTO business_rules (name, description, rule_type, conditions, actions, is_active, priority)
SELECT 'SLA Premium', 'Definir SLA diferenciado para clientes premium', 'sla',
  '{"tags": ["Premium"]}',
  '{"first_response_time": "00:30:00", "resolution_time": "04:00:00"}',
  true, 90
WHERE NOT EXISTS (SELECT 1 FROM business_rules WHERE name = 'SLA Premium');

-- Sample SLA Configs
INSERT INTO sla_configs (department_id, priority, first_response_time, resolution_time)
SELECT 
  d.id,
  priority_level,
  CASE 
    WHEN priority_level = 'urgent' THEN INTERVAL '30 minutes'
    WHEN priority_level = 'high' THEN INTERVAL '1 hour'
    WHEN priority_level = 'medium' THEN INTERVAL '4 hours'
    ELSE INTERVAL '24 hours'
  END,
  CASE 
    WHEN priority_level = 'urgent' THEN INTERVAL '4 hours'
    WHEN priority_level = 'high' THEN INTERVAL '8 hours'
    WHEN priority_level = 'medium' THEN INTERVAL '24 hours'
    ELSE INTERVAL '48 hours'
  END
FROM departments d
CROSS JOIN (
  VALUES 
    ('urgent'::priority_level),
    ('high'::priority_level),
    ('medium'::priority_level),
    ('low'::priority_level)
) AS p(priority_level)
WHERE d.name = 'SAC'
AND NOT EXISTS (
  SELECT 1 FROM sla_configs sc 
  WHERE sc.department_id = d.id 
  AND sc.priority = priority_level
);

-- Sample Webhooks
INSERT INTO webhooks (name, url, events, is_active, secret_key)
SELECT 
  'Notificações CRM',
  'https://crm.exemplo.com/webhook',
  ARRAY['conversation.created', 'conversation.closed'],
  true,
  'webhook_secret_123'
WHERE NOT EXISTS (SELECT 1 FROM webhooks WHERE name = 'Notificações CRM');

INSERT INTO webhooks (name, url, events, is_active, secret_key)
SELECT 
  'Integração Vendas',
  'https://vendas.exemplo.com/webhook',
  ARRAY['customer.created', 'customer.updated'],
  true,
  'webhook_secret_456'
WHERE NOT EXISTS (SELECT 1 FROM webhooks WHERE name = 'Integração Vendas');

-- Sample Conversations
DO $$
DECLARE
  v_customer_id uuid;
  v_department_id uuid;
BEGIN
  SELECT id INTO v_department_id FROM departments WHERE name = 'SAC' LIMIT 1;
  
  FOR v_customer_id IN 
    SELECT id FROM customers 
    WHERE funnel_stage IN ('contact', 'qualification', 'proposal')
  LOOP
    INSERT INTO conversations (
      customer_id,
      department_id,
      channel_type,
      status,
      priority,
      subject,
      created_at
    )
    SELECT
      v_customer_id,
      v_department_id,
      c.channel_type,
      'open'::ticket_status,
      'medium'::priority_level,
      'Dúvida sobre produto',
      NOW() - (random() * INTERVAL '30 days')
    FROM customers c
    WHERE c.id = v_customer_id
    AND NOT EXISTS (
      SELECT 1 FROM conversations 
      WHERE customer_id = v_customer_id
      AND department_id = v_department_id
    );
  END LOOP;
END $$;