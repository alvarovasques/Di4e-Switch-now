/*
  # Add Rich Conversation Examples

  This migration adds several detailed conversations across different channels and departments:
  
  1. WhatsApp Support Conversation
     - Technical support interaction
     - Multiple messages with problem resolution
     - Shows proper handling and escalation
  
  2. Sales Follow-up via Email
     - Complex sales process
     - Multiple stakeholders
     - Proposal discussion
  
  3. Customer Service Chat
     - Product return request
     - Policy explanation
     - Resolution with compensation
  
  4. Technical Integration Support
     - API integration issues
     - Code examples
     - Technical troubleshooting
*/

-- WhatsApp Technical Support Conversation
WITH whatsapp_conv AS (
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
    'Problema com integração API',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'joao.silva@email.com'
    AND d.name = 'Suporte Avançado'
    AND t.name = 'Suporte Técnico N2'
  RETURNING id, created_at
),
whatsapp_messages AS (
  SELECT 
    (SELECT id FROM whatsapp_conv) as conv_id,
    (SELECT created_at FROM whatsapp_conv) as base_time,
    m.direction,
    m.content,
    m.sender_name,
    m.msg_order
  FROM (
    VALUES
      ('inbound'::message_direction, 'Bom dia! Estamos com um problema urgente na API de pedidos. As requisições estão retornando timeout.', 'João Silva', 1),
      ('outbound'::message_direction, 'Bom dia João! Sou o Rafael do suporte técnico. Vou ajudar você com esse problema. Pode me passar o ID de alguma requisição que falhou?', 'Rafael Santos', 2),
      ('inbound'::message_direction, 'Sim, o ID da última requisição é: REQ-2025-04-17-001', 'João Silva', 3),
      ('outbound'::message_direction, 'Obrigado! Estou verificando nos logs... Identificamos um gargalo no processamento. Vou passar algumas instruções para contornar temporariamente.', 'Rafael Santos', 4),
      ('outbound'::message_direction, 'Por favor, adicione o parâmetro "timeout=30" nas suas requisições. Isso vai aumentar o tempo de espera e resolver o problema imediato.', 'Rafael Santos', 5),
      ('inbound'::message_direction, 'Ok, vou testar aqui.', 'João Silva', 6),
      ('inbound'::message_direction, 'Funcionou! Mas isso é uma solução definitiva?', 'João Silva', 7),
      ('outbound'::message_direction, 'Não, é temporária. Nossa equipe já está trabalhando na otimização do processamento. Deve ser resolvido em definitivo nas próximas 2 horas.', 'Rafael Santos', 8),
      ('outbound'::message_direction, 'Vou manter seu caso priorizado e te atualizo assim que a correção definitiva for implementada.', 'Rafael Santos', 9),
      ('inbound'::message_direction, 'Perfeito, muito obrigado pela ajuda rápida!', 'João Silva', 10),
      ('outbound'::message_direction, 'A correção definitiva já foi implementada. Pode remover o parâmetro timeout e testar novamente.', 'Rafael Santos', 11),
      ('inbound'::message_direction, 'Testei aqui e está funcionando perfeitamente! Tempo de resposta bem melhor agora.', 'João Silva', 12),
      ('outbound'::message_direction, 'Ótimo! Posso considerar seu problema como resolvido?', 'Rafael Santos', 13),
      ('inbound'::message_direction, 'Sim, podem fechar o chamado. Muito obrigado!', 'João Silva', 14)
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
FROM whatsapp_messages;

-- Complex Sales Process via Email
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
    'high'::priority_level,
    'Proposta Comercial - Plano Enterprise',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'roberto.almeida@email.com'
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
      ('inbound'::message_direction, 'Prezados,

Após nossa reunião inicial, gostaria de receber uma proposta detalhada do plano Enterprise para nossa empresa. 

Principais pontos de interesse:
- Integração com nosso ERP SAP
- Suporte 24/7
- SLA diferenciado
- Treinamento para 50 usuários

Atenciosamente,
Roberto Almeida
Diretor de Tecnologia', 'Roberto Almeida', 1),

      ('outbound'::message_direction, 'Prezado Roberto,

Agradeço o contato e o interesse em nossa solução Enterprise. Preparei uma proposta personalizada considerando todos os pontos mencionados.

Destaques da proposta:
1. Integração SAP:
   - Conectores nativos
   - Suporte dedicado para implementação
   - Documentação específica

2. Suporte Premium:
   - Atendimento 24/7
   - Tempo de resposta em até 15 minutos
   - Gerente de conta dedicado

3. SLA Enterprise:
   - 99.99% de disponibilidade
   - Compensação financeira em caso de não cumprimento
   - Monitoramento proativo

4. Programa de Treinamento:
   - 5 sessões de 4 horas
   - Material personalizado
   - Certificação dos usuários

Investimento mensal: R$ 15.000,00
Setup inicial: R$ 25.000,00

Gostaria de agendar uma call para apresentar a proposta em detalhes?

Atenciosamente,
Carolina Silva
Gerente de Contas Enterprise', 'Carolina Silva', 2),

      ('inbound'::message_direction, 'Carolina,

Obrigado pela proposta detalhada. Achei os valores dentro do esperado, mas preciso alinhar alguns pontos:

1. Qual o prazo de implementação?
2. A integração com SAP inclui ambientes de teste?
3. Podemos dividir o setup em 3 parcelas?

Sobre a call, tenho disponibilidade amanhã às 14h.

Atenciosamente,
Roberto', 'Roberto Almeida', 3),

      ('outbound'::message_direction, 'Prezado Roberto,

Fico feliz em esclarecer seus questionamentos:

1. Prazo de implementação: 45 dias úteis
   - 15 dias para setup inicial
   - 20 dias para integrações
   - 10 dias para testes e ajustes

2. Integração SAP:
   - Sim, incluímos ambientes de desenvolvimento, homologação e produção
   - Suporte dedicado em cada ambiente
   - Documentação específica para cada ambiente

3. Condições de pagamento:
   - Setup pode ser parcelado em 3x sem juros
   - Também oferecemos 5% de desconto para pagamento à vista

Confirmo a call para amanhã às 14h. Enviarei o convite em seguida.

Atenciosamente,
Carolina Silva', 'Carolina Silva', 4)
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

-- Customer Service Chat - Product Return
WITH chat_conv AS (
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
    'Solicitação de devolução de produto',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'maria.oliveira@email.com'
    AND d.name = 'Atendimento Padrão'
    AND t.name = 'Atendimento Padrão'
  RETURNING id, created_at
),
chat_messages AS (
  SELECT 
    (SELECT id FROM chat_conv) as conv_id,
    (SELECT created_at FROM chat_conv) as base_time,
    m.direction,
    m.content,
    m.sender_name,
    m.msg_order
  FROM (
    VALUES
      ('inbound'::message_direction, 'Olá, preciso fazer a devolução de um produto que recebi hoje', 'Maria Oliveira', 1),
      ('outbound'::message_direction, 'Olá Maria! Sou a Beatriz do atendimento. Posso te ajudar com a devolução. Qual o número do seu pedido?', 'Beatriz Santos', 2),
      ('inbound'::message_direction, 'O número é #123456', 'Maria Oliveira', 3),
      ('outbound'::message_direction, 'Localizei seu pedido. Pode me dizer o motivo da devolução?', 'Beatriz Santos', 4),
      ('inbound'::message_direction, 'O produto veio com um pequeno defeito na embalagem', 'Maria Oliveira', 5),
      ('outbound'::message_direction, 'Lamento pelo inconveniente. Nesse caso, você tem duas opções:

1. Devolução com reembolso integral
2. Troca por um novo produto + 10% de desconto na próxima compra

Qual opção você prefere?', 'Beatriz Santos', 6),
      ('inbound'::message_direction, 'Prefiro a troca com o desconto', 'Maria Oliveira', 7),
      ('outbound'::message_direction, 'Ótima escolha! Vou gerar a etiqueta de devolução e enviar para seu email. Assim que recebermos o produto, enviaremos o novo em até 2 dias úteis.

O cupom de 10% será enviado após a conclusão da troca.

Posso ajudar com mais alguma coisa?', 'Beatriz Santos', 8),
      ('inbound'::message_direction, 'Não, está tudo certo. Obrigada pela atenção!', 'Maria Oliveira', 9),
      ('outbound'::message_direction, 'Eu que agradeço! A etiqueta já foi enviada para seu email. Qualquer dúvida, estamos à disposição.

Tenha um ótimo dia!', 'Beatriz Santos', 10)
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
FROM chat_messages;

-- Technical Integration Support
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
    'email'::channel_type,
    'open'::ticket_status,
    'high'::priority_level,
    'Dúvida técnica - Integração REST API',
    t.id
  FROM 
    customers c,
    departments d,
    teams t
  WHERE 
    c.email = 'pedro.tech@email.com'
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
      ('inbound'::message_direction, 'Prezados,

Estou tentando implementar a integração com a API REST, mas estou recebendo um erro de autenticação. Já verifiquei a documentação e aparentemente está tudo correto.

Código que estou usando:

```javascript
const response = await fetch("https://api.exemplo.com/v1/data", {
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  }
});
```

Erro recebido: "Invalid authentication credentials"

Podem me ajudar?

Atenciosamente,
Pedro', 'Pedro Santos', 1),

      ('outbound'::message_direction, 'Olá Pedro,

Analisando seu código, identifiquei que você está usando a URL antiga da API. Desde a última atualização, mudamos para:

```javascript
const response = await fetch("https://api.v2.exemplo.com/data", {
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-API-Version": "2.0"
  }
});
```

Principais mudanças:
1. Novo domínio (api.v2.exemplo.com)
2. Caminho simplificado (/data)
3. Header adicional X-API-Version

Pode testar e me confirmar se resolveu?

Abraço,
Lucas', 'Lucas Oliveira', 2),

      ('inbound'::message_direction, 'Lucas,

Muito obrigado! Fiz as alterações e agora está funcionando perfeitamente.

Mais uma dúvida: qual o rate limit da API v2?

Abs,
Pedro', 'Pedro Santos', 3),

      ('outbound'::message_direction, 'Pedro,

Os limites da API v2 são:
- 1000 requisições por minuto por chave de API
- Máximo de 100 registros por requisição
- Timeout de 30 segundos

Para monitorar seu uso, adicione o header X-Rate-Limit-Remaining na requisição.

Recomendo também implementar retry com exponential backoff para lidar com eventuais limitações:

```javascript
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 429) {
        const waitTime = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
    }
  }
};
```

Precisa de mais algum esclarecimento?

Abraço,
Lucas', 'Lucas Oliveira', 4),

      ('inbound'::message_direction, 'Perfeito Lucas! Vou implementar o retry conforme sugerido.

Muito obrigado pela ajuda!

Abs,
Pedro', 'Pedro Santos', 5),

      ('outbound'::message_direction, 'Fico feliz em ajudar! Se precisar de mais alguma coisa, estamos à disposição.

Aproveito para compartilhar nossa documentação atualizada da API v2:
https://docs.exemplo.com/api/v2

Abraço,
Lucas', 'Lucas Oliveira', 6)
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