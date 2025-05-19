import React, { useState } from 'react';
import { Book, Code, Copy, Check, Globe, Key, Lock, ChevronRight, ChevronDown, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Endpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: Record<string, string>;
  example?: string;
}

interface APISection {
  title: string;
  description: string;
  endpoints: Endpoint[];
}

export default function API() {
  const [activeSection, setActiveSection] = useState<string | null>('conversations');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Função para obter a chave de API do usuário
  async function fetchApiKey() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Aqui você obteria a chave de API do usuário a partir de alguma tabela
      // Por enquanto, estamos gerando uma fictícia
      const mockApiKey = `api_${Math.random().toString(36).substring(2, 15)}`;
      setApiKey(mockApiKey);
    } catch (err) {
      console.error('Erro ao obter chave de API:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  const apiSections: APISection[] = [
    {
      title: "Conversas",
      description: "Endpoints para gerenciar conversas e mensagens",
      endpoints: [
        {
          name: "Listar conversas",
          method: "GET",
          path: "/api/v1/conversations",
          description: "Retorna uma lista paginada de conversas",
          parameters: {
            "status": "Status das conversas (optional): new, active, waiting, resolved, closed",
            "limit": "Número máximo de conversas a retornar (default: 20)",
            "offset": "Índice de início para paginação (default: 0)",
            "customer_id": "Filtrar por ID do cliente (opcional)"
          },
          example: `curl -X GET "https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api/conversations?status=active&limit=10" \\
-H "Authorization: Bearer {API_KEY}" \\
-H "Content-Type: application/json"`
        },
        {
          name: "Criar conversa",
          method: "POST",
          path: "/api/v1/conversations",
          description: "Cria uma nova conversa",
          parameters: {
            "customer_id": "ID do cliente (obrigatório se create_customer=false)",
            "customer_email": "Email do cliente (obrigatório se create_customer=true)",
            "customer_name": "Nome do cliente (opcional)",
            "subject": "Assunto da conversa (opcional)",
            "channel_type": "Tipo de canal: whatsapp, telegram, email, webchat (default: webchat)",
            "status": "Status inicial (default: new)",
            "priority": "Prioridade: low, medium, high, urgent (default: medium)",
            "conversation_type": "Tipo: chat, ticket, ai_chat (default: chat)",
            "create_customer": "Criar cliente se não existir (boolean, default: false)",
            "initial_message": "Mensagem inicial (opcional)",
            "department_id": "ID do departamento (opcional)",
            "team_id": "ID do time (opcional)"
          },
          example: `curl -X POST "https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api/conversations" \\
-H "Authorization: Bearer {API_KEY}" \\
-H "Content-Type: application/json" \\
-d '{
  "customer_email": "cliente@exemplo.com",
  "customer_name": "Cliente Exemplo",
  "subject": "Nova conversa via API",
  "channel_type": "webchat",
  "create_customer": true,
  "initial_message": "Olá, preciso de ajuda"
}'`
        },
        {
          name: "Enviar mensagem",
          method: "POST",
          path: "/api/v1/conversations/{conversation_id}/messages",
          description: "Adiciona uma mensagem a uma conversa existente",
          parameters: {
            "conversation_id": "ID da conversa (obrigatório, no path)",
            "content": "Conteúdo da mensagem (obrigatório)",
            "direction": "Direção: inbound, outbound (default: inbound)",
            "sender_name": "Nome do remetente (opcional)",
            "message_type": "Tipo: text, image, file (default: text)",
            "media_url": "URL do arquivo de mídia (opcional)"
          },
          example: `curl -X POST "https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api/conversations/123e4567-e89b-12d3-a456-426614174000/messages" \\
-H "Authorization: Bearer {API_KEY}" \\
-H "Content-Type: application/json" \\
-d '{
  "content": "Olá, como posso ajudar?",
  "direction": "outbound",
  "sender_name": "Atendente"
}'`
        }
      ]
    },
    {
      title: "Clientes",
      description: "Endpoints para gerenciar clientes e seus dados",
      endpoints: [
        {
          name: "Listar clientes",
          method: "GET",
          path: "/api/v1/customers",
          description: "Retorna uma lista paginada de clientes",
          parameters: {
            "limit": "Número máximo de clientes a retornar (default: 20)",
            "offset": "Índice de início para paginação (default: 0)",
            "email": "Filtrar por email (opcional)",
            "funnel_stage": "Filtrar por etapa do funil (opcional)",
            "status": "Filtrar por status (opcional)"
          },
          example: `curl -X GET "https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api/customers?limit=20&offset=0" \\
-H "Authorization: Bearer {API_KEY}" \\
-H "Content-Type: application/json"`
        },
        {
          name: "Criar cliente",
          method: "POST",
          path: "/api/v1/customers",
          description: "Cria um novo cliente",
          parameters: {
            "name": "Nome do cliente (obrigatório)",
            "email": "Email do cliente (obrigatório)",
            "phone": "Telefone do cliente (opcional)",
            "channel_type": "Canal preferido (opcional)",
            "status": "Status inicial (default: new)",
            "funnel_stage": "Etapa do funil (opcional)",
            "tags": "Array de tags a serem associadas (opcional)"
          },
          example: `curl -X POST "https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api/customers" \\
-H "Authorization: Bearer {API_KEY}" \\
-H "Content-Type: application/json" \\
-d '{
  "name": "Maria Silva",
  "email": "maria.silva@exemplo.com",
  "phone": "+5511999999999",
  "channel_type": "whatsapp",
  "funnel_stage": "lead",
  "tags": ["Novo Cliente", "Prospecção"]
}'`
        }
      ]
    },
    {
      title: "IA",
      description: "Endpoints para interagir com agentes de IA",
      endpoints: [
        {
          name: "Solicitar resposta de IA",
          method: "POST",
          path: "/api/v1/ai/chat",
          description: "Solicita uma resposta de IA para uma mensagem",
          parameters: {
            "message": "Mensagem do usuário (obrigatório)",
            "conversation_id": "ID da conversa existente (opcional)",
            "customer_id": "ID do cliente (obrigatório se não houver conversation_id)",
            "agent_id": "ID do agente de IA (opcional)",
            "context": "Contexto adicional para a IA (opcional)"
          },
          example: `curl -X POST "https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api/ai/chat" \\
-H "Authorization: Bearer {API_KEY}" \\
-H "Content-Type: application/json" \\
-d '{
  "message": "Como faço para resetar minha senha?",
  "customer_id": "123e4567-e89b-12d3-a456-426614174000" 
}'`
        },
        {
          name: "Treinar base de conhecimento",
          method: "POST",
          path: "/api/v1/ai/train",
          description: "Inicia o treinamento de uma base de conhecimento específica",
          parameters: {
            "knowledge_base_id": "ID da base de conhecimento (obrigatório)"
          },
          example: `curl -X POST "https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api/ai/train" \\
-H "Authorization: Bearer {API_KEY}" \\
-H "Content-Type: application/json" \\
-d '{
  "knowledge_base_id": "123e4567-e89b-12d3-a456-426614174000"
}'`
        }
      ]
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">API Reference</h1>
        <p className="text-gray-600">
          Integre o seu sistema com nossa API REST para gerenciar conversas, clientes e mais.
        </p>
      </div>

      {/* API Key Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-full">
            <Key className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium mb-1">Chave de API</h2>
            <p className="text-gray-600 mb-4">
              Esta chave é necessária para autenticar suas solicitações à API.
              Mantenha-a segura e nunca compartilhe publicamente.
            </p>
            
            {apiKey ? (
              <div className="flex items-center gap-2 mb-4">
                <input 
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg font-mono text-sm"
                />
                <button 
                  onClick={() => handleCopy(apiKey, 'apiKey')}
                  className="p-2 border rounded-lg hover:bg-gray-50"
                >
                  {copied === 'apiKey' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={fetchApiKey}
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'Carregando...' : 'Gerar Chave de API'}
              </button>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              <span>
                Use esta chave no cabeçalho de todas as solicitações:
              </span>
            </div>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg overflow-x-auto">
              <code className="text-xs font-mono">
                Authorization: Bearer {apiKey || '{SUA_CHAVE_API}'}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Base URL Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium mb-1">URL Base</h2>
            <p className="text-gray-600 mb-4">
              Todas as solicitações da API devem ser enviadas para esta URL base:
            </p>
            
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm">
                https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api
              </code>
              <button 
                onClick={() => handleCopy('https://rtilsdszeimqfcovtruc.supabase.co/functions/v1/api', 'baseUrl')}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                {copied === 'baseUrl' ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium mb-1">Webhooks</h2>
            <p className="text-gray-600 mb-4">
              Configure webhooks para receber notificações em tempo real de eventos em seu CRM.
            </p>
            
            <div className="border rounded-lg overflow-hidden mb-4">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-medium">Eventos Disponíveis</h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">conversation.created</code>
                    <span className="text-sm text-gray-600">Quando uma nova conversa é criada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">message.created</code>
                    <span className="text-sm text-gray-600">Quando uma nova mensagem é enviada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">customer.created</code>
                    <span className="text-sm text-gray-600">Quando um novo cliente é criado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">ticket.updated</code>
                    <span className="text-sm text-gray-600">Quando um ticket é atualizado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">ai.conversation.completed</code>
                    <span className="text-sm text-gray-600">Quando uma conversa com IA é concluída</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Configure webhooks na página de <a href="/settings/webhooks" className="text-primary hover:underline">Configurações de Webhooks</a>.
            </div>
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Referência de Endpoints</h2>
        </div>

        <div className="divide-y">
          {apiSections.map((section) => (
            <div key={section.title} className="border-b last:border-b-0">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full p-6 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-full">
                    {section.title === "Conversas" ? (
                      <MessageSquare className="w-5 h-5 text-gray-700" />
                    ) : section.title === "Clientes" ? (
                      <Users className="w-5 h-5 text-gray-700" />
                    ) : (
                      <Bot className="w-5 h-5 text-gray-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>
                </div>
                {activeSection === section.title ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {activeSection === section.title && (
                <div className="p-6 pt-0">
                  <div className="space-y-6">
                    {section.endpoints.map((endpoint) => (
                      <div key={endpoint.name} className="border rounded-lg overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                              endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                              endpoint.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {endpoint.method}
                            </span>
                            <code className="font-mono text-sm">{endpoint.path}</code>
                          </div>
                          <button 
                            onClick={() => handleCopy(`${endpoint.method} ${endpoint.path}`, endpoint.path)}
                            className="p-1 rounded hover:bg-gray-200"
                          >
                            {copied === endpoint.path ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                        
                        <div className="p-4">
                          <h4 className="font-medium mb-2">{endpoint.name}</h4>
                          <p className="text-sm text-gray-600 mb-4">{endpoint.description}</p>
                          
                          {endpoint.parameters && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium mb-2">Parâmetros</h5>
                              <div className="border rounded overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {Object.entries(endpoint.parameters).map(([param, desc]) => (
                                      <tr key={param}>
                                        <td className="px-4 py-2 font-mono text-xs">{param}</td>
                                        <td className="px-4 py-2 text-gray-600">{desc}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          
                          {endpoint.example && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Exemplo</h5>
                              <div className="bg-gray-800 text-white rounded-lg p-4 relative">
                                <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                                  {endpoint.example}
                                </pre>
                                <button 
                                  onClick={() => handleCopy(endpoint.example, endpoint.example)}
                                  className="absolute top-2 right-2 p-1 bg-gray-700 rounded hover:bg-gray-600"
                                >
                                  {copied === endpoint.example ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-300" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add missing imports
import { MessageSquare, Users } from 'lucide-react';