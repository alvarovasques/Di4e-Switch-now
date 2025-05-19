-- Add example email ticket for feature request
WITH feature_ticket AS (
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
    'Sugestão de Nova Funcionalidade: Integração com Power BI',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'marcos.silva@email.com'
    AND d.name = 'Produto'
    AND t.name = 'Suporte Técnico N2'
  RETURNING id, created_at
),
feature_messages AS (
  SELECT 
    (SELECT id FROM feature_ticket) as conv_id,
    (SELECT created_at FROM feature_ticket) as base_time,
    m.direction,
    m.content,
    m.sender_name,
    m.msg_order
  FROM (
    VALUES
      ('inbound'::message_direction, 'Prezados,

Gostaria de sugerir uma nova funcionalidade para a plataforma. Seria muito útil ter uma integração nativa com o Power BI para facilitar a criação de dashboards personalizados.

Nossa equipe de BI atualmente precisa exportar os dados manualmente, o que consome muito tempo.

Atenciosamente,
Marcos Silva', 'Marcos Silva', 1),
      ('outbound'::message_direction, 'Olá Marcos,

Agradeço muito sua sugestão! Entendo perfeitamente a necessidade de uma integração mais fluida com ferramentas de BI.

Vou compartilhar sua sugestão com nossa equipe de produto. Inclusive, já temos alguns estudos sobre integrações similares em nosso roadmap.

Você teria disponibilidade para uma call rápida? Gostaria de entender melhor seu caso de uso para ajudar em nossa priorização.

Atenciosamente,
Rafael', 'Rafael Souza', 2)
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
FROM feature_messages;

-- Add example email ticket for bug report
WITH bug_ticket AS (
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
    'high'::priority_level,
    'Bug: Erro 500 ao gerar relatório mensal',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'patricia.santos@email.com'
    AND d.name = 'Suporte Avançado'
    AND t.name = 'Suporte Técnico N2'
  RETURNING id, created_at
),
bug_messages AS (
  SELECT 
    (SELECT id FROM bug_ticket) as conv_id,
    (SELECT created_at FROM bug_ticket) as base_time,
    m.direction,
    m.content,
    m.sender_name,
    m.msg_order
  FROM (
    VALUES
      ('inbound'::message_direction, 'Prezada equipe de suporte,

Estamos enfrentando um problema crítico ao tentar gerar o relatório mensal de atividades. O sistema retorna erro 500 consistentemente.

Detalhes do erro:
- Ocorre apenas para relatórios do mês atual
- Começou após a última atualização
- ID do relatório: REP-2025-04-001

Precisamos resolver isso com urgência pois o relatório é necessário para nossa auditoria.

Atenciosamente,
Patricia Santos', 'Patricia Santos', 1),
      ('outbound'::message_direction, 'Olá Patricia,

Obrigado por reportar o problema e fornecer informações detalhadas. Já identifiquei o erro em nossos logs e nossa equipe está trabalhando na correção.

Como solução temporária, você pode gerar o relatório usando a API REST diretamente. Vou te enviar as instruções em seguida.

Estamos priorizando a correção e deve ser resolvido nas próximas 2 horas.

Atenciosamente,
Lucas', 'Lucas Oliveira', 2)
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
FROM bug_messages;

-- Add example email ticket for billing inquiry
WITH billing_ticket AS (
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
    'Solicitação de mudança no plano de pagamento',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'amanda.costa@email.com'
    AND d.name = 'Faturamento'
    AND t.name = 'Atendimento Padrão'
  RETURNING id, created_at
),
billing_messages AS (
  SELECT 
    (SELECT id FROM billing_ticket) as conv_id,
    (SELECT created_at FROM billing_ticket) as base_time,
    m.direction,
    m.content,
    m.sender_name,
    m.msg_order
  FROM (
    VALUES
      ('inbound'::message_direction, 'Prezados,

Gostaria de solicitar a mudança da data de vencimento do nosso plano para o dia 20 de cada mês. Atualmente está no dia 5 e precisamos ajustar ao nosso fluxo de caixa.

Também gostaria de receber informações sobre a possibilidade de mudar a forma de pagamento para cartão de crédito corporativo.

Atenciosamente,
Amanda Costa', 'Amanda Costa', 1),
      ('outbound'::message_direction, 'Olá Amanda,

Claro, podemos ajudar com essas alterações!

Para a mudança da data de vencimento, posso fazer isso imediatamente. A alteração será válida já para a próxima fatura.

Quanto ao cartão corporativo, vou te enviar um link seguro para cadastro dos dados. Após o cadastro, a mudança é automática.

Preciso apenas que você confirme se podemos prosseguir com essas alterações.

Atenciosamente,
Beatriz', 'Beatriz Santos', 2)
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
FROM billing_messages;