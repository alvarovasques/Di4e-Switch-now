import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Users, 
  Building2,
  Loader2,
  Filter,
  ArrowRight,
  MessageSquare,
  BarChart2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

export default function AIAgentList() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    department: 'all',
    team: 'all'
  });
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [teams, setTeams] = useState<{id: string, name: string}[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchDepartments();
    fetchTeams();
  }, []);

  async function fetchAgents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          department:departments(name),
          team:teams(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      console.error('Error fetching AI agents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
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
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }

  async function handleDelete(agentId: string) {
    try {
      setLoading(true);
      
      // First delete related records
      await supabase
        .from('ai_agent_settings')
        .delete()
        .eq('agent_id', agentId);
        
      await supabase
        .from('agent_knowledge_bases')
        .delete()
        .eq('agent_id', agentId);
      
      // Then delete the agent
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
      
      setAgents(agents.filter(agent => agent.id !== agentId));
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Error deleting agent:', err);
      alert('Erro ao excluir o agente');
    } finally {
      setLoading(false);
    }
  }

  const filteredAgents = agents.filter(agent => {
    // Search filter
    if (searchTerm && !agent.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !agent.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !agent.is_active) return false;
      if (filters.status === 'inactive' && agent.is_active) return false;
    }
    
    // Type filter
    if (filters.type !== 'all') {
      if (filters.type === 'global' && !agent.is_global) return false;
      if (filters.type === 'specific' && agent.is_global) return false;
    }
    
    // Department filter
    if (filters.department !== 'all' && agent.department_id !== filters.department) {
      return false;
    }
    
    // Team filter
    if (filters.team !== 'all' && agent.team_id !== filters.team) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Agentes IA</h1>
          <p className="text-gray-600">Gerencie seus assistentes virtuais de IA</p>
        </div>
        
        <button
          onClick={() => navigate('/settings/ai-agents/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Agente IA
        </button>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar agentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
            {(filters.status !== 'all' || filters.type !== 'all' || 
              filters.department !== 'all' || filters.team !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-primary"></span>
            )}
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos</option>
                <option value="global">Global</option>
                <option value="specific">Específico</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select
                value={filters.team}
                onChange={(e) => setFilters({...filters, team: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">Nenhum agente encontrado</h2>
          <p className="text-gray-500 mb-6">
            {searchTerm || filters.status !== 'all' || filters.type !== 'all' || 
             filters.department !== 'all' || filters.team !== 'all' 
              ? 'Nenhum agente corresponde aos filtros selecionados'
              : 'Crie seu primeiro agente IA para automatizar o atendimento'}
          </p>
          <button
            onClick={() => navigate('/settings/ai-agents/new')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5 inline-block mr-2" />
            Criar Agente IA
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div 
              key={agent.id} 
              className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6 border-b">
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.is_global ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                            Global
                          </span>
                        ) : (
                          <>
                            {agent.department && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {agent.department.name}
                              </span>
                            )}
                            {agent.team && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {agent.team.name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => navigate(`/settings/ai-agents/${agent.id}`)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="Configurar"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(agent.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                  {agent.description}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-800">
                      {agent.performance.conversations_handled}
                    </div>
                    <div className="text-xs text-gray-500">Conversas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-800">
                      {agent.performance.success_rate}%
                    </div>
                    <div className="text-xs text-gray-500">Taxa de Sucesso</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                    agent.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {agent.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Inativo
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => navigate(`/settings/ai-agents/${agent.id}`)}
                    className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
}