import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Copy, Check, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Channel {
  id: string;
  type: 'whatsapp' | 'telegram' | 'email' | 'webchat' | 'custom';
  name: string;
  n8n_webhook_url: string | null;
  is_active: boolean;
  config?: {
    api_key?: string;
    api_secret?: string;
    endpoint_url?: string;
    custom_headers?: Record<string, string>;
  };
}

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'whatsapp' as Channel['type'],
    name: '',
    n8n_webhook_url: '',
    is_active: true,
    config: {
      api_key: '',
      api_secret: '',
      endpoint_url: '',
      custom_headers: {},
    },
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  async function fetchChannels() {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (err) {
      console.error('Error fetching channels:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const channelData = {
        ...formData,
        config: formData.type === 'custom' ? formData.config : null,
      };

      if (editingChannel) {
        const { error } = await supabase
          .from('channels')
          .update(channelData)
          .eq('id', editingChannel.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('channels')
          .insert([channelData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingChannel(null);
      setFormData({
        type: 'whatsapp',
        name: '',
        n8n_webhook_url: '',
        is_active: true,
        config: {
          api_key: '',
          api_secret: '',
          endpoint_url: '',
          custom_headers: {},
        },
      });
      fetchChannels();
    } catch (err) {
      console.error('Error saving channel:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(channelId: string) {
    if (!confirm('Tem certeza que deseja excluir este canal?')) return;

    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
      fetchChannels();
    } catch (err) {
      console.error('Error deleting channel:', err);
    }
  }

  const channelIcons = {
    whatsapp: '💬',
    telegram: '📱',
    email: '📧',
    webchat: '🌐',
    custom: '🔌',
  };

  const getWebhookUrl = (channelId: string) => {
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler?channel=${channelId}`;
  };

  const copyWebhookUrl = async (channelId: string) => {
    const webhookUrl = getWebhookUrl(channelId);
    await navigator.clipboard.writeText(webhookUrl);
    setCopiedId(channelId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Canais de Comunicação</h2>
            <p className="text-sm text-gray-500">
              Gerencie os canais de entrada de mensagens
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Novo Canal
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : channels.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum canal configurado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{channelIcons[channel.type]}</span>
                      <h3 className="font-medium">{channel.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getWebhookUrl(channel.id)}
                        className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded border"
                      />
                      <button
                        onClick={() => copyWebhookUrl(channel.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Copiar URL do webhook"
                      >
                        {copiedId === channel.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>

                    {channel.n8n_webhook_url && (
                      <p className="text-sm text-gray-500">
                        n8n Webhook: {channel.n8n_webhook_url}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      {channel.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Inativo
                        </span>
                      )}
                      
                      {channel.type === 'custom' && (
                        <button
                          onClick={() => {
                            setEditingChannel(channel);
                            setFormData({
                              ...formData,
                              config: channel.config || formData.config,
                            });
                            setShowConfigModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          <Settings className="w-3 h-3" />
                          Configurações
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingChannel(channel);
                        setFormData({
                          type: channel.type,
                          name: channel.name,
                          n8n_webhook_url: channel.n8n_webhook_url || '',
                          is_active: channel.is_active,
                          config: channel.config || formData.config,
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(channel.id)}
                      className="p-2 text-red-600 hover:text-red-900"
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

      {/* Add/Edit Channel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingChannel ? 'Editar Canal' : 'Novo Canal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as Channel['type'],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="email">Email</option>
                  <option value="webchat">WebChat</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {formData.type === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      URL da API
                    </label>
                    <input
                      type="url"
                      value={formData.config.endpoint_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            endpoint_url: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="https://api.exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Chave da API
                    </label>
                    <input
                      type="text"
                      value={formData.config.api_key}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            api_key: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Segredo da API
                    </label>
                    <input
                      type="password"
                      value={formData.config.api_secret}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            api_secret: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL do Webhook (n8n)
                </label>
                <input
                  type="url"
                  value={formData.n8n_webhook_url}
                  onChange={(e) =>
                    setFormData({ ...formData, n8n_webhook_url: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://n8n.example.com/webhook/..."
                />
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
                  Canal ativo
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingChannel(null);
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
    </div>
  );
}