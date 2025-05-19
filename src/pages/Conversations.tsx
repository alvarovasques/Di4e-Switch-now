import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter as FilterIcon, 
  Plus,
  MoreVertical,
  XCircle,
  CheckCircle,
  ArrowUpRight,
  UserPlus2,
  Loader2,
  TagIcon,
  X,
  Clock,
  Users,
  Building2,
  Send,
  Paperclip,
  Phone,
  Video,
  RefreshCw,
  Bot,
  Star,
  AlertTriangle
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { Customer } from '../types/customer';
import type { Agent } from '../types/agent';

interface Conversation {
  id: string;
  conversation_type: 'chat' | 'ticket' | 'ai_chat';
  customer_id: string;
  channel_type: string;
  status: string;
  subject: string | null;
  assigned_to: string | null;
  ai_confidence?: number;
  ai_response_time?: string;
  satisfaction_score?: number;
  satisfaction_feedback?: string;
  created_at: string;
  updated_at: string;
  customer: {
    name: string | null;
    email: string | null;
  };
  agent?: {
    name: string;
  };
  department?: {
    name: string;
  };
  team?: {
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  sender_name: string;
  created_at: string;
}

const statusColors = {
  new: 'bg-purple-100 text-purple-700',
  active: 'bg-blue-100 text-blue-700',
  waiting: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationType, setConversationType] = useState<'chat' | 'ticket' | 'ai_chat'>('chat');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    team: '',
    department: '',
    status: '',
    priority: '',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchCurrentAgent();
    fetchTeams();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (currentAgent) {
      fetchConversations();
    }
  }, [filters, conversationType, currentAgent]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      fetchCustomer(selectedConversation.customer_id);
    }
  }, [selectedConversation]);

  async function fetchCurrentAgent() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: agent } = await supabase
          .from('agents')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        setCurrentAgent(agent);
      }
    } catch (err) {
      console.error('Error fetching current agent:', err);
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

  async function fetchConversations() {
    try {
      setLoading(true);
      let query = supabase
        .from('conversations')
        .select(`
          *,
          customer:customers!inner(name, email),
          agent:agents!conversations_assigned_to_fkey(name),
          department:departments(name),
          team:teams(name)
        `);

      // Filter by conversation type
      query = query.eq('conversation_type', conversationType);

      // Apply other filters
      query = query
        .order('updated_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.team) {
        query = query.eq('team_id', filters.team);
      }
      if (filters.department) {
        query = query.eq('department_id', filters.department);
      }

      // Apply search term if provided
      if (searchTerm) {
        query = query.or(`subject.ilike.%${searchTerm}%,customer.name.ilike.%${searchTerm}%,customer.email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to fetch messages');
    }
  }

  async function fetchCustomer(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          tags:customer_tags(
            tag:tags(*)
          ),
          notes(id, content, created_by, created_at),
          tasks(id, title, description, due_date, status, assigned_to)
        `)
        .eq('id', customerId)
        .single();

      if (error) throw error;
      
      // Transform tags structure
      const transformedData = {
        ...data,
        tags: data.tags.map((t: any) => t.tag)
      };
      
      setSelectedCustomer(transformedData);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Failed to fetch customer details');
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }

  async function handleAssignToMe() {
    if (!selectedConversation || !currentAgent) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          assigned_to: currentAgent.id,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      // Update local state
      setSelectedConversation(prev => prev ? {
        ...prev,
        assigned_to: currentAgent.id,
        status: 'active'
      } : null);

      // Refresh conversations list
      fetchConversations();
    } catch (err) {
      console.error('Error assigning conversation:', err);
      setError('Failed to assign conversation');
    }
  }

  async function handleCloseConversation() {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      // Update local state
      setSelectedConversation(prev => prev ? {
        ...prev,
        status: 'closed',
        closed_at: new Date().toISOString()
      } : null);

      // Refresh conversations list
      fetchConversations();
    } catch (err) {
      console.error('Error closing conversation:', err);
      setError('Failed to close conversation');
    }
  }

  async function handleResolveConversation() {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      // Update local state
      setSelectedConversation(prev => prev ? {
        ...prev,
        status: 'resolved'
      } : null);

      // Refresh conversations list
      fetchConversations();
    } catch (err) {
      console.error('Error resolving conversation:', err);
      setError('Failed to resolve conversation');
    }
  }

  async function handleTransferConversation(teamId: string) {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          team_id: teamId,
          assigned_to: null,
          status: 'new',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      // Update local state
      setSelectedConversation(prev => prev ? {
        ...prev,
        team_id: teamId,
        assigned_to: null,
        status: 'new'
      } : null);

      // Refresh conversations list
      fetchConversations();
    } catch (err) {
      console.error('Error transferring conversation:', err);
      setError('Failed to transfer conversation');
    }
  }

  async function handleAttachFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0] || !selectedConversation || !currentAgent) return;

    const file = e.target.files[0];
    try {
      // Create a new message with file attachment
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: selectedConversation.id,
          direction: 'outbound',
          message_type: 'file',
          content: `Arquivo anexado: ${file.name}`,
          sender_name: currentAgent.name,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Refresh messages
      fetchMessages(selectedConversation.id);
    } catch (err) {
      console.error('Error handling file:', err);
      setError('Failed to attach file');
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim() || !currentAgent) return;

    try {
      // If admin and conversation is unassigned, assign it first
      if (currentAgent.role === 'admin' && !selectedConversation.assigned_to) {
        const { error: assignError } = await supabase
          .from('conversations')
          .update({
            assigned_to: currentAgent.id,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedConversation.id);

        if (assignError) throw assignError;

        // Update local state for assignment
        setSelectedConversation(prev => prev ? {
          ...prev,
          assigned_to: currentAgent.id,
          status: 'active'
        } : null);
      }

      // Send the message
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: selectedConversation.id,
          direction: 'outbound',
          content: newMessage,
          sender_name: currentAgent.name,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Clear input and refresh messages
      setNewMessage('');
      fetchMessages(selectedConversation.id);

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      // Refresh conversations list
      fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  }

  function createNewConversation() {
    // Implement new conversation creation functionality
    alert("Funcionalidade para criar nova conversa ainda será implementada");
  }

  function getConversationTypeTitle() {
    switch(conversationType) {
      case 'chat': return 'Conversas';
      case 'ticket': return 'Tickets';
      case 'ai_chat': return 'Atendimentos IA';
      default: return 'Conversas';
    }
  }

  function getEmptyStateMessage() {
    switch(conversationType) {
      case 'chat': return 'Nenhuma conversa encontrada';
      case 'ticket': return 'Nenhum ticket encontrado';
      case 'ai_chat': return 'Nenhum atendimento IA encontrado';
      default: return 'Nenhum registro encontrado';
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Left sidebar */}
      <div className="w-80 flex-shrink-0 border-r bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">{getConversationTypeTitle()}</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setConversationType('chat')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  conversationType === 'chat' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setConversationType('ticket')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  conversationType === 'ticket'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Tickets</span>
              </button>
              <button
                onClick={() => setConversationType('ai_chat')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  conversationType === 'ai_chat'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>IA</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                title="Atualizar lista de conversas"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
              >
                <FilterIcon className="w-5 h-5" />
              </button>
              <button
                onClick={createNewConversation}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Nova conversa"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="space-y-3 mb-4 animate-fadeIn">
              <select
                value={filters.team}
                onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos os times</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>

              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos os setores</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos os status</option>
                <option value="new">Novo</option>
                <option value="active">Ativo</option>
                <option value="waiting">Aguardando</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas as prioridades</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {getEmptyStateMessage()}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">
                        {conversation.customer.name || 'Cliente sem nome'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {conversation.customer.email || 'Email não informado'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        statusColors[conversation.status]
                      }`}>
                        {conversation.status}
                      </span>
                      {conversation.conversation_type === 'ai_chat' && conversation.ai_confidence && (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                          <Bot className="w-3 h-3" />
                          {(conversation.ai_confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {conversation.satisfaction_score && (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          <Star className="w-3 h-3" />
                          {conversation.satisfaction_score}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    {conversation.team && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {conversation.team.name}
                      </span>
                    )}
                    {conversation.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {conversation.department.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {conversation.channel_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(conversation.updated_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium">
                    {selectedConversation.customer.name || 'Cliente sem nome'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.customer.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedConversation.assigned_to && (
                    <button
                      onClick={handleAssignToMe}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      title="Assumir esta conversa"
                    >
                      <UserPlus2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => window.open('tel:+1234567890')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Iniciar chamada de voz"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open('https://meet.google.com')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Iniciar chamada de vídeo"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <Menu as="div" className="menu-container">
                    {({ open }) => (
                      <>
                        <Menu.Button 
                          className={`p-2 rounded-lg transition-colors ${
                            open ? 'bg-gray-100' : 'hover:bg-gray-100'
                          }`}
                          title="Mais opções"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Menu.Button>
                        <Menu.Items 
                          className={`menu-content bg-white border divide-y divide-gray-100 ${
                            open ? 'menu-enter' : 'menu-leave'
                          }`}
                        >
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleResolveConversation}
                                  className={`
                                    flex items-center gap-2 w-full px-4 py-2 text-sm
                                    ${active ? 'bg-gray-50' : ''}
                                    text-green-600 hover:bg-gray-50 transition-colors
                                  `}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Marcar como resolvido
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleCloseConversation}
                                  className={`
                                    flex items-center gap-2 w-full px-4 py-2 text-sm
                                    ${active ? 'bg-gray-50' : ''}
                                    text-red-600 hover:bg-gray-50 transition-colors
                                  `}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Encerrar conversa
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                          <div className="py-1">
                            <div className="px-4 py-2 text-xs font-medium text-gray-500">
                              Transferir para
                            </div>
                            {teams.map((team) => (
                              <Menu.Item key={team.id}>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleTransferConversation(team.id)}
                                    className={`
                                      flex items-center gap-2 w-full px-4 py-2 text-sm
                                      ${active ? 'bg-gray-50' : ''}
                                      text-gray-700 hover:bg-gray-50 transition-colors
                                    `}
                                  >
                                    <ArrowUpRight className="w-4 h-4" />
                                    {team.name}
                                  </button>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                          
                          {conversationType === 'chat' && (
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => alert("Converterá para ticket")}
                                    className={`
                                      flex items-center gap-2 w-full px-4 py-2 text-sm
                                      ${active ? 'bg-gray-50' : ''}
                                      text-indigo-600 hover:bg-gray-50 transition-colors
                                    `}
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    Converter para Ticket
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          )}
                        </Menu.Items>
                      </>
                    )}
                  </Menu>
                </div>
              </div>
            </div>

            {/* SLA warning if applicable */}
            {selectedConversation.priority === 'high' || selectedConversation.priority === 'urgent' ? (
              <div className="bg-amber-50 border-b border-amber-200 p-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {selectedConversation.priority === 'urgent'
                      ? 'SLA Urgente: Resposta em até 15 minutos'
                      : 'SLA Alta Prioridade: Resposta em até 1 hora'}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma mensagem nesta conversa</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.direction === 'outbound'
                          ? 'bg-primary text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">{message.sender_name}</p>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message input */}
            <div className="bg-white border-t p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <label 
                  htmlFor="file-upload"
                  className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                  title="Anexar arquivo"
                >
                  <Paperclip className="w-5 h-5 text-gray-500" />
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleAttachFile}
                  />
                </label>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 transition-colors"
                  title="Enviar mensagem"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Nenhuma conversa selecionada
              </h2>
              <p className="text-gray-500">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}