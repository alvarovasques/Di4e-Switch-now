import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Flow {
  id: string;
  name: string;
  description: string;
  type: 'routing' | 'transfer' | 'automation';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export default function Flows() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'routing' as Flow['type'],
    conditions: {},
    actions: {},
    is_active: true,
  });

  useEffect(() => {
    fetchFlows();
  }, []);

  async function fetchFlows() {
    try {
      const { data, error } = await supabase
        .from('business_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (err) {
      console.error('Error fetching flows:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingFlow) {
        const { error } = await supabase
          .from('business_rules')
          .update(formData)
          .eq('id', editingFlow.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_rules')
          .insert([formData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingFlow(null);
      setFormData({
        name: '',
        description: '',
        type: 'routing',
        conditions: {},
        actions: {},
        is_active: true,
      });
      fetchFlows();
    } catch (err) {
      console.error('Error saving flow:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(flowId: string) {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;

    try {
      const { error } = await supabase
        .from('business_rules')
        .delete()
        .eq('id', flowId);

      if (error) throw error;
      fetchFlows();
    } catch (err) {
      console.error('Error deleting flow:', err);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Fluxos de Trabalho</h2>
            <p className="text-sm text-gray-500">
              Configure regras de roteamento e automação
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Novo Fluxo
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : flows.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum fluxo configurado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{flow.name}</h3>
                    <p className="text-sm text-gray-500">{flow.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {flow.type}
                      </span>
                      {flow.is_active ? (
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
                        setEditingFlow(flow);
                        setFormData({
                          name: flow.name,
                          description: flow.description,
                          type: flow.type,
                          conditions: flow.conditions,
                          actions: flow.actions,
                          is_active: flow.is_active,
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(flow.id)}
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

      {/* Add/Edit Flow Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingFlow ? 'Editar Fluxo' : 'Novo Fluxo'}
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
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as Flow['type'],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="routing">Roteamento</option>
                  <option value="transfer">Transferência</option>
                  <option value="automation">Automação</option>
                </select>
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
                  Fluxo ativo
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingFlow(null);
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