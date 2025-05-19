import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AIResponseIndicator from './AIResponseIndicator';
import AIFeedback from './AIFeedback';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
}

interface AIAgentOption {
  id: string;
  name: string;
  description: string;
}

interface AIKnowledgeBaseOption {
  id: string;
  name: string;
}

interface AIResponse {
  response: string;
  conversation_id: string;
  confidence: number;
  processing_time: number;
  tokens_used: number;
}

interface AIError {
  message: string;
  timestamp: Date;
}

interface AIMetrics {
  totalMessages: number;
  avgConfidence: number;
  responseTime: number;
}

interface AIAgentProps {
  customerId?: string;
  conversationId?: string;
  onHandoff?: () => void;
  initialMessages?: Message[];
}

const AIChat: React.FC<AIAgentProps> = ({ 
  customerId, 
  conversationId, 
  onHandoff,
  initialMessages = []
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [agents, setAgents] = useState<AIAgentOption[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<AIKnowledgeBaseOption[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalMessages: 0,
    avgConfidence: 0,
    responseTime: 0
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
    fetchKnowledgeBases();
    if (currentConversationId) {
      fetchConversationHistory(currentConversationId);
    }
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id, name, description')
        .eq('is_active', true);
      
      if (error) throw error;
      setAgents(data || []);
      
      // Select first agent by default if none selected
      if (data && data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching AI agents:', err);
    }
  };

  const fetchKnowledgeBases = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_bases')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      setKnowledgeBases(data || []);
    } catch (err) {
      console.error('Error fetching knowledge bases:', err);
    }
  };

  const fetchConversationHistory = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const formattedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          role: msg.direction === 'inbound' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
        
        // Update metrics
        const { data: aiLogs } = await supabase
          .from('ai_conversation_logs')
          .select('confidence_score, processing_time')
          .eq('conversation_id', conversationId);
        
        if (aiLogs && aiLogs.length > 0) {
          const avgConfidence = aiLogs.reduce((sum, log) => sum + (log.confidence_score || 0), 0) / aiLogs.length;
          const avgResponseTime = aiLogs.reduce((sum, log) => {
            const timeStr = log.processing_time;
            if (typeof timeStr === 'string') {
              const seconds = parseInt(timeStr.split(' ')[0]);
              return sum + seconds;
            }
            return sum;
          }, 0) / aiLogs.length;
          
          setMetrics({
            totalMessages: data.length,
            avgConfidence,
            responseTime: avgResponseTime
          });
        }
      }
    } catch (err) {
      console.error('Error fetching conversation history:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: input,
          conversation_id: currentConversationId,
          customer_id: customerId,
          agent_id: selectedAgent
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data: AIResponse = await response.json();
      
      // Update conversation ID if this is a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(data.conversation_id);
      }
      
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        confidence: data.confidence
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update metrics
      setMetrics(prev => ({
        totalMessages: prev.totalMessages + 2, // User message + AI response
        avgConfidence: (prev.avgConfidence * prev.totalMessages + data.confidence) / (prev.totalMessages + 2),
        responseTime: (prev.responseTime * prev.totalMessages + data.processing_time) / (prev.totalMessages + 2)
      }));
      
      // If confidence is too low, suggest handoff
      if (data.confidence < 0.6 && onHandoff) {
        const systemMessage: Message = {
          id: Date.now().toString() + '-system',
          role: 'system',
          content: 'A confiança na resposta está baixa. Deseja falar com um atendente humano?',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (err) {
      console.error('Error sending message to AI:', err);
      setError({
        message: err instanceof Error ? err.message : 'Erro ao processar mensagem',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = async (messageId: string, score: number, comment?: string) => {
    try {
      // Find the message in our local state
      const message = messages.find(m => m.id === messageId);
      if (!message || message.role !== 'assistant') return;
      
      // Update the AI conversation log with feedback
      const { data: logs } = await supabase
        .from('ai_conversation_logs')
        .select('id')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (logs && logs.length > 0) {
        await supabase
          .from('ai_conversation_logs')
          .update({
            feedback_score: score,
            metadata: { feedback_comment: comment }
          })
          .eq('id', logs[0].id);
      }
      
      // Update UI to show feedback was recorded
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId 
            ? { ...m, feedbackRecorded: true } 
            : m
        )
      );
    } catch (err) {
      console.error('Error recording feedback:', err);
    }
  };

  const handleRequestHandoff = () => {
    if (onHandoff) {
      onHandoff();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Assistente Virtual</h3>
            <p className="text-xs text-gray-500">
              {currentConversationId 
                ? `Conversa #${currentConversationId.substring(0, 8)}` 
                : 'Nova conversa'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="text-sm border rounded-md px-2 py-1"
          >
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
          
          <button
            onClick={handleRequestHandoff}
            className="text-sm text-primary hover:underline"
          >
            Falar com humano
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="w-12 h-12 text-gray-300 mb-2" />
            <p>Comece uma conversa com o assistente virtual</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${
                message.role === 'user' 
                  ? 'justify-end' 
                  : message.role === 'system'
                    ? 'justify-center'
                    : 'justify-start'
              }`}
            >
              {message.role === 'system' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-[80%] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-amber-800">{message.content}</p>
                </div>
              ) : (
                <div 
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200'
                    }`}
                  >
                    {message.role === 'user' 
                      ? <User className="w-5 h-5" /> 
                      : <Bot className="w-5 h-5" />}
                  </div>
                  
                  <div>
                    <div 
                      className={`rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-primary text-white' 
                          : 'bg-white border'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {message.role === 'assistant' && message.confidence !== undefined && (
                        <AIResponseIndicator confidence={message.confidence} />
                      )}
                      
                      {message.role === 'assistant' && (
                        <AIFeedback 
                          messageId={message.id} 
                          onSubmitFeedback={handleFeedback} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <p className="text-gray-500">Processando resposta...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-800">{error.message}</p>
                <p className="text-xs text-red-600">
                  {error.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="bg-white p-4 border-t">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div>
            {metrics.totalMessages > 0 && (
              <span>
                Confiança média: {(metrics.avgConfidence * 100).toFixed(0)}% | 
                Tempo de resposta: {metrics.responseTime.toFixed(1)}s
              </span>
            )}
          </div>
          <div>
            Powered by AI
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;