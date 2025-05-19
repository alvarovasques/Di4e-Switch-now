import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart2, 
  Calendar, 
  Download, 
  TrendingUp, 
  Users, 
  Star, 
  MessageSquare, 
  BellRing, 
  Bot,
  Gauge,
  Clock,
  UserCheck
} from 'lucide-react';
import ConversationAnalytics from '../components/ConversationAnalytics';
import AIDashboardMetrics from '../components/AIDashboardMetrics';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<'conversations' | 'satisfaction' | 'ai' | 'teams' | 'agents'>('conversations');
  const [period, setPeriod] = useState<string>('month');
  const [loading, setLoading] = useState<boolean>(false);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    // Aqui você carregaria novos dados com base no período
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000); // Simula o tempo de carregamento
  };

  // Dados fictícios para a aba de IA
  const aiMetrics = {
    conversations: 743,
    avgConfidence: 0.87,
    responseTime: 1.2,
    handoffRate: 0.18,
    satisfactionRate: 0.93
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-600">Análise detalhada e métricas de desempenho</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              activeTab === 'conversations' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">Conversas</span>
          </button>
          
          <button
            onClick={() => setActiveTab('satisfaction')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              activeTab === 'satisfaction' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="hidden md:inline">Satisfação</span>
          </button>
          
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              activeTab === 'ai' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="hidden md:inline">IA</span>
          </button>
          
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              activeTab === 'teams' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">Times</span>
          </button>
          
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              activeTab === 'agents' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden md:inline">Agentes</span>
          </button>
        </div>
      </div>

      {activeTab === 'conversations' && (
        <ConversationAnalytics 
          loading={loading}
          period={period}
          onPeriodChange={handlePeriodChange}
        />
      )}
      
      {activeTab === 'ai' && (
        <AIDashboardMetrics 
          metrics={aiMetrics}
          period={
            period === 'today' ? 'Hoje' :
            period === 'week' ? 'Esta Semana' :
            period === 'month' ? 'Este Mês' : 
            period === 'quarter' ? 'Este Trimestre' : 'Todo Período'
          }
          loading={loading}
        />
      )}
      
      {activeTab === 'satisfaction' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Satisfação do Cliente</h2>
          <div className="flex items-center justify-center">
            <p className="text-gray-500">Conteúdo de Satisfação em desenvolvimento</p>
          </div>
        </div>
      )}
      
      {activeTab === 'teams' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Performance de Times</h2>
          <div className="flex items-center justify-center">
            <p className="text-gray-500">Conteúdo de Performance de Times em desenvolvimento</p>
          </div>
        </div>
      )}
      
      {activeTab === 'agents' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Desempenho de Agentes</h2>
          <div className="flex items-center justify-center">
            <p className="text-gray-500">Conteúdo de Desempenho de Agentes em desenvolvimento</p>
          </div>
        </div>
      )}
    </div>
  );
}