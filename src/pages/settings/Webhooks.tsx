import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Copy, Check, Zap, Clock, ExternalLink, BarChart2, RefreshCw, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_key: string;
  created_at: string;
  description?: string;
  last_triggered?: string;
  metadata?: Record<string, any>;
}

interface WebhookEvent {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'received' | 'processed' | 'failed';
  created_at: string;
  processed_at?: string;
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState<string | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    events: [] as string[],
    is_active: true,
  });

  const availableEvents = [
    'message.created',
    'message.updated',
    'conversation.created',
    'conversation.assigned',
    'conversation.closed',
    'customer.created',
    'customer.updated',
    'ticket.created',
    'ticket.updated',
    'ticket.closed',
    'ai.conversation.completed',
    'ai.handoff.requested',
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('id, name, url, events, is_active, secret_key, created_at, description, last_triggered, metadata')
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
        is_active: true,
      });
      fetchWebhooks();
    } catch (err) {
      console.error('Error saving webhook:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(webhookId: string) {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) return;

    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
      fetchWebhooks();
    } catch (err) {
      console.error('Error deleting webhook:', err);
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

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook || !webhook.events.length) return;
      
      const testEvent = webhook.events[0];
      const testPayload = {
        event_type: testEvent,
        timestamp: new Date().toISOString(),
        data: {
          id: crypto.randomUUID(),
          test: true,
          message: 'This is a test event'
        }
      };
      
      // Create webhook event record
      const { error } = await supabase
        .from('webhook_events')
        .insert([{
          webhook_id: webhookId,
          event_type: testEvent,
          payload: testPayload,
          status: 'received'
        }]);
        
      if (error) throw error;
      
      alert(`Evento de teste "${testEvent}" enviado com sucesso!`);
      fetchWebhooks();
    } catch (err) {
      console.error('Error testing webhook:', err);
      alert('Erro ao testar webhook');
    }
  };

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
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Novo Webhook
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800">O que são webhooks?</h3>
              <p className="mt-1 text-sm text-blue-700">
                Webhooks permitem que seu sistema receba notificações em tempo real quando eventos ocorrem na plataforma.
                Cada webhook envia uma requisição HTTP POST para a URL configurada com dados do evento.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <a 
                  href="https://docs.example.com/webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Documentação
                </a>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum webhook configurado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
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
                      <BarChart2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleTestWebhook(webhook.id)}
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
                          is_active: webhook.is_active,
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900"
                      title="Editar webhook"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Meu Webhook"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://exemplo.com/webhook"
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL que receberá as requisições POST com os dados dos eventos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Eventos do Webhook: {webhooks.find(w => w.id === showEventsModal)?.name}
              </h2>
              <button
                onClick={() => setShowEventsModal(null)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-4">
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
            
            {eventsLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : webhookEvents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum evento registrado para este webhook</p>
                <button
                  onClick={() => handleTestWebhook(showEventsModal)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowEventsModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}