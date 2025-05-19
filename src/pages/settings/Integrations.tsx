import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Check, 
  X, 
  Settings, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Search,
  Lock,
  Key,
  Globe,
  MessageSquare,
  Calendar,
  Mail,
  Database,
  FileText,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'calendar' | 'chat' | 'analytics' | 'storage' | 'other';
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'crm' as Integration['type'],
    provider: '',
    config: {
      api_key: '',
      api_url: '',
      username: '',
      password: ''
    }
  });

  // Lista de integrações disponíveis
  const availableIntegrations = [
    { provider: 'Salesforce', type: 'crm', logo: '🔵' },
    { provider: 'HubSpot', type: 'crm', logo: '🟠' },
    { provider: 'Zendesk', type: 'crm', logo: '🟢' },
    { provider: 'Gmail', type: 'email', logo: '📧' },
    { provider: 'Outlook', type: 'email', logo: '📨' },
    { provider: 'Google Calendar', type: 'calendar', logo: '📅' },
    { provider: 'Slack', type: 'chat', logo: '💬' },
    { provider: 'Microsoft Teams', type: 'chat', logo: '👥' },
    { provider: 'Google Analytics', type: 'analytics', logo: '📊' },
    { provider: 'AWS S3', type: 'storage', logo: '☁️' },
    { provider: 'Dropbox', type: 'storage', logo: '📦' },
    { provider: 'Zapier', type: 'other', logo: '⚡' },
    { provider: 'n8n', type: 'other', logo: '🔄' },
    { provider: 'Make (Integromat)', type: 'other', logo: '🔗' }
  ];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    setLoading(true);
    
    try {
      // Em uma implementação real, isso buscaria do banco de dados
      // Para este exemplo, vamos gerar dados fictícios
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dados fictícios
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Salesforce CRM',
          type: 'crm',
          provider: 'Salesforce',
          status: 'connected',
          config: {
            api_key: '********',
            api_url: 'https://api.salesforce.com/v1',
            instance_id: 'sf-123456'
          },
          last_sync: new Date().toISOString(),
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Gmail Integration',
          type: 'email',
          provider: 'Gmail',
          status: 'connected',
          config: {
            oauth_token: '********',
            refresh_token: '********',
            email: 'support@company.com'
          },
          last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Slack Notifications',
          type: 'chat',
          provider: 'Slack',
          status: 'error',
          config: {
            webhook_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
            channel: '#support'
          },
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setIntegrations(mockIntegrations);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('Falha ao carregar integrações');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddIntegration(e: React.FormEvent) {
    e.preventDefault();
    setConfigLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Em uma implementação real, isso enviaria para o backend
      // Para este exemplo, vamos simular
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newIntegration: Integration = {
        id: Math.random().toString(36).substring(7),
        name: formData.name,
        type: formData.type,
        provider: formData.provider,
        status: 'connected',
        config: formData.config,
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setIntegrations([...integrations, newIntegration]);
      setShowAddModal(false);
      setFormData({
        name: '',
        type: 'crm',
        provider: '',
        config: {
          api_key: '',
          api_url: '',
          username: '',
          password: ''
        }
      });
      
      setSuccess('Integração adicionada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding integration:', err);
      setError('Falha ao adicionar integração');
    } finally {
      setConfigLoading(false);
    }
  }

  async function handleUpdateIntegration(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIntegration) return;
    
    setConfigLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Em uma implementação real, isso enviaria para o backend
      // Para este exemplo, vamos simular
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedIntegrations = integrations.map(integration => 
        integration.id === selectedIntegration.id 
          ? { 
              ...integration, 
              name: formData.name,
              config: formData.config,
              updated_at: new Date().toISOString()
            } 
          : integration
      );
      
      setIntegrations(updatedIntegrations);
      setShowConfigModal(null);
      setSelectedIntegration(null);
      
      setSuccess('Configuração atualizada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating integration:', err);
      setError('Falha ao atualizar configuração');
    } finally {
      setConfigLoading(false);
    }
  }

  async function handleDisconnect(integrationId: string) {
    try {
      // Em uma implementação real, isso enviaria para o backend
      // Para este exemplo, vamos simular
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedIntegrations = integrations.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              status: 'disconnected',
              updated_at: new Date().toISOString()
            } 
          : integration
      );
      
      setIntegrations(updatedIntegrations);
      
      setSuccess('Integração desconectada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error disconnecting integration:', err);
      setError('Falha ao desconectar integração');
    }
  }

  async function handleReconnect(integrationId: string) {
    try {
      // Em uma implementação real, isso enviaria para o backend
      // Para este exemplo, vamos simular
      
      // Simular atraso de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedIntegrations = integrations.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              status: 'connected',
              updated_at: new Date().toISOString(),
              last_sync: new Date().toISOString()
            } 
          : integration
      );
      
      setIntegrations(updatedIntegrations);
      
      setSuccess('Integração reconectada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error reconnecting integration:', err);
      setError('Falha ao reconectar integração');
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'crm':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'email':
        return <Mail className="w-5 h-5 text-red-600" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-green-600" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'analytics':
        return <BarChart className="w-5 h-5 text-orange-600" />;
      case 'storage':
        return <Database className="w-5 h-5 text-indigo-600" />;
      default:
        return <Zap className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Conectado
          </span>
        );
      case 'disconnected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
            <X className="w-3 h-3" />
            Desconectado
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Erro
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} minutos atrás`;
    if (diffHours < 24) return `${diffHours} horas atrás`;
    if (diffDays < 30) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString();
  };

  const filteredIntegrations = integrations.filter(integration => 
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Integrações</h2>
            <p className="text-sm text-gray-500">
              Conecte o sistema com outras ferramentas e serviços
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus className="w-5 h-5" />
            Nova Integração
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar integrações..."
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
        ) : filteredIntegrations.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma integração encontrada</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? `Nenhuma integração corresponde a "${searchTerm}"`
                : 'Conecte seu sistema com outras ferramentas para ampliar suas funcionalidades'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <Plus className="w-5 h-5 inline-block mr-2" />
              Adicionar Integração
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {getIntegrationIcon(integration.type)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{integration.name}</h3>
                        {getStatusBadge(integration.status)}
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-1">
                        Provedor: {integration.provider}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Última sincronização: {formatDate(integration.last_sync)}
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Criado em: {new Date(integration.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedIntegration(integration);
                        setFormData({
                          name: integration.name,
                          type: integration.type,
                          provider: integration.provider,
                          config: integration.config
                        });
                        setShowConfigModal(integration.id);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                      title="Configurar"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    
                    {integration.status === 'connected' ? (
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-gray-100"
                        title="Desconectar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReconnect(integration.id)}
                        className="p-2 text-green-600 hover:text-green-900 rounded-lg hover:bg-gray-100"
                        title="Reconectar"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Adicionar Nova Integração</h2>
            </div>
            
            <form onSubmit={handleAddIntegration} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Integração
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Salesforce CRM"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provedor
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Selecione um provedor</option>
                  {availableIntegrations.map((integration) => (
                    <option key={integration.provider} value={integration.provider}>
                      {integration.logo} {integration.provider}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as Integration['type']})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="crm">CRM</option>
                  <option value="email">Email</option>
                  <option value="calendar">Calendário</option>
                  <option value="chat">Chat</option>
                  <option value="analytics">Analytics</option>
                  <option value="storage">Armazenamento</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Configuração</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chave de API
                    </label>
                    <input 
                      type="password"
                      value={formData.config.api_key}
                      onChange={(e) => setFormData({
                        ...formData, 
                        config: {...formData.config, api_key: e.target.value}
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Insira sua chave de API"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL da API
                    </label>
                    <input 
                      type="text"
                      value={formData.config.api_url}
                      onChange={(e) => setFormData({
                        ...formData, 
                        config: {...formData.config, api_url: e.target.value}
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://api.exemplo.com/v1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuário
                      </label>
                      <input 
                        type="text"
                        value={formData.config.username}
                        onChange={(e) => setFormData({
                          ...formData, 
                          config: {...formData.config, username: e.target.value}
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Usuário (se necessário)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha
                      </label>
                      <input 
                        type="password"
                        value={formData.config.password}
                        onChange={(e) => setFormData({
                          ...formData, 
                          config: {...formData.config, password: e.target.value}
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Senha (se necessária)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700">
                      As credenciais de API são armazenadas de forma segura e criptografada. Nunca compartilhamos suas chaves com terceiros.
                    </p>
                    <a 
                      href="https://docs.example.com/integrations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Saiba mais sobre nossas integrações
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={configLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                >
                  {configLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Conectar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Integration Modal */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Configurar Integração: {selectedIntegration.name}</h2>
            </div>
            
            <form onSubmit={handleUpdateIntegration} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Integração
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provedor
                  </label>
                  <input 
                    type="text"
                    value={formData.provider}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <input 
                    type="text"
                    value={formData.type}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Configuração</h3>
                
                <div className="space-y-4">
                  {Object.entries(formData.config).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <input 
                        type={key.includes('key') || key.includes('token') || key.includes('password') ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => setFormData({
                          ...formData, 
                          config: {...formData.config, [key]: e.target.value}
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => handleDisconnect(selectedIntegration.id)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Desconectar
                </button>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfigModal(null);
                      setSelectedIntegration(null);
                    }}
                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={configLoading}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                  >
                    {configLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Salvar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Available Integrations Section */}
      <div className="p-6 border-t">
        <h3 className="text-lg font-medium mb-4">Integrações Disponíveis</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableIntegrations.map((integration) => (
            <div 
              key={integration.provider}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                setFormData({
                  name: `${integration.provider} Integration`,
                  type: integration.type as Integration['type'],
                  provider: integration.provider,
                  config: {
                    api_key: '',
                    api_url: '',
                    username: '',
                    password: ''
                  }
                });
                setShowAddModal(true);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">{integration.logo}</div>
                <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {integration.type}
                </div>
              </div>
              <h4 className="font-medium">{integration.provider}</h4>
              <p className="text-xs text-gray-500 mt-1">
                Clique para configurar
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add missing imports
import { Clock, BarChart } from 'lucide-react';