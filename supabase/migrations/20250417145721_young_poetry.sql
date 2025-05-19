/*
  # Add Sample Conversations with Messages

  1. New Data
    - Creates 3 detailed conversations with multiple messages
    - Includes customer and agent interactions
    - Covers different departments and teams
    - Adds realistic conversation flows

  2. Conversation Types
    - Technical Support conversation
    - Sales conversation
    - Customer Service conversation
*/

-- Technical Support Conversation
WITH tech_conv AS (
  INSERT INTO conversations (
    customer_id,
    department_id,
    channel_type,
    status,
    priority,
    subject,
    team_id
  )
  SELECT 
    c.id,
    d.id,
    'whatsapp'::channel_type,
    'open'::ticket_status,
    'high'::priority_level,
    'Problema de conexão com API',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'ricardo.mendes@email.com'
    AND d.name = 'Suporte Avançado'
    AND t.name = 'Suporte Técnico N2'
  RETURNING id, created_at
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
      ('inbound'::message_direction, 'Bom dia! Estamos tendo problemas com a integração da API. Os webhooks pararam de funcionar há cerca de 30 minutos.', 'Ricardo Mendes', 1),
      ('outbound'::message_direction, 'Olá! Sou o Carlos do suporte técnico. Vou ajudar você com esse problema. Pode me informar qual endpoint específico está apresentando falha?', 'Carlos Silva', 2),
      ('inbound'::message_direction, 'É o endpoint de notificações em tempo real (/webhooks/notifications). Estamos recebendo erro 503.', 'Ricardo Mendes', 3),
      ('outbound'::message_direction, 'Entendi. Acabei de verificar e identificamos uma instabilidade no servidor de webhooks. Nossa equipe já está trabalhando na correção. Vou priorizar seu caso e acompanhar pessoalmente.', 'Carlos Silva', 4),
      ('inbound'::message_direction, 'Obrigado pela agilidade. Tem previsão de normalização?', 'Ricardo Mendes', 5),
      ('outbound'::message_direction, 'Sim, nossa estimativa é de 45 minutos para resolução. Vou manter você atualizado sobre o progresso. Enquanto isso, como alternativa temporária, você pode usar o endpoint de polling (/api/notifications/poll).', 'Carlos Silva', 6)
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

-- Sales Conversation
WITH sales_conv AS (
  INSERT INTO conversations (
    customer_id,
    department_id,
    channel_type,
    status,
    priority,
    subject,
    team_id
  )
  SELECT 
    c.id,
    d.id,
    'email'::channel_type,
    'open'::ticket_status,
    'medium'::priority_level,
    'Proposta Enterprise',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'fernanda.lima@email.com'
    AND d.name = 'Vendas Corporativas'
    AND t.name = 'Vendas Corporativas'
  RETURNING id, created_at
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
      ('inbound'::message_direction, 'Prezados, gostaria de receber uma proposta para o plano Enterprise. Somos uma empresa com 500 funcionários.', 'Fernanda Lima', 1),
      ('outbound'::message_direction, 'Olá Fernanda! Sou a Ana da equipe de vendas corporativas. Agradeço seu interesse em nossa solução Enterprise. Poderia me contar um pouco mais sobre as necessidades específicas da sua empresa?', 'Ana Oliveira', 2),
      ('inbound'::message_direction, 'Precisamos principalmente do módulo de automação de processos e integrações personalizadas. Também temos interesse no suporte 24/7.', 'Fernanda Lima', 3),
      ('outbound'::message_direction, 'Excelente! Nosso plano Enterprise inclui todas essas funcionalidades. Preparei uma apresentação detalhada das features que mais se adequam ao seu caso. Podemos agendar uma call para amanhã?', 'Ana Oliveira', 4),
      ('inbound'::message_direction, 'Sim, podemos fazer às 14h. Gostaria que abordássemos também a questão de treinamento da equipe.', 'Fernanda Lima', 5),
      ('outbound'::message_direction, 'Perfeito! Vou incluir nosso especialista em implementação na call para detalhar o processo de onboarding e treinamento. Enviarei o convite em seguida.', 'Ana Oliveira', 6),
      ('inbound'::message_direction, 'Ótimo, muito obrigada pela atenção. Aguardo o convite.', 'Fernanda Lima', 7)
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

-- Customer Service Conversation
WITH service_conv AS (
  INSERT INTO conversations (
    customer_id,
    department_id,
    channel_type,
    status,
    priority,
    subject,
    team_id
  )
  SELECT 
    c.id,
    d.id,
    'webchat'::channel_type,
    'open'::ticket_status,
    'medium'::priority_level,
    'Dúvida sobre faturamento',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'gabriel.santos@email.com'
    AND d.name = 'Faturamento'
    AND t.name = 'Atendimento Padrão'
  RETURNING id, created_at
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
      ('inbound'::message_direction, 'Boa tarde! Estou com uma dúvida sobre a última fatura. Foi cobrado um valor adicional que não entendi.', 'Gabriel Santos', 1),
      ('outbound'::message_direction, 'Olá Gabriel! Sou a Marina do setor de faturamento. Vou ajudar você com essa questão. Pode me informar o número da fatura?', 'Marina Costa', 2),
      ('inbound'::message_direction, 'Sim, é a fatura #123456, do dia 15/04.', 'Gabriel Santos', 3),
      ('outbound'::message_direction, 'Obrigada! Estou verificando... Identificei que o valor adicional se refere ao upgrade de plano solicitado no dia 10/04. Vou te enviar o detalhamento.', 'Marina Costa', 4),
      ('inbound'::message_direction, 'Mas eu não solicitei nenhum upgrade. Pode verificar novamente?', 'Gabriel Santos', 5),
      ('outbound'::message_direction, 'Peço desculpas pelo transtorno. Você está correto. Após uma verificação mais detalhada, identificei que houve um erro no sistema. Vou providenciar o estorno imediatamente.', 'Marina Costa', 6),
      ('inbound'::message_direction, 'Quanto tempo leva para o estorno ser processado?', 'Gabriel Santos', 7),
      ('outbound'::message_direction, 'O estorno será processado em até 5 dias úteis. Vou gerar um protocolo de acompanhamento e enviar por email. Como cortesia pelo inconveniente, também aplicarei um desconto de 20% na próxima fatura.', 'Marina Costa', 8)
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