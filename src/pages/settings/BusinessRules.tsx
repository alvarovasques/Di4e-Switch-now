import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'transfer' | 'routing' | 'sla';
  department_id: string | null;
  team_id: string | null;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  priority: number;
}

interface Department {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

export default function BusinessRules() {
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'transfer' as BusinessRule['rule_type'],
    department_id: '',
    team_id: '',
    conditions: {},
    actions: {},
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    fetchRules();
    fetchDepartments();
    fetchTeams();
  }, []);

  async function fetchRules() {
    try {
      const { data, error } = await supabase
        .from('business_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (err) {
      console.error('Error fetching rules:', err);
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

  async function fetchTeams() {
    try {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true);
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRule) {
        const { error } = await supabase
          .from('business_rules')
          .update(formData)
          .eq('id', editingRule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_rules')
          .insert([formData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        rule_type: 'transfer',
        department_id: '',
        team_id: '',
        conditions: {},
        actions: {},
        is_active: true,
        priority: 0,
      });
      fetchRules();
    } catch (err) {
      console.error('Error saving rule:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(ruleId: string) {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    try {
      const { error } = await supabase
        .from('business_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      fetchRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Regras de Negócio</h2>
            <p className="text-sm text-gray-500">
              Configure regras para transferência e distribuição de conversas
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Nova Regra
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma regra configurada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{rule.name}</h3>
                    <p className="text-sm text-gray-500">{rule.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {rule.rule_type}
                      </span>
                      {rule.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setFormData(rule);
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
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
              {editingRule ? 'Editar Regra' : 'Nova Regra'}
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
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={formData.rule_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rule_type: e.target.value as BusinessRule['rule_type'],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="transfer">Transferência</option>
                  <option value="routing">Distribuição</option>
                  <option value="sla">SLA</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Setor</label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, department_id: e.target.value || null })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Todos os setores</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <select
                    value={formData.team_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, team_id: e.target.value || null })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Todos os times</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                <input
                  type="number"
                  min="0"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                  Regra ativa
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRule(null);
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