import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  Plus, 
  Pencil, 
  Trash2, 
  Clock, 
  Check, 
  X, 
  Copy, 
  ExternalLink,
  Zap,
  Globe,
  Key,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_key: string;
  description?: string;
  last_triggered?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface WebhookEvent {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'received' | 'processed' | 'failed';
  result_data?: Record<string, any>;
  created_at: string;
  processed_at?: string;
}

export default function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState<string | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [testPayload, setTestPayload] = useState('{\n  "message": "Test webhook payload",\n  "timestamp": "2025-04-30T12:00:00Z"\n}');
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    events: [] as string[],
    is_active: true
  });

  const availableEvents = [
    'conversation.created',
    'conversation.updated',
    'conversation.closed',
    'message.created',
    'customer.created',
    'customer.updated',
    'ticket.created',
    'ticket.updated',
    'ticket.closed',
    'ai.conversation.started',
    'ai.conversation.completed',
    'ai.handoff.requested',
    'ai.handoff.completed',
    'ai.feedback.received',
    'ai.knowledge.used'
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWebhookEvents(webhookId: string) {
    try {
      setEventsLoading(true);
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setWebhookEvents(data || []);
    } catch (err) {
      console.error('Error fetching webhook events:', err);
    } finally {
      setEventsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingWebhook) {
        const { error } = await supabase
          .from('webhooks')
          .update({
            name: formData.name,
            url: formData.url,
            description: formData.description,
            events: formData.events,
            is_active: formData.is_active
          })
          .eq('id', editingWebhook.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('webhooks')
          .insert([{ 
            ...formData, 
            secret_key: crypto.randomUUID() 
          }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingWebhook(null);
      setFormData({
        name: '',
        url: '',
        description: '',
        events: [],
        is_active: true
      });
      fetchWebhooks();
    } catch (err) {
      console.error('Error saving webhook:', err);
      alert('Erro ao salvar webhook');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(webhookId: string) {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
      setWebhooks(webhooks.filter(webhook => webhook.id !== webhookId));
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Error deleting webhook:', err);
      alert('Erro ao excluir webhook');
    }
  }

  async function handleTestWebhook() {
    if (!showTestModal) return;
    
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const webhook = webhooks.find(w => w.id === showTestModal);
      if (!webhook) throw new Error('Webhook não encontrado');
      
      let payload;
      try {
        payload = JSON.parse(testPayload);
      } catch (e) {
        throw new Error('Payload JSON inválido');
      }
      
      // Create webhook event record
      const { error } = await supabase
        .from('webhook_events')
        .insert([{
          webhook_id: webhook.id,
          event_type: webhook.events[0] || 'test.event',
          payload,
          status: 'received'
        }]);
        
      if (error) throw error;
      
      setTestResult({
        success: true,
        message: 'Evento de teste enviado com sucesso! Verifique o log de eventos para acompanhar o processamento.'
      });
      
      // Refresh webhooks to update last_triggered
      setTimeout(() => {
        fetchWebhooks();
      }, 1000);
    } catch (err) {
      console.error('Error testing webhook:', err);
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Erro ao testar webhook'
      });
    } finally {
      setTestLoading(false);
    }
  }

  const copySecretKey = async (secretKey: string) => {
    await navigator.clipboard.writeText(secretKey);
    setCopiedId(secretKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-700';
      case 'processed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredWebhooks = webhooks.filter(webhook => 
    webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webhook.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (webhook.description && webhook.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Webhooks</h2>
            <p className="text-sm text-gray-500">
              Configure webhooks para integrar com sistemas externos
            </p>
          </div>
          <button
            onClick={() => {
              setEditingWebhook(null);
              setFormData({
                name: '',
                url: '',
                description: '',
                events: [],
                is_active: true
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus className="w-5 h-5" />
            Novo Webhook
          </button>
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar webhooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredWebhooks.length === 0 ? (
          <div className="text-center py-12">
            <Webhook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum webhook encontrado</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? `Nenhum webhook corresponde a "${searchTerm}"`
                : 'Crie seu primeiro webhook para integrar com sistemas externos'}
            </p>
            <button
              onClick={() => {
                setEditingWebhook(null);
                setFormData({
                  name: '',
                  url: '',
                  description: '',
                  events: [],
                  is_active: true
                });
                setShowModal(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <Plus className="w-5 h-5 inline-block mr-2" />
              Criar Webhook
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWebhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{webhook.name}</h3>
                      {webhook.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Inativo
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">URL:</span> {webhook.url}
                    </p>
                    
                    {webhook.description && (
                      <p className="text-sm text-gray-600">{webhook.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                        >
                          {event}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Último acionamento: {formatDate(webhook.last_triggered)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhook.secret_key}
                        className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded border"
                      />
                      <button
                        onClick={() => copySecretKey(webhook.secret_key)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Copiar chave secreta"
                      >
                        {copiedId === webhook.secret_key ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowEventsModal(webhook.id);
                        fetchWebhookEvents(webhook.id);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-900"
                      title="Ver eventos"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setShowTestModal(webhook.id);
                        setTestResult(null);
                        setTestPayload('{\n  "message": "Test webhook payload",\n  "timestamp": "2025-04-30T12:00:00Z"\n}');
                      }}
                      className="p-2 text-green-600 hover:text-green-900"
                      title="Testar webhook"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingWebhook(webhook);
                        setFormData({
                          name: webhook.name,
                          url: webhook.url,
                          description: webhook.description || '',
                          events: webhook.events,
                          is_active: webhook.is_active
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900"
                      title="Editar webhook"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(webhook.id)}
                      className="p-2 text-red-600 hover:text-red-900"
                      title="Excluir webhook"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Webhook
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Integração CRM"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Webhook
                </label>
                <input 
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://exemplo.com/webhook"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL que receberá as requisições POST com os dados dos eventos
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  placeholder="Descreva o propósito deste webhook"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eventos
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Selecione os eventos que acionarão este webhook
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                  {availableEvents.map((event) => (
                    <div key={event} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`event-${event}`}
                        checked={formData.events.includes(event)}
                        onChange={(e) => {
                          const newEvents = e.target.checked
                            ? [...formData.events, event]
                            : formData.events.filter((e) => e !== event);
                          setFormData({ ...formData, events: newEvents });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`event-${event}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {event}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Webhook ativo
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingWebhook(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Events Modal */}
      {showEventsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Eventos do Webhook: {webhooks.find(w => w.id === showEventsModal)?.name}
              </h2>
              <button
                onClick={() => setShowEventsModal(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Histórico dos últimos eventos enviados para este webhook
                </p>
                <button
                  onClick={() => fetchWebhookEvents(showEventsModal)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : webhookEvents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhum evento registrado para este webhook</p>
                  <button
                    onClick={() => {
                      setShowEventsModal(null);
                      setShowTestModal(showEventsModal);
                      setTestResult(null);
                      setTestPayload('{\n  "message": "Test webhook payload",\n  "timestamp": "2025-04-30T12:00:00Z"\n}');
                    }}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Enviar evento de teste
                  </button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Evento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {webhookEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{event.event_type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(event.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.processed_at ? formatDate(event.processed_at) : 'Pendente'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowEventsModal(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Webhook Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Testar Webhook: {webhooks.find(w => w.id === showTestModal)?.name}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payload de Teste (JSON)
                </label>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows={8}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Este payload será enviado como parte do evento de webhook
                </p>
              </div>
              
              {testResult && (
                <div className={`p-4 rounded-lg ${
                  testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <Check className={`w-5 h-5 text-green-500 mt-0.5`} />
                    ) : (
                      <AlertCircle className={`w-5 h-5 text-red-500 mt-0.5`} />
                    )}
                    <div>
                      <h4 className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {testResult.success ? 'Teste enviado com sucesso' : 'Erro no teste'}
                      </h4>
                      <p className={`text-sm mt-1 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTestModal(null)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
              >
                {testLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Enviar Teste</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este webhook? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => showDeleteModal && handleDelete(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Webhook Documentation */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Documentação de Webhooks</h3>
            <p className="text-sm text-gray-600 mt-1">
              Os webhooks permitem que seu sistema receba notificações em tempo real quando eventos ocorrem na plataforma.
              Cada webhook envia uma requisição HTTP POST para a URL configurada com dados do evento.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <a 
                href="https://docs.example.com/webhooks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Ver documentação completa
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}