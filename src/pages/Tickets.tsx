import React, { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, 
  Search, 
  Filter, 
  Plus,
  MoreVertical,
  Clock,
  Users,
  Building2,
  Mail,
  AlertCircle,
  Tag as TagIcon,
  ArrowUpRight,
  MessageSquare,
  Trash2,
  X
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

interface Ticket {
  id: string;
  subject: string;
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_email: string;
  assigned_to: string | null;
  created_by: string | null;
  department_id: string | null;
  team_id: string | null;
  channel: string;
  created_at: string;
  updated_at: string;
  department?: { name: string };
  team?: { name: string };
  agent?: { name: string };
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'client' | 'agent' | 'system';
  sender_email: string;
  message: string;
  created_at: string;
}

const statusColors = {
  new: 'bg-purple-100 text-purple-700',
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusOptions = [
  { value: 'new', label: 'Novo' },
  { value: 'open', label: 'Aberto' },
  { value: 'pending', label: 'Pendente' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Fechado' },
];

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    department: '',
    team: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowTicketDetails(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [handleEscKey]);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowTicketDetails(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  async function fetchTickets() {
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          department:departments(name),
          team:teams(name),
          agent:agents!tickets_assigned_to_fkey(name),
          messages:ticket_messages(*)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.department) {
        query = query.eq('department_id', filters.department);
      }
      if (filters.team) {
        query = query.eq('team_id', filters.team);
      }

      if (searchTerm) {
        query = query.or(`subject.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching tickets');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(ticketId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus as Ticket['status'] }
          : ticket
      ));

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as Ticket['status'] } : null);
      }
    } catch (err) {
      setError('Error updating ticket status');
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
          <p className="text-gray-600">Gerencie tickets de suporte</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Novo Ticket
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por assunto ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Prioridade</option>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atribuído
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Atualização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Nenhum ticket encontrado
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr 
                  key={ticket.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowTicketDetails(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{ticket.subject}</div>
                      <div className="text-sm text-gray-500">{ticket.client_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(ticket.id, e.target.value);
                      }}
                      className={`px-2 py-1 rounded-full text-sm border-0 ${statusColors[ticket.status]}`}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {ticket.agent?.name || 'Não atribuído'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(ticket.updated_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <Menu as="div" className="relative">
                      <Menu.Button 
                        className="p-2 hover:bg-gray-100 rounded-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicket(ticket);
                                  setShowTicketDetails(true);
                                }}
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                <MessageSquare className="w-4 h-4" />
                                Ver Detalhes
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                <ArrowUpRight className="w-4 h-4" />
                                Transferir
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600`}
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Menu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showTicketDetails && selectedTicket && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleClickOutside}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between p-6">
                <h2 className="text-xl font-semibold">Detalhes do Ticket</h2>
                <button
                  onClick={() => setShowTicketDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Assunto</label>
                  <p className="mt-1">{selectedTicket.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email do Cliente</label>
                  <p className="mt-1">{selectedTicket.client_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className={`mt-1 px-2 py-1 rounded-full text-sm ${statusColors[selectedTicket.status]}`}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Prioridade</label>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-sm ${priorityColors[selectedTicket.priority]}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Histórico de Mensagens</h3>
              <div className="space-y-4">
                {selectedTicket.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.sender_type === 'agent' 
                        ? 'bg-indigo-50 ml-0 md:ml-8'
                        : 'bg-gray-50 mr-0 md:mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{message.sender_email}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}