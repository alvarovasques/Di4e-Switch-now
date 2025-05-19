/*
  # Assign agents to conversations and add example messages

  1. Changes
    - Assigns agents to conversations based on team membership
    - Updates messages to use conversation_id
    - Adds example conversations with detailed interactions

  2. Security
    - No changes to RLS policies
*/

-- Assign conversations to agents using a subquery
UPDATE conversations c
SET assigned_to = (
  SELECT a.id
  FROM agents a
  JOIN team_members tm ON tm.agent_id = a.id
  WHERE tm.team_id = c.team_id
  AND a.role = 'agent'
  AND c.assigned_to IS NULL
  LIMIT 1
);

-- Update messages to use conversation_id instead of session_id
UPDATE messages m
SET conversation_id = m.session_id
WHERE conversation_id IS NULL
AND session_id IS NOT NULL;

-- Add example conversation for technical support
WITH tech_conv AS (
  SELECT c.id, c.created_at
  FROM conversations c
  JOIN departments d ON c.department_id = d.id
  WHERE d.name = 'Suporte Avançado'
  LIMIT 1
),
tech_messages AS (
  SELECT 
    (SELECT id FROM tech_conv) as conv_id,
    (SELECT created_at FROM tech_conv) as base_time,
    m.direction,
    m.content,
    m.sender_name,
    m.msg_order
  FROM (
    VALUES
      ('inbound'::message_direction, 'Olá, estou com problemas para configurar a integração com Salesforce. O endpoint não está respondendo.', 'Cliente', 1),
      ('outbound'::message_direction, 'Olá! Sou o Pedro do suporte técnico. Vou te ajudar com isso. Você está usando a versão mais recente da API?', 'Pedro Silva', 2),
      ('inbound'::message_direction, 'Sim, estou usando a v2.0. O erro começou após a última atualização.', 'Cliente', 3),
      ('outbound'::message_direction, 'Entendi. Vou verificar os logs da sua integração. Pode me informar o ID da sua organização?', 'Pedro Silva', 4),
      ('inbound'::message_direction, 'O ID é ORG-123456', 'Cliente', 5),
      ('outbound'::message_direction, 'Localizei o problema. Há um parâmetro incorreto na configuração do webhook. Vou te enviar um guia de correção.', 'Pedro Silva', 6)
  ) as m(direction, content, sender_name, msg_order)
)
INSERT INTO messages (
  conversation_id,
  direction,
  message_type,
  content,
  sender_name,
  created_at
)
SELECT 
  conv_id,
  direction,
  'text'::message_type,
  content,
  sender_name,
  base_time + (msg_order || ' minutes')::interval
FROM tech_messages;

-- Add example conversation for sales
WITH sales_conv AS (
  SELECT c.id, c.created_at
  FROM conversations c
  JOIN departments d ON c.department_id = d.id
  WHERE d.name = 'Vendas Corporativas'
  LIMIT 1
),
sales_messages AS (
  SELECT 
    (SELECT id FROM sales_conv) as conv_id,
    (SELECT created_at FROM sales_conv) as base_time,
    m.direction,
    m.content,
    m.sender_name,
    m.msg_order
  FROM (
    VALUES
      ('inbound'::message_direction, 'Boa tarde, gostaria de conhecer melhor o plano Business.', 'Cliente', 1),
      ('outbound'::message_direction, 'Olá! Me chamo Julia da equipe de vendas. Ficarei feliz em apresentar nossa solução. Qual o tamanho da sua empresa?', 'Julia Santos', 2),
      ('inbound'::message_direction, 'Temos 200 funcionários e estamos crescendo.', 'Cliente', 3),
      ('outbound'::message_direction, 'Excelente! O plano Business é perfeito para empresas do seu porte. Posso preparar uma demonstração personalizada?', 'Julia Santos', 4),
      ('inbound'::message_direction, 'Sim, seria ótimo. Quais horários disponíveis?', 'Cliente', 5),
      ('outbound'::message_direction, 'Temos disponibilidade amanhã às 14h ou 16h. Qual horário prefere?', 'Julia Santos', 6)
  ) as m(direction, content, sender_name, msg_order)
)
INSERT INTO messages (
  conversation_id,
  direction,
  message_type,
  content,
  sender_name,
  created_at
)
SELECT 
  conv_id,
  direction,
  'text'::message_type,
  content,
  sender_name,
  base_time + (msg_order || ' minutes')::interval
FROM sales_messages;

-- Add example conversation for customer service
WITH service_conv AS (
  SELECT c.id, c.created_at
  FROM conversations c
  JOIN departments d ON c.department_id = d.id
  WHERE d.name = 'Atendimento Padrão'
  LIMIT 1
),
service_messages AS (
  SELECT 
    (SELECT id FROM service_conv) as conv_id,
    (SELECT created_at FROM service_conv) as base_time,
    m.direction,
    m.content,
    m.sender_name,
    m.msg_order
  FROM (
    VALUES
      ('inbound'::message_direction, 'Preciso de ajuda com minha assinatura. Não consigo acessar alguns recursos.', 'Cliente', 1),
      ('outbound'::message_direction, 'Olá! Sou a Mariana do suporte. Vou te ajudar a resolver isso. Pode me informar seu email cadastrado?', 'Mariana Costa', 2),
      ('inbound'::message_direction, 'Claro, é cliente@email.com', 'Cliente', 3),
      ('outbound'::message_direction, 'Obrigada! Estou verificando sua conta... Vejo que houve uma falha na última renovação.', 'Mariana Costa', 4),
      ('inbound'::message_direction, 'Sim, tentei renovar mas deu erro no pagamento.', 'Cliente', 5),
      ('outbound'::message_direction, 'Não se preocupe, vou reprocessar o pagamento agora. Em alguns minutos seu acesso será normalizado.', 'Mariana Costa', 6)
  ) as m(direction, content, sender_name, msg_order)
)
INSERT INTO messages (
  conversation_id,
  direction,
  message_type,
  content,
  sender_name,
  created_at
)
SELECT 
  conv_id,
  direction,
  'text'::message_type,
  content,
  sender_name,
  base_time + (msg_order || ' minutes')::interval
FROM service_messages;