import React from 'react';
import { Bot, CheckCircle, ArrowUp, ArrowDown, Clock, TrendingUp, Zap, User, Gauge, MessageSquare } from 'lucide-react';

interface AIDashboardMetricsProps {
  metrics: {
    conversations: number;
    avgConfidence: number;
    responseTime: number;
    handoffRate: number;
    satisfactionRate: number;
  };
  period?: string;
  loading?: boolean;
}

export default function AIDashboardMetrics({ 
  metrics, 
  period = 'Últimos 30 dias', 
  loading = false 
}: AIDashboardMetricsProps) {
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Generate random change percentages for demo purposes
  // In a real app, these would be calculated from historical data
  const generateRandomChange = (isPositiveGood = true) => {
    const value = (Math.random() * 20 - (isPositiveGood ? 5 : 15)).toFixed(1);
    return {
      value: `${value}%`,
      isPositive: parseFloat(value) > 0,
      isGood: (parseFloat(value) > 0) === isPositiveGood
    };
  };
  
  const changes = {
    conversations: generateRandomChange(true),
    confidence: generateRandomChange(true),
    responseTime: generateRandomChange(false),
    handoffRate: generateRandomChange(false),
    satisfactionRate: generateRandomChange(true)
  };
  
  const metricCards = [
    {
      title: 'Conversas IA',
      value: metrics.conversations,
      icon: Bot,
      change: changes.conversations,
      color: 'text-blue-600'
    },
    {
      title: 'Confiança Média',
      value: `${(metrics.avgConfidence * 100).toFixed(0)}%`,
      icon: Gauge,
      change: changes.confidence,
      color: 'text-indigo-600'
    },
    {
      title: 'Tempo de Resposta',
      value: `${metrics.responseTime.toFixed(1)}s`,
      icon: Clock,
      change: changes.responseTime,
      color: 'text-green-600'
    },
    {
      title: 'Taxa de Handoff',
      value: `${(metrics.handoffRate * 100).toFixed(0)}%`,
      icon: User,
      change: changes.handoffRate,
      color: 'text-orange-600'
    },
    {
      title: 'Satisfação',
      value: `${(metrics.satisfactionRate * 100).toFixed(0)}%`,
      icon: CheckCircle,
      change: changes.satisfactionRate,
      color: 'text-green-600'
    }
  ];
  
  // Generate topic performance data
  const topics = [
    { name: 'Suporte Técnico', confidence: 92 },
    { name: 'Dúvidas de Produto', confidence: 85 },
    { name: 'Faturamento', confidence: 78 },
    { name: 'Reclamações', confidence: 62 }
  ];
  
  // Generate resource savings data
  const savings = [
    { title: 'Horas Economizadas', value: '42h', change: '+15%', icon: Clock },
    { title: 'Custo Reduzido', value: 'R$ 3.250', change: '+18%', icon: TrendingUp },
    { title: 'Tempo Médio IA', value: '45s', change: '-25%', icon: Zap },
    { title: 'Escalações Evitadas', value: '78', change: '+12%', icon: MessageSquare }
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">Desempenho da IA ({period})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {metricCards.map((metric) => (
            <div key={metric.title} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-full bg-gray-100">
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div className={`text-sm flex items-center gap-0.5 ${
                  metric.change.isGood ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metric.change.isPositive ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  <span>{metric.change.value}</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{metric.title}</p>
                <p className="text-xl font-semibold">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Performance por Tópico</h3>
          <div className="space-y-4">
            {topics.map(topic => (
              <div key={topic.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{topic.name}</span>
                  <span className="text-sm font-medium">{topic.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      topic.confidence >= 90 ? 'bg-green-500' : 
                      topic.confidence >= 80 ? 'bg-green-500' :
                      topic.confidence >= 70 ? 'bg-yellow-500' : 
                      'bg-orange-500'
                    }`} 
                    style={{ width: `${topic.confidence}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Economia de Recursos</h3>
          <div className="grid grid-cols-2 gap-4">
            {savings.map((item) => (
              <div key={item.title} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{item.title}</h3>
                <p className="text-2xl font-semibold">{item.value}</p>
                <div className="flex items-center text-green-500 text-sm mt-2">
                  {item.change.startsWith('+') ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  <span>{item.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Oportunidades de Melhoria</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg">
            <div className="p-3 bg-amber-100 rounded-full">
              <Bot className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h4 className="font-medium">Treinamento da IA</h4>
              <p className="text-sm text-gray-600 mt-1">
                Detecção de baixa confiança em 28 conversas sobre "Integração de API". Considere adicionar mais exemplos neste tópico à base de conhecimento.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h4 className="font-medium">Perguntas Frequentes</h4>
              <p className="text-sm text-gray-600 mt-1">
                Identificamos um aumento de 15% em dúvidas sobre "Faturamento" que estão sendo escaladas. Considere criar um chatbot específico para este tema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}