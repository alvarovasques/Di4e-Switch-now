import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  BarChart2,
  Search, 
  Bot, 
  RefreshCw,
  MessageSquare,
  User,
  Zap,
  Gauge,
  FileText,
  Brain,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  Book,
  Users,
  HelpCircle,
  Info,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AIDashboardMetrics from '../components/AIDashboardMetrics';
import AIConversationHistory from '../components/AIConversationHistory';
import AISentimentAnalysis from '../components/AISentimentAnalysis';

export default function AIAnalytics() {
  const [period, setPeriod] = useState('lastMonth');
  const [loading, setLoading] = useState(true);
  const [aiMetrics, setAiMetrics] = useState({
    conversations: 0,
    avgConfidence: 0,
    responseTime: 0,
    handoffRate: 0,
    satisfactionRate: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'sentiment'>('overview');
  const [topTopics, setTopTopics] = useState<{topic: string, count: number, confidence: number}[]>([]);
  
  const [agentPerformance, setAgentPerformance] = useState<{
    id: string,
    name: string,
    conversations: number,
    successRate: number,
    handoffRate: number,
    avgResponseTime: string,
    satisfaction: number
  }[]>([]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // In a real app, you would fetch this data from your Supabase database
      // For now, we'll use mock data
      
      // Mock AI metrics
      setTimeout(() => {
        setAiMetrics({
          conversations: 1248,
          avgConfidence: 0.87,
          responseTime: 1.2,
          handoffRate: 0.15,
          satisfactionRate: 0.92
        });
        
        // Mock top topics
        setTopTopics([
          { topic: 'Suporte Técnico', count: 327, confidence: 0.92 },
          { topic: 'Dúvidas de Produto', count: 214, confidence: 0.85 },
          { topic: 'Faturamento', count: 187, confidence: 0.78 },
          { topic: 'Reclamações', count: 112, confidence: 0.62 },
          { topic: 'Integrações API', count: 96, confidence: 0.88 }
        ]);
        
        // Mock agent performance
        setAgentPerformance([
          {
            id: '1',
            name: 'Assistente Geral',
            conversations: 723,
            successRate: 87,
            handoffRate: 13,
            avgResponseTime: '1.2s',
            satisfaction: 4.3
          },
          {
            id: '2',
            name: 'Especialista Técnico',
            conversations: 325,
            successRate: 92,
            handoffRate: 8,
            avgResponseTime: '1.5s',
            satisfaction: 4.7
          },
          {
            id: '3',
            name: 'Assistente de Vendas',
            conversations: 200,
            successRate: 76,
            handoffRate: 24,
            avgResponseTime: '1.0s',
            satisfaction: 4.1
          }
        ]);
        
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Error fetching AI analytics data:", error);
      setLoading(false);
    }
  };
  
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };
  
  const getPeriodLabel = () => {
    switch(period) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Ontem';
      case 'lastWeek': return 'Últimos 7 dias';
      case 'lastMonth': return 'Últimos 30 dias';
      default: return 'Últimos 30 dias';
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics IA</h1>
          <p className="text-gray-600">Análise de desempenho e métricas dos assistentes virtuais</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="lastWeek">Últimos 7 dias</option>
              <option value="lastMonth">Últimos 30 dias</option>
            </select>
            
            <button
              onClick={() => fetchData()}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Atualizar dados"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          <button className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50">
            <Download className="w-5 h-5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'overview' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <BarChart2 className="w-4 h-4" />
              Visão Geral
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'conversations' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Conversas
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('sentiment')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'sentiment' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              Sentimento
            </span>
          </button>
        </div>
      </div>
      
      {/* Main dashboard metrics */}
      {activeTab === 'overview' && (
        <>
          <AIDashboardMetrics 
            metrics={aiMetrics} 
            period={getPeriodLabel()} 
            loading={loading} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Desempenho por Tópico
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-5">
                  {topTopics.map(topic => (
                    <div key={topic.topic}>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{topic.topic}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">{topic.count} conversas</span>
                        </div>
                        <div className="text-sm font-medium">
                          {Math.round(topic.confidence * 100)}%
                        </div>
                      </div>
                      
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            topic.confidence >= 0.9 ? 'bg-green-500' : 
                            topic.confidence >= 0.7 ? 'bg-blue-500' : 
                            topic.confidence >= 0.5 ? 'bg-yellow-500' : 
                            'bg-orange-500'
                          }`}
                          style={{ width: `${topic.confidence * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>
                          {topic.confidence >= 0.8 ? 'Alta confiança' : 
                          topic.confidence >= 0.6 ? 'Boa confiança' : 
                          'Confiança moderada'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Book className="w-3 h-3" />
                          <span>
                            {topic.confidence >= 0.8 ? 'Base de conhecimento completa' : 
                            topic.confidence >= 0.6 ? 'Base de conhecimento adequada' : 
                            'Melhorar base de conhecimento'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Agent Performance Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Desempenho dos Agentes
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase border-b">
                        <th className="px-3 py-2 text-left">Agente</th>
                        <th className="px-3 py-2 text-center">Conversas</th>
                        <th className="px-3 py-2 text-center">Sucesso</th>
                        <th className="px-3 py-2 text-center">Handoff</th>
                        <th className="px-3 py-2 text-center">Satisfação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {agentPerformance.map(agent => (
                        <tr key={agent.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium">{agent.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-sm">{agent.conversations}</td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center">
                              <span className="text-sm mr-1">{agent.successRate}%</span>
                              <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full" 
                                  style={{ width: `${agent.successRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center">
                              <span className="text-sm mr-1">{agent.handoffRate}%</span>
                              <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                                <div 
                                  className="bg-orange-500 h-1.5 rounded-full" 
                                  style={{ width: `${agent.handoffRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-3 h-3 ${i < Math.floor(agent.satisfaction) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                              ))}
                              <span className="ml-1 text-xs text-gray-500">({agent.satisfaction})</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Insights */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Insights e Recomendações</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">Melhor Performance</h4>
                    <p className="text-sm text-green-700 mt-1">
                      O agente "Especialista Técnico" teve um aumento de 4.2% na taxa de resolução em primeira resposta, 
                      atingindo 92% neste período.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-800">Oportunidade de Melhoria</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Detecção de baixa confiança em 28 conversas sobre "Integração de API". Considere adicionar mais exemplos neste tópico à base de conhecimento.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800">Treinamento da IA</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      32% das conversas foram resolvidas pela IA sem intervenção humana.
                      Há oportunidade para aumentar este número com base nos tópicos mais frequentes.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-800">Perguntas Frequentes</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Identificamos um aumento de 15% em dúvidas sobre "Faturamento" que estão sendo escaladas. Considere criar um chatbot específico para este tema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'conversations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Histórico de Conversas</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Filter className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <AIConversationHistory limit={10} showSearch={false} />
        </div>
      )}
      
      {activeTab === 'sentiment' && (
        <AISentimentAnalysis period="7d" />
      )}
      
      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between text-sm text-gray-600 border">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          <span>Dados atualizados em {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div>
          <button className="text-primary hover:underline flex items-center gap-1">
            <Download className="w-4 h-4" />
            Exportar dados
          </button>
        </div>
      </div>
    </div>
  );
}