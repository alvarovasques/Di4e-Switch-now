import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  ThumbsUp, 
  ThumbsDown, 
  Smile, 
  Frown, 
  Meh, 
  Calendar, 
  RefreshCw,
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  change: string;
  averageScore: number;
}

interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  average: number;
}

interface TopicSentiment {
  topic: string;
  positive: number;
  neutral: number;
  negative: number;
  average: number;
}

interface AISentimentAnalysisProps {
  period?: '24h' | '7d' | '30d' | '90d';
  conversationId?: string;
  agentId?: string;
  showFilters?: boolean;
}

export default function AISentimentAnalysis({ 
  period = '7d', 
  conversationId,
  agentId,
  showFilters = true
}: AISentimentAnalysisProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData>({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0,
    change: '+0%',
    averageScore: 0
  });
  const [sentimentTrend, setSentimentTrend] = useState<SentimentTrend[]>([]);
  const [topicSentiments, setTopicSentiments] = useState<TopicSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d'>(period);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSentimentData();
  }, [selectedPeriod, conversationId, agentId]);

  async function fetchSentimentData() {
    setLoading(true);
    
    try {
      // In a real implementation, this would fetch from the database
      // For this example, we'll generate mock data
      
      // Generate overall sentiment data
      const mockPositive = Math.floor(Math.random() * 300) + 200;
      const mockNeutral = Math.floor(Math.random() * 200) + 100;
      const mockNegative = Math.floor(Math.random() * 100) + 50;
      const mockTotal = mockPositive + mockNeutral + mockNegative;
      const mockChange = (Math.random() * 10 - 2).toFixed(1) + '%';
      const mockAverageScore = (Math.random() * 0.6 + 0.2).toFixed(2);
      
      setSentimentData({
        positive: mockPositive,
        neutral: mockNeutral,
        negative: mockNegative,
        total: mockTotal,
        change: (parseFloat(mockChange) >= 0 ? '+' : '') + mockChange,
        averageScore: parseFloat(mockAverageScore)
      });
      
      // Generate sentiment trend data
      const trendDays = selectedPeriod === '24h' ? 24 : 
                        selectedPeriod === '7d' ? 7 : 
                        selectedPeriod === '30d' ? 10 : 12;
      
      const mockTrend: SentimentTrend[] = [];
      
      for (let i = 0; i < trendDays; i++) {
        const date = new Date();
        if (selectedPeriod === '24h') {
          date.setHours(date.getHours() - (trendDays - i - 1));
          
          mockTrend.push({
            date: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            positive: Math.floor(Math.random() * 30) + 10,
            neutral: Math.floor(Math.random() * 20) + 5,
            negative: Math.floor(Math.random() * 10) + 1,
            average: parseFloat((Math.random() * 0.6 + 0.2).toFixed(2))
          });
        } else {
          date.setDate(date.getDate() - (trendDays - i - 1));
          
          mockTrend.push({
            date: date.toLocaleDateString([], {month: 'short', day: 'numeric'}),
            positive: Math.floor(Math.random() * 50) + 20,
            neutral: Math.floor(Math.random() * 30) + 10,
            negative: Math.floor(Math.random() * 20) + 5,
            average: parseFloat((Math.random() * 0.6 + 0.2).toFixed(2))
          });
        }
      }
      
      setSentimentTrend(mockTrend);
      
      // Generate topic sentiment data
      const topics = [
        'Suporte Técnico',
        'Dúvidas de Produto',
        'Faturamento',
        'Reclamações',
        'Solicitações',
        'Elogios'
      ];
      
      const mockTopics: TopicSentiment[] = topics.map(topic => ({
        topic,
        positive: Math.floor(Math.random() * 100),
        neutral: Math.floor(Math.random() * 60),
        negative: Math.floor(Math.random() * 40),
        average: parseFloat((Math.random() * 0.8 - 0.2).toFixed(2))
      }));
      
      setTopicSentiments(mockTopics);
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return <Smile className="w-5 h-5 text-green-500" />;
    if (score < -0.3) return <Frown className="w-5 h-5 text-red-500" />;
    return <Meh className="w-5 h-5 text-gray-500" />;
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-500';
    if (score < -0.3) return 'text-red-500';
    return 'text-gray-500';
  };

  const getSentimentTrendIcon = (change: string) => {
    const value = parseFloat(change);
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTopicSentimentColor = (average: number) => {
    if (average > 0.3) return 'bg-green-500';
    if (average < -0.3) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const filteredTopics = topicSentiments.filter(topic => 
    topic.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <BarChart2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-medium">Análise de Sentimento</h2>
          </div>
          
          {showFilters && (
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '24h' | '7d' | '30d' | '90d')}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
              
              <button
                onClick={fetchSentimentData}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                className="p-1.5 hover:bg-gray-100 rounded-lg"
                title="Exportar dados"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Overall Sentiment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Sentimento Geral</h3>
                <div className="flex items-center gap-1 text-sm">
                  {getSentimentTrendIcon(sentimentData.change)}
                  <span className={sentimentData.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                    {sentimentData.change}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                {getSentimentIcon(sentimentData.averageScore)}
                <div className="text-2xl font-semibold">
                  {sentimentData.averageScore > 0 ? '+' : ''}{sentimentData.averageScore}
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Baseado em {sentimentData.total} mensagens analisadas
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Distribuição de Sentimento</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs">Positivo</span>
                    </div>
                    <div className="text-xs font-medium">
                      {Math.round((sentimentData.positive / sentimentData.total) * 100)}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full" 
                      style={{ width: `${(sentimentData.positive / sentimentData.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Minus className="w-3 h-3 text-gray-500" />
                      <span className="text-xs">Neutro</span>
                    </div>
                    <div className="text-xs font-medium">
                      {Math.round((sentimentData.neutral / sentimentData.total) * 100)}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-gray-500 h-1.5 rounded-full" 
                      style={{ width: `${(sentimentData.neutral / sentimentData.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3 text-red-500" />
                      <span className="text-xs">Negativo</span>
                    </div>
                    <div className="text-xs font-medium">
                      {Math.round((sentimentData.negative / sentimentData.total) * 100)}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full" 
                      style={{ width: `${(sentimentData.negative / sentimentData.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Números Absolutos</h3>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-semibold text-green-700">{sentimentData.positive}</div>
                  <div className="text-xs text-green-600 mt-1">Positivo</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-semibold text-gray-700">{sentimentData.neutral}</div>
                  <div className="text-xs text-gray-600 mt-1">Neutro</div>
                </div>
                
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-semibold text-red-700">{sentimentData.negative}</div>
                  <div className="text-xs text-red-600 mt-1">Negativo</div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-xs text-gray-500">Total de mensagens</div>
                <div className="text-sm font-medium">{sentimentData.total}</div>
              </div>
            </div>
          </div>
          
          {/* Sentiment Trend */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-gray-700">Tendência de Sentimento</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Positivo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span>Neutro</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Negativo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Média</span>
                </div>
              </div>
            </div>
            
            <div className="h-64 relative">
              {/* This would be a real chart in a production app */}
              <div className="absolute inset-0 flex items-end">
                {sentimentTrend.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full h-48 flex items-end justify-center">
                      {/* Positive bar */}
                      <div 
                        className="w-3 bg-green-500 mx-0.5 rounded-t"
                        style={{ height: `${(day.positive / (day.positive + day.neutral + day.negative)) * 100}%` }}
                      ></div>
                      
                      {/* Neutral bar */}
                      <div 
                        className="w-3 bg-gray-400 mx-0.5 rounded-t"
                        style={{ height: `${(day.neutral / (day.positive + day.neutral + day.negative)) * 100}%` }}
                      ></div>
                      
                      {/* Negative bar */}
                      <div 
                        className="w-3 bg-red-500 mx-0.5 rounded-t"
                        style={{ height: `${(day.negative / (day.positive + day.neutral + day.negative)) * 100}%` }}
                      ></div>
                      
                      {/* Average line */}
                      <div 
                        className="absolute w-full border-t-2 border-blue-500 border-dashed pointer-events-none"
                        style={{ bottom: `${(day.average + 1) / 2 * 100}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{day.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Topic Sentiment */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Sentimento por Tópico</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar tópico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            {filteredTopics.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum tópico encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTopics.map((topic, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{topic.topic}</h4>
                      <div className="flex items-center gap-1">
                        {getSentimentIcon(topic.average)}
                        <span className={`text-sm ${getSentimentColor(topic.average)}`}>
                          {topic.average > 0 ? '+' : ''}{topic.average}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-green-500 h-full" 
                          style={{ width: `${(topic.positive / (topic.positive + topic.neutral + topic.negative)) * 100}%` }}
                        ></div>
                        <div 
                          className="bg-gray-400 h-full" 
                          style={{ width: `${(topic.neutral / (topic.positive + topic.neutral + topic.negative)) * 100}%` }}
                        ></div>
                        <div 
                          className="bg-red-500 h-full" 
                          style={{ width: `${(topic.negative / (topic.positive + topic.neutral + topic.negative)) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="w-16 text-right">
                        <span className="text-xs font-medium">
                          {topic.positive + topic.neutral + topic.negative} msgs
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>{Math.round((topic.positive / (topic.positive + topic.neutral + topic.negative)) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>{Math.round((topic.neutral / (topic.positive + topic.neutral + topic.negative)) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>{Math.round((topic.negative / (topic.positive + topic.neutral + topic.negative)) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-700">Sobre a Análise de Sentimento</h3>
                <p className="text-sm text-blue-600 mt-1">
                  A análise de sentimento utiliza processamento de linguagem natural para identificar a emoção predominante nas mensagens dos clientes. Isso ajuda a identificar problemas e melhorar a experiência do cliente.
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  O score varia de -1 (muito negativo) a +1 (muito positivo), com 0 representando um sentimento neutro.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}