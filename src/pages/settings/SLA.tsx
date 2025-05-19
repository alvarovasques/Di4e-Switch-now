import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SLAConfig {
  id: string;
  department_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  first_response_time: string;
  resolution_time: string;
  escalation_time: string | null;
  escalation_to: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
}

export default function SLA() {
  const [slaConfigs, setSLAConfigs] = useState<SLAConfig[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SLAConfig | null>(null);
  const [formData, setFormData] = useState({
    department_id: '',
    priority: 'medium' as SLAConfig['priority'],
    first_response_time: '01:00:00',
    resolution_time: '24:00:00',
    escalation_time: '',
    escalation_to: '',
  });

  useEffect(() => {
    fetchSLAConfigs();
    fetchDepartments();
    fetchAgents();
  }, []);

  async function fetchSLAConfigs() {
    try {
      const { data, error } = await supabase
        .from('sla_configs')
        .select(`
          *,
          department:departments(name),
          escalation:agents!sla_configs_escalation_to_fkey(name)
        `)
        .order('department_id', { ascending: true })
        .order('priority', { ascending: true });

      if (error) throw error;
      setSLAConfigs(data || []);
    } catch (err) {
      console.error('Error fetching SLA configs:', err);
    } finally {
      setLoading(false);
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
        .eq('active', true)
        .in('role', ['supervisor', 'manager', 'admin']);
      setAgents(data || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const slaData = {
        department_id: formData.department_id,
        priority: formData.priority,
        first_response_time: formData.first_response_time,
        resolution_time: formData.resolution_time,
        escalation_time: formData.escalation_time || null,
        escalation_to: formData.escalation_to || null,
      };

      if (editingConfig) {
        const { error } = await supabase
          .from('sla_configs')
          .update(slaData)
          .eq('id', editingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sla_configs')
          .insert([slaData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingConfig(null);
      setFormData({
        department_id: '',
        priority: 'medium',
        first_response_time: '01:00:00',
        resolution_time: '24:00:00',
        escalation_time: '',
        escalation_to: '',
      });
      fetchSLAConfigs();
    } catch (err) {
      console.error('Error saving SLA config:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(configId: string) {
    if (!confirm('Tem certeza que deseja excluir esta configuração de SLA?')) return;

    try {
      const { error } = await supabase
        .from('sla_configs')
        .delete()
        .eq('id', configId);

      if (error) throw error;
      fetchSLAConfigs();
    } catch (err) {
      console.error('Error deleting SLA config:', err);
    }
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Configurações de SLA</h2>
            <p className="text-sm text-gray-500">
              Defina os tempos de resposta e resolução por setor e prioridade
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Nova Configuração
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : slaConfigs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma configuração de SLA definida</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slaConfigs.map((config) => (
              <div
                key={config.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">
                      {config.department?.name || 'Setor não encontrado'}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          priorityColors[config.priority]
                        }`}
                      >
                        {config.priority}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p>
                        Primeira resposta: {config.first_response_time}
                      </p>
                      <p>
                        Tempo de resolução: {config.resolution_time}
                      </p>
                      {config.escalation_time && (
                        <p>
                          Escalação após: {config.escalation_time}
                          {config.escalation?.name && ` para ${config.escalation.name}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingConfig(config);
                        setFormData({
                          department_id: config.department_id,
                          priority: config.priority,
                          first_response_time: config.first_response_time,
                          resolution_time: config.resolution_time,
                          escalation_time: config.escalation_time || '',
                          escalation_to: config.escalation_to || '',
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
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
              {editingConfig ? 'Editar Configuração de SLA' : 'Nova Configuração de SLA'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Setor</label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione um setor</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as SLAConfig['priority'],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tempo para Primeira Resposta (HH:MM:SS)
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                  placeholder="01:00:00"
                  value={formData.first_response_time}
                  onChange={(e) =>
                    setFormData({ ...formData, first_response_time: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tempo para Resolução (HH:MM:SS)
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                  placeholder="24:00:00"
                  value={formData.resolution_time}
                  onChange={(e) =>
                    setFormData({ ...formData, resolution_time: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tempo para Escalação (HH:MM:SS)
                </label>
                <input
                  type="text"
                  pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                  placeholder="04:00:00"
                  value={formData.escalation_time}
                  onChange={(e) =>
                    setFormData({ ...formData, escalation_time: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Escalar para
                </label>
                <select
                  value={formData.escalation_to}
                  onChange={(e) =>
                    setFormData({ ...formData, escalation_to: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione um agente</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingConfig(null);
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