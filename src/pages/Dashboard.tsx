import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  BarChart2,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Ticket,
  CheckCircle,
  AlertCircle,
  Bot,
  User,
  HeartPulse,
  Star,
  Zap,
  PieChart,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AIDashboardMetrics from '../components/AIDashboardMetrics';

interface DashboardMetrics {
  activeConversations: number;
  totalCustomers: number;
  avgResponseTime: string;
  resolutionRate: number;
  ticketMetrics: {
    total: number;
    open: number;
    resolved: number;
    responseTime: string;
    satisfactionRate: number;
  };
  aiMetrics: {
    conversations: number;
    resolutionRate: number;
    avgConfidence: number;
    handoffRate: number;
  };
  channelDistribution: {
    whatsapp: number;
    email: number;
    webchat: number;
    telegram: number;
  };
  slaMetrics: {
    breaches: number;
    atRisk: number;
    onTarget: number;
  };
}

const defaultMetrics: DashboardMetrics = {
  activeConversations: 0,
  totalCustomers: 0,
  avgResponseTime: '0m',
  resolutionRate: 0,
  ticketMetrics: {
    total: 0,
    open: 0,
    resolved: 0,
    responseTime: '0m',
    satisfactionRate: 0
  },
  aiMetrics: {
    conversations: 0,
    resolutionRate: 0,
    avgConfidence: 0,
    handoffRate: 0
  },
  channelDistribution: {
    whatsapp: 0,
    email: 0,
    webchat: 0,
    telegram: 0
  },
  slaMetrics: {
    breaches: 0,
    atRisk: 0,
    onTarget: 0
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch active conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, status, conversation_type, channel_type, ai_confidence, created_at, updated_at');

      // Get conversations created in the selected period
      let filteredConversations = conversations || [];
      if (period === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredConversations = conversations.filter(c => new Date(c.created_at) >= today) || [];
      } else if (period === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredConversations = conversations.filter(c => 
          new Date(c.created_at) >= yesterday && new Date(c.created_at) < today
        ) || [];
      } else if (period === 'last7days') {
        const last7days = new Date();
        last7days.setDate(last7days.getDate() - 7);
        filteredConversations = conversations.filter(c => new Date(c.created_at) >= last7days) || [];
      }

      // Fetch total customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id');

      // Fetch tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, status, created_at, updated_at');

      // Calculate channel distribution
      const channelDistribution = {
        whatsapp: filteredConversations.filter(c => c.channel_type === 'whatsapp').length,
        email: filteredConversations.filter(c => c.channel_type === 'email').length,
        webchat: filteredConversations.filter(c => c.channel_type === 'webchat').length,
        telegram: filteredConversations.filter(c => c.channel_type === 'telegram').length
      };

      // Calculate AI metrics
      const aiConversations = filteredConversations.filter(c => c.conversation_type === 'ai_chat');
      const aiResolved = aiConversations.filter(c => c.status === 'resolved').length;
      
      const newMetrics: DashboardMetrics = {
        activeConversations: filteredConversations.filter(c => c.status === 'open' || c.status === 'active').length,
        totalCustomers: customers?.length || 0,
        avgResponseTime: '2.4m',
        resolutionRate: filteredConversations.length > 0 
          ? (filteredConversations.filter(c => c.status === 'resolved' || c.status === 'closed').length / filteredConversations.length) * 100 
          : 0,
        ticketMetrics: {
          total: tickets?.length || 0,
          open: tickets?.filter(t => t.status === 'open').length || 0,
          resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
          responseTime: '2.5h',
          satisfactionRate: 95
        },
        aiMetrics: {
          conversations: aiConversations.length,
          resolutionRate: aiConversations.length > 0 ? (aiResolved / aiConversations.length) * 100 : 0,
          avgConfidence: aiConversations.length > 0 
            ? aiConversations.reduce((sum, conv) => sum + (conv.ai_confidence || 0), 0) / aiConversations.length
            : 0,
          handoffRate: aiConversations.length > 0
            ? (aiConversations.filter(c => c.status === 'open' && !c.ai_confidence).length / aiConversations.length) * 100
            : 0
        },
        channelDistribution,
        slaMetrics: {
          breaches: Math.floor(Math.random() * 5), // Mock data
          atRisk: Math.floor(Math.random() * 10), // Mock data
          onTarget: Math.floor(Math.random() * 50) // Mock data
        }
      };

      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics().finally(() => {
      setRefreshing(false);
    });
  };

  const handleExportReport = () => {
    const reportData = {
      period,
      metrics,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${period}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      icon: MessageSquare,
      label: 'Conversas Ativas',
      value: metrics.activeConversations.toString(),
      change: '+12%',
      onClick: () => navigate('/conversations?status=active'),
    },
    {
      icon: Users,
      label: 'Total de Clientes',
      value: metrics.totalCustomers.toString(),
      change: '+3.2%',
      onClick: () => navigate('/customers'),
    },
    {
      icon: Ticket,
      label: 'Tickets Abertos',
      value: metrics.ticketMetrics.open.toString(),
      change: '-8%',
      onClick: () => navigate('/tickets?status=open'),
    },
    {
      icon: CheckCircle,
      label: 'Taxa de Resolução',
      value: `${metrics.resolutionRate.toFixed(1)}%`,
      change: '+5.3%',
      onClick: () => navigate('/tickets?status=resolved'),
    },
  ];

  const aiStats = [
    {
      icon: Bot,
      label: 'Atendimentos IA',
      value: metrics.aiMetrics.conversations.toString(),
      change: '+25%',
      onClick: () => navigate('/conversations?type=ai_chat'),
    },
    {
      icon: HeartPulse,
      label: 'Taxa de Resolução IA',
      value: `${metrics.aiMetrics.resolutionRate.toFixed(1)}%`,
      change: '+18.2%',
    },
    {
      icon: Zap,
      label: 'Confiança Média',
      value: `${(metrics.aiMetrics.avgConfidence * 100).toFixed(1)}%`,
      change: '+2.5%',
    },
    {
      icon: User,
      label: 'Taxa de Handoff',
      value: `${metrics.aiMetrics.handoffRate.toFixed(1)}%`,
      change: '-5%',
    },
  ];

  const ticketStats = [
    {
      icon: AlertCircle,
      label: 'Tickets Urgentes',
      value: '5',
      change: '+2',
      color: 'text-red-600',
    },
    {
      icon: Clock,
      label: 'Tempo Médio de Resposta',
      value: metrics.ticketMetrics.responseTime,
      change: '-15%',
      color: 'text-green-600',
    },
    {
      icon: Star,
      label: 'Taxa de Satisfação',
      value: `${metrics.ticketMetrics.satisfactionRate}%`,
      change: '+2.1%',
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Acompanhe as métricas do seu atendimento</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full sm:w-auto border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="last7days">Últimos 7 dias</option>
              <option value="last30days">Últimos 30 dias</option>
              <option value="thisMonth">Este mês</option>
              <option value="lastMonth">Mês passado</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Atualizar</span>
          </button>

          <button
            onClick={handleExportReport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Exportar Relatório</span>
            <span className="sm:hidden">Exportar</span>
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'overview' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'ai' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Métricas de IA
          </button>
          <button 
            onClick={() => setActiveTab('sla')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'sla' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            SLA
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    onClick={stat.onClick}
                    className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-6 h-6 text-primary" />
                      <span className={`text-sm flex items-center gap-1 ${
                        stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {stat.change.startsWith('+') ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-gray-500 text-sm">{stat.label}</h3>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-6">Métricas de Tickets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ticketStats.map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-semibold">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <span className={`text-sm flex items-center justify-center gap-1 mt-2 ${
                          stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {stat.change.startsWith('+') ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {stat.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-6">Distribuição por Canal</h2>
                  <div className="flex items-center justify-between">
                    <div className="space-y-4 w-full">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>WhatsApp</span>
                          <span>{metrics.channelDistribution.whatsapp} conversas</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (metrics.channelDistribution.whatsapp / 
                                (metrics.channelDistribution.whatsapp + 
                                metrics.channelDistribution.email + 
                                metrics.channelDistribution.webchat + 
                                metrics.channelDistribution.telegram) || 1) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Email</span>
                          <span>{metrics.channelDistribution.email} conversas</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (metrics.channelDistribution.email / 
                                (metrics.channelDistribution.whatsapp + 
                                metrics.channelDistribution.email + 
                                metrics.channelDistribution.webchat + 
                                metrics.channelDistribution.telegram) || 1) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>WebChat</span>
                          <span>{metrics.channelDistribution.webchat} conversas</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (metrics.channelDistribution.webchat / 
                                (metrics.channelDistribution.whatsapp + 
                                metrics.channelDistribution.email + 
                                metrics.channelDistribution.webchat + 
                                metrics.channelDistribution.telegram) || 1) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Telegram</span>
                          <span>{metrics.channelDistribution.telegram} conversas</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (metrics.channelDistribution.telegram / 
                                (metrics.channelDistribution.whatsapp + 
                                metrics.channelDistribution.email + 
                                metrics.channelDistribution.webchat + 
                                metrics.channelDistribution.telegram) || 1) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-medium">Visão Geral da Operação</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Tickets Criados</h3>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-semibold">{metrics.ticketMetrics.total}</p>
                        <div className="flex items-center text-green-500 text-sm">
                          <ArrowUp className="w-4 h-4" />
                          <span>12%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Tickets Resolvidos</h3>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-semibold">{metrics.ticketMetrics.resolved}</p>
                        <div className="flex items-center text-green-500 text-sm">
                          <ArrowUp className="w-4 h-4" />
                          <span>8%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Tempo de Resolução</h3>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-semibold">3.2h</p>
                        <div className="flex items-center text-green-500 text-sm">
                          <ArrowDown className="w-4 h-4" />
                          <span>5%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'ai' && (
            <AIDashboardMetrics 
              metrics={{
                conversations: metrics.aiMetrics.conversations,
                avgConfidence: metrics.aiMetrics.avgConfidence,
                responseTime: 1.2, // Example value
                handoffRate: metrics.aiMetrics.handoffRate / 100,
                satisfactionRate: 0.92 // Example value
              }}
              period={
                period === 'today' ? 'Hoje' :
                period === 'yesterday' ? 'Ontem' :
                period === 'last7days' ? 'Últimos 7 dias' :
                'Últimos 30 dias'
              }
              loading={loading}
            />
          )}

          {activeTab === 'sla' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <span className="text-sm text-red-500 font-medium">Atenção</span>
                  </div>
                  <h3 className="text-xl font-semibold">{metrics.slaMetrics.breaches}</h3>
                  <p className="text-gray-500 text-sm mt-1">SLAs violados</p>
                  <div className="mt-4">
                    <button 
                      className="text-sm text-primary font-medium"
                      onClick={() => navigate('/conversations?sla=breached')}
                    >
                      Ver conversas
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-100 rounded-full">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-sm text-amber-500 font-medium">Atenção</span>
                  </div>
                  <h3 className="text-xl font-semibold">{metrics.slaMetrics.atRisk}</h3>
                  <p className="text-gray-500 text-sm mt-1">SLAs em risco</p>
                  <div className="mt-4">
                    <button 
                      className="text-sm text-primary font-medium"
                      onClick={() => navigate('/conversations?sla=at_risk')}
                    >
                      Ver conversas
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <span className="text-sm text-green-500 font-medium">No prazo</span>
                  </div>
                  <h3 className="text-xl font-semibold">{metrics.slaMetrics.onTarget}</h3>
                  <p className="text-gray-500 text-sm mt-1">SLAs no prazo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-6">Performance por Departamento</h2>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Suporte</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Vendas</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Financeiro</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Técnico</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-6">SLA por Prioridade</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Baixa</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-semibold">98%</div>
                        <div className="text-xs text-green-500">+2%</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">SLA: 24h</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Média</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-semibold">92%</div>
                        <div className="text-xs text-green-500">+1%</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">SLA: 8h</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Alta</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-semibold">85%</div>
                        <div className="text-xs text-red-500">-3%</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">SLA: 4h</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Urgente</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-semibold">78%</div>
                        <div className="text-xs text-red-500">-5%</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">SLA: 1h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}