/*
  # Add Example Tickets with Messages

  1. Changes
    - Create example tickets with messages
    - Ensure departments and teams exist
    - Fix unique constraint issues
*/

-- First ensure required departments and teams exist
INSERT INTO departments (name, description, is_active)
SELECT 'Suporte Técnico', 'Departamento de suporte técnico', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Suporte Técnico');

INSERT INTO departments (name, description, is_active)
SELECT 'Produto', 'Departamento de produto', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Produto');

INSERT INTO departments (name, description, is_active)
SELECT 'Faturamento', 'Departamento de faturamento', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Faturamento');

INSERT INTO teams (name, description, is_active)
SELECT 'Suporte Técnico N2', 'Time de suporte nível 2', true
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Suporte Técnico N2');

INSERT INTO teams (name, description, is_active)
SELECT 'Atendimento Padrão', 'Time de atendimento padrão', true
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Atendimento Padrão');

-- Technical Support Ticket
DO $$ 
DECLARE
  v_ticket_id uuid;
  v_created_at timestamptz;
  v_department_id uuid;
  v_team_id uuid;
BEGIN
  -- Get department and team IDs
  SELECT id INTO v_department_id FROM departments WHERE name = 'Suporte Técnico';
  SELECT id INTO v_team_id FROM teams WHERE name = 'Suporte Técnico N2';

  IF v_department_id IS NULL OR v_team_id IS NULL THEN
    RAISE EXCEPTION 'Department or team not found';
  END IF;

  -- Insert ticket
  INSERT INTO tickets (
    subject,
    status,
    priority,
    client_email,
    department_id,
    team_id,
    channel,
    created_at
  )
  VALUES (
    'Erro 500 na API de Integração',
    'open',
    'high',
    'tech@empresa.com',
    v_department_id,
    v_team_id,
    'email',
    now() - interval '2 hours'
  )
  RETURNING id, created_at INTO v_ticket_id, v_created_at;

  -- Insert messages
  INSERT INTO ticket_messages (
    ticket_id,
    sender_type,
    sender_email,
    message,
    created_at
  )
  VALUES
    (v_ticket_id, 'client', 'tech@empresa.com', 
    'Estamos enfrentando erros 500 na API de integração desde as 14h. Todos os endpoints estão retornando erro e isso está impactando nossa operação.

Logs do erro:
- Timestamp: 14:00:23
- Endpoint: /api/v1/sync
- Error: Internal Server Error
- Stack trace anexado

Precisamos de suporte urgente.',
    v_created_at + interval '1 minute'),
    
    (v_ticket_id, 'agent', 'suporte@empresa.com',
    'Olá! Estou analisando o problema.

Identificamos que o erro está relacionado ao limite de conexões do banco de dados. Vamos aumentar o pool de conexões e monitorar.

Por favor, tentem novamente em 5 minutos.',
    v_created_at + interval '2 minutes'),

    (v_ticket_id, 'client', 'tech@empresa.com',
    'Ainda estamos recebendo erros após o ajuste. O sistema continua instável.',
    v_created_at + interval '3 minutes'),

    (v_ticket_id, 'agent', 'suporte@empresa.com',
    'Identificamos a causa raiz: um deadlock no banco de dados.

Ações tomadas:
1. Aumentamos o timeout das transações
2. Otimizamos as queries problemáticas
3. Adicionamos mais recursos ao cluster

O sistema deve normalizar nos próximos minutos. Continuaremos monitorando.',
    v_created_at + interval '4 minutes');
END $$;

-- Feature Request Ticket
DO $$ 
DECLARE
  v_ticket_id uuid;
  v_created_at timestamptz;
  v_department_id uuid;
  v_team_id uuid;
BEGIN
  -- Get department and team IDs
  SELECT id INTO v_department_id FROM departments WHERE name = 'Produto';
  SELECT id INTO v_team_id FROM teams WHERE name = 'Suporte Técnico N2';

  IF v_department_id IS NULL OR v_team_id IS NULL THEN
    RAISE EXCEPTION 'Department or team not found';
  END IF;

  -- Insert ticket
  INSERT INTO tickets (
    subject,
    status,
    priority,
    client_email,
    department_id,
    team_id,
    channel,
    created_at
  )
  VALUES (
    'Solicitação: Integração com Microsoft Teams',
    'pending',
    'medium',
    'product@clientexyz.com',
    v_department_id,
    v_team_id,
    'email',
    now() - interval '1 day'
  )
  RETURNING id, created_at INTO v_ticket_id, v_created_at;

  -- Insert messages
  INSERT INTO ticket_messages (
    ticket_id,
    sender_type,
    sender_email,
    message,
    created_at
  )
  VALUES
    (v_ticket_id, 'client', 'product@clientexyz.com',
    'Prezados,

Gostaríamos de solicitar uma nova funcionalidade: integração com Microsoft Teams.

Casos de uso:
1. Notificações de alertas críticos
2. Chatbot para consultas rápidas
3. Compartilhamento de relatórios

Nossa equipe usa muito o Teams e essa integração aumentaria nossa produtividade.

Aguardo feedback sobre a viabilidade.

Atenciosamente,
João Silva',
    v_created_at + interval '1 minute'),

    (v_ticket_id, 'agent', 'produto@empresa.com',
    'Olá João,

Obrigado pela sugestão! A integração com Microsoft Teams já está em nosso roadmap para o próximo trimestre.

Gostaríamos de agendar uma call para entender melhor seus casos de uso e possivelmente incluí-lo em nosso programa de beta testers.

Você teria disponibilidade esta semana?

Atenciosamente,
Maria',
    v_created_at + interval '2 minutes'),

    (v_ticket_id, 'client', 'product@clientexyz.com',
    'Ótimo! Tenho disponibilidade amanhã às 14h ou 16h.',
    v_created_at + interval '3 minutes'),

    (v_ticket_id, 'agent', 'produto@empresa.com',
    'Perfeito! Agendei para amanhã às 14h.

Enviei o convite por email com o link da reunião.

Até lá!',
    v_created_at + interval '4 minutes');
END $$;

-- Billing Support Ticket
DO $$ 
DECLARE
  v_ticket_id uuid;
  v_created_at timestamptz;
  v_department_id uuid;
  v_team_id uuid;
BEGIN
  -- Get department and team IDs
  SELECT id INTO v_department_id FROM departments WHERE name = 'Faturamento';
  SELECT id INTO v_team_id FROM teams WHERE name = 'Atendimento Padrão';

  IF v_department_id IS NULL OR v_team_id IS NULL THEN
    RAISE EXCEPTION 'Department or team not found';
  END IF;

  -- Insert ticket
  INSERT INTO tickets (
    subject,
    status,
    priority,
    client_email,
    department_id,
    team_id,
    channel,
    created_at
  )
  VALUES (
    'Erro na cobrança recorrente',
    'resolved',
    'high',
    'financeiro@clientabc.com',
    v_department_id,
    v_team_id,
    'email',
    now() - interval '3 days'
  )
  RETURNING id, created_at INTO v_ticket_id, v_created_at;

  -- Insert messages
  INSERT INTO ticket_messages (
    ticket_id,
    sender_type,
    sender_email,
    message,
    created_at
  )
  VALUES
    (v_ticket_id, 'client', 'financeiro@clientabc.com',
    'Urgente: Fomos cobrados duas vezes este mês.

Detalhes:
- Valor: R$ 1.999,00
- Datas: 05/04 e 07/04
- Cartão final 1234

Por favor, precisamos do estorno da cobrança duplicada o mais rápido possível.',
    v_created_at + interval '1 minute'),

    (v_ticket_id, 'agent', 'financeiro@empresa.com',
    'Olá! Lamento pelo transtorno.

Confirmei em nosso sistema que houve um erro na integração com a operadora do cartão, causando a duplicidade.

Já iniciei o processo de estorno, que deve ser concluído em até 72h úteis.

Como cortesia pelo inconveniente, aplicarei um desconto de 20% na próxima fatura.',
    v_created_at + interval '2 minutes'),

    (v_ticket_id, 'client', 'financeiro@clientabc.com',
    'Obrigado pela rapidez no atendimento. Vamos aguardar o estorno.',
    v_created_at + interval '3 minutes'),

    (v_ticket_id, 'agent', 'financeiro@empresa.com',
    'O estorno foi processado com sucesso. O valor já deve estar disponível em seu cartão.

O desconto de 20% já está registrado para a próxima fatura.

Há mais alguma coisa em que possa ajudar?',
    v_created_at + interval '4 minutes'),

    (v_ticket_id, 'client', 'financeiro@clientabc.com',
    'Perfeito! Valor estornado recebido. Obrigado pela atenção.',
    v_created_at + interval '5 minutes');
END $$;