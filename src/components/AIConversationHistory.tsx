import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Conversation {
  id: string;
  customer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  ai_confidence: number | null;
  subject: string | null;
  customer: {
    name: string | null;
    email: string | null;
  };
  messages?: Message[];
}

interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  content: string;
  sender_name?: string;
  created_at: string;
  sentiment?: {
    score: number;
    magnitude: number;
    label: 'positive' | 'negative' | 'neutral';
  };
}

interface AIConversationHistoryProps {
  limit?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  onViewConversation?: (conversationId: string) => void;
}

export default function AIConversationHistory({
  limit = 10,
  showSearch = true,
  showFilters = true,
  onViewConversation
}: AIConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchConversations();
  }, [limit, searchTerm, dateRange, confidenceFilter, statusFilter]);

  async function fetchConversations() {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockConversations: Conversation[] = Array(limit)
        .fill(0)
        .map((_, index) => {
          const isResolved = Math.random() > 0.3;
          const confidence = Math.random() * 0.5 + 0.5; // between 0.5 and 1.0
          
          return {
            id: `conv-${index + 1}`,
            customer_id: `cust-${index + 1}`,
            status: isResolved ? 'resolved' : 'active',
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // within last 7 days
            updated_at: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(), // within last 2 days
            ai_confidence: confidence,
            subject: `Question about ${['billing', 'product features', 'technical issue', 'account access'][Math.floor(Math.random() * 4)]}`,
            customer: {
              name: `Customer ${index + 1}`,
              email: `customer${index + 1}@example.com`,
            },
            messages: generateMockMessages(index + 1, isResolved),
          };
        });

      // Apply filters
      let filteredConversations = [...mockConversations];
      
      if (searchTerm) {
        filteredConversations = filteredConversations.filter(conv => 
          conv.customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.subject?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (dateRange.start) {
        filteredConversations = filteredConversations.filter(conv => 
          new Date(conv.created_at) >= new Date(dateRange.start)
        );
      }
      
      if (dateRange.end) {
        filteredConversations = filteredConversations.filter(conv => 
          new Date(conv.created_at) <= new Date(dateRange.end)
        );
      }
      
      if (confidenceFilter !== 'all') {
        filteredConversations = filteredConversations.filter(conv => {
          if (!conv.ai_confidence) return false;
          
          if (confidenceFilter === 'high') return conv.ai_confidence >= 0.8;
          if (confidenceFilter === 'medium') return conv.ai_confidence >= 0.6 && conv.ai_confidence < 0.8;
          if (confidenceFilter === 'low') return conv.ai_confidence < 0.6;
          return true;
        });
      }
      
      if (statusFilter !== 'all') {
        filteredConversations = filteredConversations.filter(conv => 
          conv.status === statusFilter
        );
      }

      setConversations(filteredConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateMockMessages(conversationId: number, isResolved: boolean): Message[] {
    const messageCount = Math.floor(Math.random() * 6) + 2; // 2-7 messages
    const messages: Message[] = [];
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 24);
    
    // First message is always from customer
    messages.push({
      id: `msg-${conversationId}-1`,
      conversation_id: `conv-${conversationId}`,
      direction: 'inbound',
      message_type: 'text',
      content: getRandomCustomerQuery(),
      sender_name: `Customer ${conversationId}`,
      created_at: new Date(startTime.getTime()).toISOString(),
      sentiment: {
        score: Math.random() * 2 - 1, // between -1 and 1
        magnitude: Math.random(),
        label: Math.random() > 0.7 ? 'negative' : Math.random() > 0.5 ? 'neutral' : 'positive'
      }
    });
    
    // Add AI and customer messages alternating
    for (let i = 1; i < messageCount; i++) {
      const isCustomer = i % 2 === 0;
      const messageTime = new Date(startTime.getTime() + i * 10 * 60 * 1000); // add 10 minutes per message
      
      messages.push({
        id: `msg-${conversationId}-${i + 1}`,
        conversation_id: `conv-${conversationId}`,
        direction: isCustomer ? 'inbound' : 'outbound',
        message_type: 'text',
        content: isCustomer ? getRandomCustomerResponse() : getRandomAIResponse(),
        sender_name: isCustomer ? `Customer ${conversationId}` : 'AI Assistant',
        created_at: messageTime.toISOString(),
        sentiment: isCustomer ? {
          score: Math.random() * 2 - 1,
          magnitude: Math.random(),
          label: Math.random() > 0.6 ? 'negative' : Math.random() > 0.3 ? 'neutral' : 'positive'
        } : undefined
      });
    }
    
    // If resolved, add a final message from the customer
    if (isResolved) {
      const finalTime = new Date(startTime.getTime() + messageCount * 10 * 60 * 1000);
      messages.push({
        id: `msg-${conversationId}-${messageCount + 1}`,
        conversation_id: `conv-${conversationId}`,
        direction: 'inbound',
        message_type: 'text',
        content: 'Thank you, that solved my problem!',
        sender_name: `Customer ${conversationId}`,
        created_at: finalTime.toISOString(),
        sentiment: {
          score: 0.8,
          magnitude: 0.7,
          label: 'positive'
        }
      });
    }
    
    return messages;
  }

  function getRandomCustomerQuery(): string {
    const queries = [
      "I'm having trouble logging into my account. Can you help me?",
      "How do I update my billing information?",
      "Can you explain the different subscription plans?",
      "I need help with integrating your API with my application.",
      "Is there a way to export all my data?",
      "I think there's an issue with your service. My dashboard isn't loading.",
      "Do you offer discounts for annual subscriptions?"
    ];
    
    return queries[Math.floor(Math.random() * queries.length)];
  }

  function getRandomCustomerResponse(): string {
    const responses = [
      "I've tried that already, but it's still not working.",
      "Could you explain that in more detail?",
      "I'm not sure I understand. Can you clarify?",
      "That makes sense, let me try it.",
      "Is there another way to solve this?",
      "I'm still seeing the same error message.",
      "That's not what I'm asking about."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  function getRandomAIResponse(): string {
    const responses = [
      "I understand your concern. To fix this issue, you'll need to clear your browser cache and try logging in again. Does that help?",
      "Thank you for providing that information. Based on what you've described, it seems like this might be related to our recent update. Let me guide you through the new process.",
      "I'd be happy to help with that! You can update your billing information by going to Settings > Billing > Payment Methods. From there you can add or edit your payment details.",
      "Great question! We offer three subscription tiers: Basic, Pro, and Enterprise. The Basic plan includes core features at $9.99/month, the Pro plan adds advanced analytics for $19.99/month, and Enterprise includes custom solutions starting at $49.99/month.",
      "I'm sorry you're experiencing this issue. Let's troubleshoot together. First, could you tell me what browser and device you're using?",
      "Yes, you can export all your data from the Account Settings page. Look for the 'Export Data' button at the bottom of the page. The export will include all your records in CSV format."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  const toggleConversationExpand = (conversationId: string) => {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null);
    } else {
      setExpandedConversation(conversationId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getConfidenceBadgeColor = (confidence: number | null) => {
    if (!confidence) return 'bg-gray-100 text-gray-700';
    if (confidence >= 0.8) return 'bg-green-100 text-green-700';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-700';
    return 'bg-orange-100 text-orange-700';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'new': return 'bg-purple-100 text-purple-700';
      case 'waiting': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSentimentColor = (sentiment?: { label: string }) => {
    if (!sentiment) return 'text-gray-500';
    
    switch (sentiment.label) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSentimentIcon = (sentiment?: { label: string }) => {
    if (!sentiment) return null;
    
    switch (sentiment.label) {
      case 'positive': return <ThumbsUp className="w-4 h-4" />;
      case 'negative': return <ThumbsDown className="w-4 h-4" />;
      default: return null;
    }
  };

  const getMoodEmoji = (sentiment?: { score: number }) => {
    if (!sentiment) return '😐';
    
    const score = sentiment.score;
    if (score > 0.7) return '😄';
    if (score > 0.3) return '🙂';
    if (score > -0.3) return '😐';
    if (score > -0.7) return '🙁';
    return '😠';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium mb-4">Histórico de Conversas IA</h2>
        
        {(showSearch || showFilters) && (
          <div className="space-y-3">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar conversas por cliente ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[150px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="resolved">Resolvidos</option>
                    <option value="closed">Fechados</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <select
                    value={confidenceFilter}
                    onChange={(e) => setConfidenceFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">Todas as confianças</option>
                    <option value="high">Alta (≥80%)</option>
                    <option value="medium">Média (60-80%)</option>
                    <option value="low">Baixa (&lt;60%)</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                      placeholder="Data inicial"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <ArrowRight className="text-gray-400 w-5 h-5 mx-1" />
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                      placeholder="Data final"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">Nenhuma conversa encontrada</h3>
          <p className="text-gray-500">
            {searchTerm || dateRange.start || dateRange.end || confidenceFilter !== 'all' || statusFilter !== 'all' 
              ? 'Tente ajustar os filtros para ver mais resultados'
              : 'Ainda não há conversas com IA registradas'}
          </p>
        </div>
      ) : (
        <div className="overflow-auto">
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="hover:bg-gray-50">
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleConversationExpand(conversation.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <h3 className="font-medium text-gray-900">
                          {conversation.customer.name || 'Cliente sem nome'}
                        </h3>
                        <span className="text-gray-500 text-sm">
                          ({conversation.customer.email})
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {conversation.subject || 'Sem assunto'}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadgeColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                        
                        {conversation.ai_confidence !== null && (
                          <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getConfidenceBadgeColor(conversation.ai_confidence)}`}>
                            <Bot className="w-3 h-3" />
                            {Math.round(conversation.ai_confidence * 100)}% confiança
                          </span>
                        )}
                        
                        {conversation.messages && conversation.messages.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conversation.messages.length} mensagens
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(conversation.created_at)}
                      </div>
                      
                      {expandedConversation === conversation.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded conversation */}
                {expandedConversation === conversation.id && conversation.messages && (
                  <div className="px-4 pb-4">
                    <div className="border rounded-lg bg-gray-50 p-4">
                      <div className="space-y-4">
                        {conversation.messages.map((message) => (
                          <div key={message.id} className={`flex items-start gap-3 ${message.direction === 'outbound' ? 'justify-end' : ''}`}>
                            {message.direction === 'inbound' && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                            
                            <div className={`max-w-[80%] ${message.direction === 'outbound' ? 'order-1' : 'order-2'}`}>
                              <div className={`p-3 rounded-lg ${
                                message.direction === 'outbound' 
                                  ? 'bg-primary text-white' 
                                  : 'bg-white border'
                              }`}>
                                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                              </div>
                              
                              <div className="flex justify-between mt-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">
                                    {message.sender_name || (message.direction === 'outbound' ? 'AI Assistant' : 'Customer')}
                                  </span>
                                  
                                  {message.sentiment && (
                                    <div className={`flex items-center gap-0.5 ${getSentimentColor(message.sentiment)}`}>
                                      <span>{getMoodEmoji(message.sentiment)}</span>
                                      {getSentimentIcon(message.sentiment)}
                                    </div>
                                  )}
                                </div>
                                
                                <span className="text-gray-500">
                                  {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                </span>
                              </div>
                            </div>
                            
                            {message.direction === 'outbound' && (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-primary" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {onViewConversation && (
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => onViewConversation(conversation.id)}
                            className="text-primary text-sm hover:underline flex items-center gap-1"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Ver conversa completa
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Sentiment analysis summary */}
                    {conversation.messages && conversation.messages.filter(m => m.direction === 'inbound' && m.sentiment).length > 0 && (
                      <div className="mt-3 p-3 bg-white border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Análise de Sentimento</h4>
                        <div className="flex flex-wrap gap-4">
                          {(() => {
                            const customerMessages = conversation.messages!.filter(m => 
                              m.direction === 'inbound' && m.sentiment
                            );
                            
                            const totalMessages = customerMessages.length;
                            const positive = customerMessages.filter(m => m.sentiment?.label === 'positive').length;
                            const neutral = customerMessages.filter(m => m.sentiment?.label === 'neutral').length;
                            const negative = customerMessages.filter(m => m.sentiment?.label === 'negative').length;
                            
                            const avgSentiment = customerMessages.reduce((sum, msg) => 
                              sum + (msg.sentiment?.score || 0), 0) / totalMessages;
                            
                            return (
                              <>
                                <div className="text-xs">
                                  <div className="text-gray-500">Sentimento médio</div>
                                  <div className="font-medium mt-0.5 flex items-center gap-1">
                                    <span>{avgSentiment > 0.3 ? '🙂' : avgSentiment < -0.3 ? '🙁' : '😐'}</span>
                                    <span>{avgSentiment.toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                <div className="text-xs">
                                  <div className="text-gray-500">Distribuição</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-0.5">
                                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                      <span>{Math.round(positive/totalMessages*100)}%</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                      <span>{Math.round(neutral/totalMessages*100)}%</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      <span>{Math.round(negative/totalMessages*100)}%</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-xs">
                                  <div className="text-gray-500">Evolução</div>
                                  <div className="font-medium mt-0.5 flex items-center gap-1">
                                    {(() => {
                                      const firstMsg = customerMessages[0];
                                      const lastMsg = customerMessages[customerMessages.length - 1];
                                      const firstScore = firstMsg?.sentiment?.score || 0;
                                      const lastScore = lastMsg?.sentiment?.score || 0;
                                      const diff = lastScore - firstScore;
                                      
                                      if (diff > 0.3) return <span className="text-green-500">Melhorou</span>;
                                      if (diff < -0.3) return <span className="text-red-500">Piorou</span>;
                                      return <span className="text-gray-500">Estável</span>;
                                    })()}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}