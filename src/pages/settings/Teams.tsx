import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Team {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamMember {
  team_id: string;
  agent_id: string;
  is_leader: boolean;
  agent: Agent;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    selectedAgents: [] as string[],
    selectedDepartments: [] as string[],
  });

  useEffect(() => {
    fetchTeams();
    fetchDepartments();
    fetchAgents();
  }, []);

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);

      // Fetch team members for each team
      for (const team of data || []) {
        fetchTeamMembers(team.id);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeamMembers(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          agent_id,
          is_leader,
          agent:agents(id, name, email, role)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      setTeamMembers(prev => ({
        ...prev,
        [teamId]: data || [],
      }));
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  }

  async function fetchDepartments() {
    try {
      const { data } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);
      setDepartments(data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }

  async function fetchAgents() {
    try {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('active', true);
      setAgents(data || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingTeam) {
        const { error } = await supabase
          .from('teams')
          .update({
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active,
          })
          .eq('id', editingTeam.id);

        if (error) throw error;

        // Update team members
        await supabase
          .from('team_members')
          .delete()
          .eq('team_id', editingTeam.id);

        if (formData.selectedAgents.length > 0) {
          const teamMembers = formData.selectedAgents.map(agentId => ({
            team_id: editingTeam.id,
            agent_id: agentId,
            is_leader: false,
          }));

          const { error: memberError } = await supabase
            .from('team_members')
            .insert(teamMembers);

          if (memberError) throw memberError;
        }
      } else {
        const { data: team, error } = await supabase
          .from('teams')
          .insert([{
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active,
          }])
          .select()
          .single();

        if (error) throw error;

        if (team && formData.selectedAgents.length > 0) {
          const teamMembers = formData.selectedAgents.map(agentId => ({
            team_id: team.id,
            agent_id: agentId,
            is_leader: false,
          }));

          const { error: memberError } = await supabase
            .from('team_members')
            .insert(teamMembers);

          if (memberError) throw memberError;
        }
      }

      setShowModal(false);
      setEditingTeam(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
        selectedAgents: [],
        selectedDepartments: [],
      });
      fetchTeams();
    } catch (err) {
      console.error('Error saving team:', err);
      setError('Erro ao salvar o time. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(teamId: string) {
    if (!confirm('Tem certeza que deseja excluir este time?')) return;

    try {
      // Check if there are any conversations associated with this team
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id')
        .eq('team_id', teamId)
        .limit(1);

      if (conversationsError) throw conversationsError;

      if (conversations && conversations.length > 0) {
        setError('Não é possível excluir este time porque existem conversas associadas a ele. Por favor, reatribua ou encerre todas as conversas antes de excluir o time.');
        return;
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      
      setError(null);
      fetchTeams();
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Erro ao excluir o time. Por favor, tente novamente.');
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Times</h2>
            <p className="text-sm text-gray-500">
              Gerencie times e seus membros
            </p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Novo Time
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum time configurado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.description}</p>
                    <div className="mt-2">
                      {team.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Inativo
                        </span>
                      )}
                    </div>
                    {teamMembers[team.id] && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Membros:</h4>
                        <div className="flex flex-wrap gap-2">
                          {teamMembers[team.id].map((member) => (
                            <span
                              key={member.agent_id}
                              className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                            >
                              {member.agent.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setError(null);
                        setEditingTeam(team);
                        setFormData({
                          name: team.name,
                          description: team.description || '',
                          is_active: team.is_active,
                          selectedAgents: teamMembers[team.id]?.map(m => m.agent_id) || [],
                          selectedDepartments: [],
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">
              {editingTeam ? 'Editar Time' : 'Novo Time'}
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membros do Time
                </label>
                <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`agent-${agent.id}`}
                        checked={formData.selectedAgents.includes(agent.id)}
                        onChange={(e) => {
                          const newSelectedAgents = e.target.checked
                            ? [...formData.selectedAgents, agent.id]
                            : formData.selectedAgents.filter(id => id !== agent.id);
                          setFormData({ ...formData, selectedAgents: newSelectedAgents });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={`agent-${agent.id}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {agent.name} ({agent.role})
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
                  Time ativo
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTeam(null);
                    setError(null);
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