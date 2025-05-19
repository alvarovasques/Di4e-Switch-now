import React from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Plus,
  Info
} from 'lucide-react';

interface AnalyticsPeriod {
  label: string;
  value: string;
  active: boolean;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: string;
  positive?: boolean;
  icon: React.ElementType;
}

interface ChannelData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface TeamPerformance {
  team: string;
  conversations: number;
  response_time: string;
  resolution_rate: number;
  satisfaction: number;
}

interface ConversationAnalyticsProps {
  loading?: boolean;
  period?: string;
  onPeriodChange?: (period: string) => void;
}

export default function ConversationAnalytics({ loading = false, period = 'month', onPeriodChange }: ConversationAnalyticsProps) {
  const periods: AnalyticsPeriod[] = [
    { label: 'Hoje', value: 'today', active: period === 'today' },
    { label: 'Semana', value: 'week', active: period === 'week' },
    { label: 'Mês', value: 'month', active: period === 'month' },
    { label: 'Trimestre', value: 'quarter', active: period === 'quarter' }
  ];
  
  // Dados fictícios para demonstração
  const metrics: MetricCard[] = [
    { 
      title: 'Total de conversas', 
      value: '1,248', 
      change: '+12.5%', 
      positive: true,
      icon: MessageSquare 
    },
    { 
      title: 'Tempo médio de resposta', 
      value: '2.8 min', 
      change: '-8.3%', 
      positive: true,
      icon: Clock 
    },
    { 
      title: 'Taxa de resolução', 
      value: '94.2%', 
      change: '+2.1%', 
      positive: true,
      icon: CheckCircle 
    },
    { 
      title: 'Satisfação do cliente', 
      value: '4.7/5', 
      change: '+0.3', 
      positive: true,
      icon: User 
    }
  ];
  
  const channelData: ChannelData[] = [
    { name: 'WhatsApp', count: 562, percentage: 45, color: '#25D366' },
    { name: 'Webchat', count: 324, percentage: 26, color: '#3B82F6' },
    { name: 'Email', count: 186, percentage: 15, color: '#6366F1' },
    { name: 'Telegram', count: 176, percentage: 14, color: '#0088CC' }
  ];
  
  const teamPerformance: TeamPerformance[] = [
    { team: 'Suporte Técnico', conversations: 482, response_time: '2.4 min', resolution_rate: 96, satisfaction: 4.8 },
    { team: 'Vendas', conversations: 345, response_time: '3.1 min', resolution_rate: 92, satisfaction: 4.6 },
    { team: 'Atendimento', conversations: 287, response_time: '1.8 min', resolution_rate: 95, satisfaction: 4.7 },
    { team: 'Financeiro', conversations: 134, response_time: '4.2 min', resolution_rate: 91, satisfaction: 4.5 }
  ];
  
  // Dados fictícios para o gráfico de volume diário
  const dailyVolume = [
    { day: 'Seg', count: 165, ai: 72 },
    { day: 'Ter', count: 142, ai: 65 },
    { day: 'Qua', count: 187, ai: 81 },
    { day: 'Qui', count: 156, ai: 68 },
    { day: 'Sex', count: 197, ai: 89 },
    { day: 'Sáb', count: 98, ai: 42 },
    { day: 'Dom', count: 65, ai: 32 }
  ];
  
  // Dados de SLA
  const slaData = {
    onTarget: 92,
    atRisk: 6,
    breached: 2,
    totalTickets: 850,
    firstResponseAvg: '12min',
    resolutionTimeAvg: '4h 12min'
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Análise de Conversas</h2>
        
        <div className="flex items-center gap-2">
          <div className="rounded-lg border p-1 flex">
            {periods.map(p => (
              <button
                key={p.value}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  p.active 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => onPeriodChange && onPeriodChange(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Filtrar">
            <Filter className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Exportar relatório">
            <Download className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Criar relatório personalizado">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-gray-100 rounded-full">
                <metric.icon className="h-5 w-5 text-primary" />
              </div>
              <div className={`text-xs font-medium ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change}
              </div>
            </div>
            <div className="mt-1">
              <p className="text-sm text-gray-500">{metric.title}</p>
              <p className="text-xl font-semibold">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por canal */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-medium">Distribuição por Canal</h3>
            <div className="text-xs text-gray-500">Total: {channelData.reduce((sum, channel) => sum + channel.count, 0)} conversas</div>
          </div>
          
          <div className="space-y-4">
            {channelData.map(channel => (
              <div key={channel.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{channel.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{channel.count} conversas</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{channel.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${channel.percentage}%`, backgroundColor: channel.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Volume de conversas diário */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-medium">Volume de Conversas</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs">Total</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary/30"></div>
                <span className="text-xs">IA</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-end h-48 gap-2">
            {dailyVolume.map(day => {
              const maxValue = Math.max(...dailyVolume.map(d => d.count));
              const barHeight = (day.count / maxValue) * 100;
              const aiBarHeight = (day.ai / maxValue) * 100;
              
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative flex justify-center" style={{ height: `${barHeight}%` }}>
                    <div className="w-full bg-primary/30 rounded-t"></div>
                    <div 
                      className="absolute bottom-0 w-full bg-primary rounded-t" 
                      style={{ height: `${aiBarHeight}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* SLA e Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SLA Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-medium mb-4">Status de SLA</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">No prazo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{slaData.onTarget}%</span>
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {Math.round(slaData.totalTickets * (slaData.onTarget/100))} tickets
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm">Em risco</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{slaData.atRisk}%</span>
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {Math.round(slaData.totalTickets * (slaData.atRisk/100))} tickets
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Violado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{slaData.breached}%</span>
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {Math.round(slaData.totalTickets * (slaData.breached/100))} tickets
                </span>
              </div>
            </div>
            
            <div className="w-full h-3 bg-gray-100 rounded-full mt-3">
              <div className="flex h-full rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${slaData.onTarget}%` }}></div>
                <div className="bg-yellow-500 h-full" style={{ width: `${slaData.atRisk}%` }}></div>
                <div className="bg-red-500 h-full" style={{ width: `${slaData.breached}%` }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Tempo médio 1ª resposta</div>
                <div className="font-medium">{slaData.firstResponseAvg}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Tempo médio resolução</div>
                <div className="font-medium">{slaData.resolutionTimeAvg}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance das Equipes */}
        <div className="bg-white rounded-lg shadow p-6 col-span-1 lg:col-span-2">
          <h3 className="text-base font-medium mb-4">Performance das Equipes</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-2 text-left">Equipe</th>
                  <th className="px-4 py-2 text-center">Conversas</th>
                  <th className="px-4 py-2 text-center">Tempo Resp.</th>
                  <th className="px-4 py-2 text-center">Taxa Resolução</th>
                  <th className="px-4 py-2 text-center">Satisfação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teamPerformance.map(team => (
                  <tr key={team.team} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{team.team}</td>
                    <td className="px-4 py-3 text-sm text-center">{team.conversations}</td>
                    <td className="px-4 py-3 text-sm text-center">{team.response_time}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center">
                        <span className="text-sm mr-2">{team.resolution_rate}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${team.resolution_rate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3 h-3 ${i < Math.floor(team.satisfaction) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                      <span className="ml-2 text-xs">{team.satisfaction}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              <BarChart2 className="w-4 h-4" />
              Ver relatório detalhado
            </button>
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-medium mb-4">Insights e Recomendações</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">Melhor Performance</h4>
                <p className="text-sm text-green-700 mt-1">
                  A equipe de Suporte Técnico teve um aumento de 4.2% na taxa de resolução em primeira resposta, 
                  atingindo 96% neste período.
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
                  O tempo médio de resposta da equipe de Financeiro está 38% acima da meta estabelecida.
                  Recomenda-se revisão dos processos ou realocação de recursos.
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
                <h4 className="font-medium text-blue-800">Automação com IA</h4>
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
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-purple-800">Padrões Temporais</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Identificamos um aumento de 23% no volume de atendimentos às segundas-feiras.
                  Considere reforçar a equipe neste dia da semana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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

// Add missing imports
import { Bot } from 'lucide-react';