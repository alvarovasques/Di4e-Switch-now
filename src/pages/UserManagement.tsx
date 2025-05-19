import React, { useEffect, useState } from 'react';
import { Loader2, UserPlus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'supervisor' | 'manager' | 'admin';
  active: boolean;
  created_at: string;
}

const roleTranslations = {
  agent: 'Agente',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  admin: 'Administrador'
};

export default function UserManagement() {
  const [users, setUsers] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent' as Agent['role'],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError('Falha ao carregar usuários');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user already exists in agents table
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingAgent) {
        setError('Este email já está registrado no sistema');
        setLoading(false);
        return;
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create agent profile
        const { error: profileError } = await supabase
          .from('agents')
          .insert([
            {
              auth_id: authData.user.id,
              name: formData.name,
              email: formData.email,
              role: formData.role,
            },
          ]);

        if (profileError) throw profileError;

        // Reset form and close modal
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'agent',
        });
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (err) {
      if (err instanceof Error) {
        // Check for specific error messages
        if (err.message.includes('User already registered')) {
          setError('Este email já está registrado no sistema de autenticação');
        } else {
          setError(err.message);
        }
      } else {
        setError('Falha ao criar usuário');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUser(user: Agent) {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          name: editingUser?.name,
          role: editingUser?.role,
          active: editingUser?.active,
        })
        .eq('id', user.id);

      if (error) throw error;

      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(user: Agent) {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('agents')
        .update({ active: !user.active })
        .eq('id', user.id);

      if (error) throw error;
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status do usuário');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600">Gerencie usuários e suas permissões</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Adicionar Usuário
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.name}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, name: e.target.value })
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      ) : (
                        user.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.role}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              role: e.target.value as Agent['role'],
                            })
                          }
                          className="w-full px-2 py-1 border rounded"
                        >
                          <option value="agent">Agente</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="manager">Gerente</option>
                          <option value="admin">Administrador</option>
                        </select>
                      ) : (
                        <span className="px-2 py-1 text-sm rounded-full bg-gray-100">
                          {roleTranslations[user.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`flex items-center gap-1 px-2 py-1 rounded ${
                          user.active
                            ? 'text-green-700 bg-green-50'
                            : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {user.active ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser?.id === user.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateUser(user)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Adicionar Novo Usuário</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Função
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as Agent['role'],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="agent">Agente</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Adicionar Usuário'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}