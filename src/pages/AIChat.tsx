import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Search, 
  Filter, 
  User, 
  Clock, 
  BarChart2,
  ArrowRight,
  Zap,
  RefreshCw,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AIChat from '../components/AIChat';

interface Conversation {
  id: string;
  customer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  ai_confidence: number | null;
  customer: {
    name: string;
    email: string;
  };
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_global: boolean;
  settings: Record<string, any>;
}

interface AIMetrics {
  totalConversations: number;
  avgConfidence: number;
  avgResponseTime: number;
  handoffRate: number;
  satisfactionRate: number;
}

export default function AIChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    confidence: '',
    date: ''
  });
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalConversations: 0,
    avgConfidence: 0,
    avgResponseTime: 0,
    handoffRate: 0,
    satisfactionRate: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchAgents();
    fetchMetrics();
  }, [filters]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('conversations')
        .select(`
          id,
          customer_id,
          status,
          created_at,
          updated_at,
          ai_confidence,
          customer:customers(name, email)
        `)
        .eq('conversation_type', 'ai_chat')
        .order('updated_at', { ascending: false });
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.confidence) {
        if (filters.confidence === 'high') {
          query = query.gte('ai_confidence', 0.8);
        } else if (filters.confidence === 'medium') {
          query = query.gte('ai_confidence', 0.5).lt('ai_confidence', 0.8);
        } else if (filters.confidence === 'low') {
          query = query.lt('ai_confidence', 0.5);
        }
      }
      
      if (filters.date) {
        const date = new Date();
        if (filters.date === 'today') {
          date.setHours(0, 0, 0, 0);
          query = query.gte('created_at', date.toISOString());
        } else if (filters.date === 'week') {
          date.setDate(date.getDate() - 7);
          query = query.gte('created_at', date.toISOString());
        } else if (filters.date === 'month') {
          date.setMonth(date.getMonth() - 1);
          query = query.gte('created_at', date.toISOString());
        }
      }
      
      if (searchTerm) {
        query = query.or(`customer.name.ilike.%${searchTerm}%,customer.email.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching AI conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setAgents(data || []);
      
      // Select first agent by default
      if (data && data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching AI agents:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      // In a real app, this would fetch from a metrics table or calculate
      // For now, we'll use mock data
      setMetrics({
        totalConversations: 256,
        avgConfidence: 0.87,
        avgResponseTime: 1.2,
        handoffRate: 0.15,
        satisfactionRate: 0.92
      });
    } catch (err) {
      console.error('Error fetching AI metrics:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    await fetchMetrics();
    setRefreshing(false);
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
  };

  const handleHandoff = async (conversationId: string) => {
    try {
      // Update conversation to be handled by human
      await supabase
        .from('conversations')
        .update({
          is_ai_handled: false,
          status: 'new',
          assigned_to: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      // Add system message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          direction: 'outbound',
          message_type: 'system',
          content: 'Esta conversa foi transferida para um atendente humano.',
          sender_name: 'Sistema'
        });
      
      // Refresh conversations
      fetchConversations();
      
      // Clear selected conversation
      setSelectedConversation(null);
    } catch (err) {
      console.error('Error handling handoff:', err);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Left sidebar */}
      <div className="w-80 flex-shrink-0 border-r bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Atendimento IA</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                title="Nova conversa"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={handleRefresh}
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${refreshing ? 'animate-spin' : ''}`}
                title="Atualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Filtros"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

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

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="space-y-3 mt-4 animate-fadeIn">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos os status</option>
                <option value="new">Novo</option>
                <option value="active">Ativo</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>

              <select
                value={filters.confidence}
                onChange={(e) => setFilters({ ...filters, confidence: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas as confianças</option>
                <option value="high">Alta confiança (&gt;80%)</option>
                <option value="medium">Média confiança (50-80%)</option>
                <option value="low">Baixa confiança (&lt;50%)</option>
              </select>

              <select
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas as datas</option>
                <option value="today">Hoje</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Últimos 30 dias</option>
              </select>
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhuma conversa encontrada
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
                        {conversation.customer?.name || 'Cliente sem nome'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {conversation.customer?.email || 'Email não informado'}
                      </p>
                    </div>
                    <div className="mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        conversation.status === 'active' ? 'bg-green-100 text-green-700' :
                        conversation.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        conversation.status === 'resolved' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {conversation.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Bot className="w-4 h-4" />
                      {conversation.ai_confidence 
                        ? `${Math.round(conversation.ai_confidence * 100)}% confiança` 
                        : 'IA'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(conversation.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metrics Footer */}
        <div className="bg-gray-50 p-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <BarChart2 className="w-4 h-4" />
            Métricas de IA
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded border">
              <div className="text-gray-500">Conversas</div>
              <div className="font-medium">{metrics.totalConversations}</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="text-gray-500">Confiança</div>
              <div className="font-medium">{(metrics.avgConfidence * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="text-gray-500">Tempo Resposta</div>
              <div className="font-medium">{metrics.avgResponseTime.toFixed(1)}s</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="text-gray-500">Satisfação</div>
              <div className="font-medium">{(metrics.satisfactionRate * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <AIChat 
            conversationId={selectedConversation.id}
            customerId={selectedConversation.customer_id}
            onHandoff={() => handleHandoff(selectedConversation.id)}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-white">
              <h2 className="text-lg font-medium">Nova Conversa</h2>
            </div>
            
            <div className="flex-1 p-4">
              <AIChat 
                onHandoff={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}