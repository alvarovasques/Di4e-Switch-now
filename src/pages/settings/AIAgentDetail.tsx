import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  ArrowLeft, 
  Settings, 
  MessageSquare, 
  Book, 
  BarChart2, 
  Zap,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Trash2,
  AlertCircle,
  Code
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AIAgentSettings from '../../components/AIAgentSettings';
import AIAgentAdvancedSettings from '../../components/AIAgentAdvancedSettings';
import AIAgentPromptTemplates from '../../components/AIAgentPromptTemplates';

interface AIAgent {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  is_active: boolean;
  is_global: boolean;
  department_id: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  settings: any;
  performance: {
    conversations_handled: number;
    success_rate: number;
    avg_resolution_time: string;
    handoff_rate: number;
  };
  department?: {
    name: string;
  };
  team?: {
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

export default function AIAgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'settings' | 'advanced' | 'prompts' | 'performance'>('info');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_global: false,
    department_id: '',
    team_id: ''
  });

  useEffect(() => {
    if (id) {
      fetchAgent(id);
      fetchDepartments();
      fetchTeams();
    }
  }, [id]);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        is_active: agent.is_active,
        is_global: agent.is_global,
        department_id: agent.department_id || '',
        team_id: agent.team_id || ''
      });
    }
  }, [agent]);

  async function fetchAgent(agentId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          department:departments(name),
          team:teams(name)
        `)
        .eq('id', agentId)
        .single();

      if (error) throw error;
      setAgent(data);
    } catch (err) {
      console.error('Error fetching AI agent:', err);
      setError('Erro ao carregar dados do agente');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          is_global: formData.is_global,
          department_id: formData.is_global ? null : formData.department_id || null,
          team_id: formData.is_global ? null : formData.team_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Agente atualizado com sucesso!');
      fetchAgent(id!);
    } catch (err) {
      console.error('Error updating agent:', err);
      setError('Erro ao atualizar o agente');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setLoading(true);
      
      // First delete related records
      await supabase
        .from('ai_agent_settings')
        .delete()
        .eq('agent_id', id);
        
      await supabase
        .from('agent_knowledge_bases')
        .delete()
        .eq('agent_id', id);
      
      // Then delete the agent
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      navigate('/settings/ai-agents');
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError('Erro ao excluir o agente');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Agente não encontrado</span>
        </div>
        
        <button 
          onClick={() => navigate('/settings/ai-agents')}
          className="mt-4 flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a lista de agentes
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/settings/ai-agents')}
          className="mb-4 flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a lista</span>
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{agent.name}</h1>
              <p className="text-gray-600">{agent.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              agent.is_active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {agent.is_active ? 'Ativo' : 'Inativo'}
            </span>
            
            <span className={`px-2 py-1 rounded-full text-xs ${
              agent.is_global 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {agent.is_global ? 'Global' : 'Específico'}
            </span>
            
            {!agent.is_global && agent.department && (
              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {agent.department.name}
              </span>
            )}
            
            {!agent.is_global && agent.team && (
              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {agent.team.name}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-md flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex overflow-x-auto">
          <button 
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'info' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Bot className="w-4 h-4" />
              Informações Básicas
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'settings' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              Configurações
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'prompts' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Code className="w-4 h-4" />
              Templates de Prompts
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'advanced' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Configurações Avançadas
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'performance' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <BarChart2 className="w-4 h-4" />
              Performance
            </span>
          </button>
        </div>
      </div>
      
      {/* Content */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Informações do Agente</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Agente
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.is_active}
                      onChange={() => setFormData({...formData, is_active: true})}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!formData.is_active}
                      onChange={() => setFormData({...formData, is_active: false})}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>Inativo</span>
                  </label>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="is_global"
                    checked={formData.is_global}
                    onChange={(e) => setFormData({...formData, is_global: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_global" className="ml-2 block text-sm text-gray-700">
                    Agente global (atende a todos os departamentos e times)
                  </label>
                </div>
              </div>
              
              {!formData.is_global && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecione um departamento</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <select
                      value={formData.team_id}
                      onChange={(e) => setFormData({...formData, team_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecione um time</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Agente
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <AIAgentSettings agentId={id!} onSave={() => setSuccess('Configurações salvas com sucesso!')} />
      )}
      
      {activeTab === 'prompts' && (
        <AIAgentPromptTemplates agentId={id!} onSave={() => setSuccess('Templates salvos com sucesso!')} />
      )}
      
      {activeTab === 'advanced' && (
        <AIAgentAdvancedSettings agentId={id!} onSave={() => setSuccess('Configurações avançadas salvas com sucesso!')} />
      )}
      
      {activeTab === 'performance' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Métricas de Performance</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Conversas Atendidas</p>
                  <p className="text-2xl font-semibold">{agent.performance.conversations_handled}</p>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xs text-gray-500">Taxa</div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Taxa de Sucesso</p>
                  <p className="text-2xl font-semibold">{agent.performance.success_rate}%</p>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-xs text-gray-500">Taxa</div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Taxa de Handoff</p>
                  <p className="text-2xl font-semibold">{agent.performance.handoff_rate}%</p>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-xs text-gray-500">Média</div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Tempo de Resolução</p>
                  <p className="text-2xl font-semibold">{agent.performance.avg_resolution_time}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-start gap-3">
                <BarChart2 className="w-6 h-6 text-gray-400" />
                <div>
                  <h3 className="font-medium">Análise Detalhada</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Para visualizar métricas detalhadas de performance, acesse a página de Analytics IA.
                  </p>
                  <button
                    onClick={() => navigate('/ai-analytics')}
                    className="mt-2 text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <BarChart2 className="w-4 h-4" />
                    Ver Analytics IA
                  </button>
                </div>
              </div>
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
              Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing imports
import { Clock } from 'lucide-react';