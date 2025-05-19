import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Bot, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Copy,
  Check,
  FileJson,
  ArrowRight,
  Calendar,
  RefreshCw,
  X,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AIWebhookEvent {
  id: string;
  event_type: string;
  agent_id: string | null;
  conversation_id: string | null;
  payload: Record<string, any>;
  processed: boolean;
  created_at: string;
  agent?: {
    name: string;
  };
}

export default function AIWebhooks() {
  const [events, setEvents] = useState<AIWebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AIWebhookEvent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('7days');
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    fetchEvents();
    fetchCount();
  }, [filter, period]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      let startDate = new Date();
      if (period === '24hours') {
        startDate.setHours(startDate.getHours() - 24);
      } else if (period === '7days') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30days') {
        startDate.setDate(startDate.getDate() - 30);
      }
      
      let query = supabase
        .from('ai_webhook_events')
        .select(`
          *,
          agent:ai_agents(id, name)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('event_type', filter);
      }
      
      if (searchTerm) {
        query = query.or(`payload.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching AI webhook events:', err);
      setError('Falha ao carregar eventos de webhook');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCount = async () => {
    try {
      // Calculate date range based on selected period
      let startDate = new Date();
      if (period === '24hours') {
        startDate.setHours(startDate.getHours() - 24);
      } else if (period === '7days') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30days') {
        startDate.setDate(startDate.getDate() - 30);
      }
      
      let query = supabase
        .from('ai_webhook_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (filter !== 'all') {
        query = query.eq('event_type', filter);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching count:', err);
    }
  };

  const handleShowDetails = (event: AIWebhookEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(event.id);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ai.conversation.started':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'ai.conversation.completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ai.handoff.requested':
        return <ArrowUpRight className="w-5 h-5 text-orange-500" />;
      case 'ai.handoff.completed':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'ai.feedback.received':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'ai.knowledge.used':
        return <Book className="w-5 h-5 text-indigo-500" />;
      default:
        return <Zap className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatEventTypeName = (eventType: string) => {
    switch (eventType) {
      case 'ai.conversation.started':
        return 'Conversa Iniciada';
      case 'ai.conversation.completed':
        return 'Conversa Finalizada';
      case 'ai.handoff.requested':
        return 'Transferência Solicitada';
      case 'ai.handoff.completed':
        return 'Transferência Concluída';
      case 'ai.feedback.received':
        return 'Feedback Recebido';
      case 'ai.knowledge.used':
        return 'Base de Conhecimento Utilizada';
      default:
        return eventType;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Eventos de IA</h2>
            <p className="text-sm text-gray-500">
              Monitore os eventos de IA para diagnóstico e integração
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="24hours">Últimas 24 horas</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
            </select>
            <button
              onClick={() => fetchEvents()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
              />
            </div>
            <button 
              onClick={fetchEvents}
              className="p-2 border rounded-lg hover:bg-white transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs flex items-center gap-1 text-gray-500">
              <Filter className="w-3 h-3" />
              <span>Tipo:</span>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos ({totalCount})</option>
              <option value="ai.conversation.started">Conversa Iniciada</option>
              <option value="ai.conversation.completed">Conversa Finalizada</option>
              <option value="ai.handoff.requested">Transferência Solicitada</option>
              <option value="ai.handoff.completed">Transferência Concluída</option>
              <option value="ai.feedback.received">Feedback Recebido</option>
              <option value="ai.knowledge.used">Base de Conhecimento</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bot className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-500 text-center max-w-md">
              {filter === 'all' 
                ? 'Nenhum evento de IA foi registrado neste período. Eventos serão registrados quando os agentes de IA forem utilizados.'
                : `Nenhum evento do tipo "${formatEventTypeName(filter)}" foi registrado neste período.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.event_type)}
                        <span className="text-sm font-medium text-gray-900">
                          {formatEventTypeName(event.event_type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {event.agent?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(event.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.processed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.processed ? 'Processado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleShowDetails(event)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {getEventIcon(selectedEvent.event_type)}
                {formatEventTypeName(selectedEvent.event_type)}
              </h2>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">ID do Evento</h3>
                  <div className="mt-1 flex items-center gap-1">
                    <div className="text-sm text-gray-900 font-mono overflow-hidden text-ellipsis">{selectedEvent.id}</div>
                    <button
                      onClick={() => handleCopy(selectedEvent.id, 'id')}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      title="Copiar ID"
                    >
                      {copiedField === 'id' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">Data/Hora</h3>
                  <div className="mt-1 text-sm text-gray-900">{formatTimestamp(selectedEvent.created_at)}</div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">Agente</h3>
                  <div className="mt-1 text-sm text-gray-900">{selectedEvent.agent?.name || 'N/A'}</div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">Status</h3>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedEvent.processed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedEvent.processed ? 'Processado' : 'Pendente'}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xs font-medium text-gray-500 uppercase">Conversa ID</h3>
                  <div className="mt-1 flex items-center gap-1">
                    <div className="text-sm text-gray-900 font-mono overflow-hidden text-ellipsis">
                      {selectedEvent.conversation_id || 'N/A'}
                    </div>
                    {selectedEvent.conversation_id && (
                      <button
                        onClick={() => handleCopy(selectedEvent.conversation_id!, 'conversation_id')}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        title="Copiar ID da Conversa"
                      >
                        {copiedField === 'conversation_id' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Payload</h3>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedEvent.payload, null, 2), 'payload')}
                    className="flex items-center gap-1 text-xs text-primary p-1 hover:bg-gray-100 rounded"
                    title="Copiar Payload"
                  >
                    {copiedField === 'payload' ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copiar JSON</span>
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-80">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Event count summary */}
      <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>
            Exibindo {events.length} evento{events.length !== 1 ? 's' : ''} de {totalCount} encontrado{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">
            Os eventos de IA podem ser usados para integração com outros sistemas
          </span>
        </div>
      </div>
    </div>
  );
}

// Add missing imports
import { MessageSquare, CheckCircle, ArrowUpRight, Star, Book } from 'lucide-react';