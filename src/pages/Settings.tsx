import React, { useState, useEffect } from 'react';
import { 
  Cog, 
  Users, 
  Clock, 
  Bell, 
  BookOpen, 
  MessageSquare, 
  Webhook,
  Key,
  Shield,
  AlertTriangle,
  Bot,
  Sparkles,
  ActivitySquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BusinessRules from './settings/BusinessRules';
import Teams from './settings/Teams';
import SLA from './settings/SLA';
import Channels from './settings/Channels';
import Webhooks from './settings/Webhooks';
import AIAgents from './settings/AIAgents';
import AIWebhooks from './settings/AIWebhooks';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  notification_preferences: {
    email_notifications: boolean;
    desktop_notifications: boolean;
    queue_alerts: boolean;
    sla_warnings: boolean;
    team_mentions: boolean;
    transfer_requests: boolean;
  };
}

const TABS = [
  {
    id: 'general',
    label: 'Geral',
    icon: Cog,
  },
  {
    id: 'channels',
    label: 'Canais',
    icon: MessageSquare,
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: Webhook,
  },
  {
    id: 'business-rules',
    label: 'Regras de Negócio',
    icon: BookOpen,
  },
  {
    id: 'teams',
    label: 'Times',
    icon: Users,
  },
  {
    id: 'ai-agents',
    label: 'Agentes IA',
    icon: Bot,
  },
  {
    id: 'ai-webhooks',
    label: 'Eventos de IA',
    icon: ActivitySquare,
  },
  {
    id: 'sla',
    label: 'SLA',
    icon: Clock,
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: Bell,
  },
];

function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notification_preferences: {
      email_notifications: true,
      desktop_notifications: true,
      queue_alerts: true,
      sla_warnings: true,
      team_mentions: true,
      transfer_requests: true,
    },
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('agents')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setFormData(prev => ({
            ...prev,
            name: profile.name,
            email: profile.email,
            notification_preferences: profile.notification_preferences,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!userProfile) return;

      const { error } = await supabase
        .from('agents')
        .update({
          name: formData.name,
          notification_preferences: formData.notification_preferences,
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      setSuccess('Perfil atualizado com sucesso!');
      fetchUserProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      setSuccess('Senha atualizada com sucesso!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-6">Informações do Perfil</h2>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
                    {success}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Função
                    </label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {userProfile?.role}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </form>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-medium">Segurança</h2>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Alterar Senha
                  </button>
                </form>
              </div>

              {/* Notification Preferences */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-medium">Preferências de Notificação</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Notificações por Email</h3>
                      <p className="text-sm text-gray-500">Receba atualizações importantes por email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_preferences.email_notifications}
                        onChange={(e) => setFormData({
                          ...formData,
                          notification_preferences: {
                            ...formData.notification_preferences,
                            email_notifications: e.target.checked,
                          },
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Notificações Desktop</h3>
                      <p className="text-sm text-gray-500">Receba notificações no navegador</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_preferences.desktop_notifications}
                        onChange={(e) => setFormData({
                          ...formData,
                          notification_preferences: {
                            ...formData.notification_preferences,
                            desktop_notifications: e.target.checked,
                          },
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Alertas de Fila</h3>
                      <p className="text-sm text-gray-500">Notificações sobre o status da fila</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_preferences.queue_alerts}
                        onChange={(e) => setFormData({
                          ...formData,
                          notification_preferences: {
                            ...formData.notification_preferences,
                            queue_alerts: e.target.checked,
                          },
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Avisos de SLA</h3>
                      <p className="text-sm text-gray-500">Notificações sobre prazos de SLA</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_preferences.sla_warnings}
                        onChange={(e) => setFormData({
                          ...formData,
                          notification_preferences: {
                            ...formData.notification_preferences,
                            sla_warnings: e.target.checked,
                          },
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Menções de Time</h3>
                      <p className="text-sm text-gray-500">Notificações quando seu time for mencionado</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_preferences.team_mentions}
                        onChange={(e) => setFormData({
                          ...formData,
                          notification_preferences: {
                            ...formData.notification_preferences,
                            team_mentions: e.target.checked,
                          },
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Solicitações de Transferência</h3>
                      <p className="text-sm text-gray-500">Notificações sobre transferências de atendimento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_preferences.transfer_requests}
                        onChange={(e) => setFormData({
                          ...formData,
                          notification_preferences: {
                            ...formData.notification_preferences,
                            transfer_requests: e.target.checked,
                          },
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'channels' && <Channels />}
          {activeTab === 'webhooks' && <Webhooks />}
          {activeTab === 'business-rules' && <BusinessRules />}
          {activeTab === 'teams' && <Teams />}
          {activeTab === 'ai-agents' && <AIAgents />}
          {activeTab === 'ai-webhooks' && <AIWebhooks />}
          {activeTab === 'sla' && <SLA />}
        </div>
      </div>
    </div>
  );
}

export default Settings;