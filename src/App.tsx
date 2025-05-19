import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  BarChart2, 
  Settings, 
  UserCog,
  Filter,
  Ticket,
  Building2,
  Menu as MenuIcon,
  X,
  Mail,
  Bot,
  Headphones,
  LogOut,
  ChevronDown,
  ChevronRight,
  Book,
  Activity,
  Webhook,
  Code,
  Zap,
  Shield
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Tickets from './pages/Tickets';
import Customers from './pages/Customers';
import CRMFunnel from './pages/CRMFunnel';
import AIChat from './pages/AIChat';
import KnowledgeBase from './pages/KnowledgeBase';
import SettingsPage from './pages/Settings';
import UserManagement from './pages/UserManagement';
import CompanySettings from './pages/settings/CompanySettings';
import Channels from './pages/settings/Channels';
import Flows from './pages/settings/Flows';
import General from './pages/settings/General';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import Analytics from './pages/Analytics';
import AIAnalytics from './pages/AIAnalytics';
import AIAgentList from './pages/settings/AIAgentList';
import AIAgentDetail from './pages/settings/AIAgentDetail';
import AIAgentNew from './pages/settings/AIAgentNew';
import AIWebhooks from './pages/settings/AIWebhooks';
import WebhookManagement from './pages/settings/WebhookManagement';
import API from './pages/API';
import Integrations from './pages/settings/Integrations';
import Security from './pages/settings/Security';

function App() {
  const { session } = useAuth();
  const { loading: themeLoading } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const menuItems = [
    // Dashboard
    { icon: BarChart2, label: 'Dashboard', path: '/', category: 'principal' },
    
    // Atendimento
    { icon: MessageSquare, label: 'Conversas', path: '/conversations', category: 'atendimento' },
    { icon: Ticket, label: 'Tickets', path: '/tickets', category: 'atendimento' },
    { icon: Filter, label: 'Funil CRM', path: '/crm-funnel', category: 'atendimento' },
    
    // Inteligência
    { icon: Bot, label: 'Chat IA', path: '/ai-chat', category: 'inteligencia' },
    { icon: Book, label: 'Base de Conhecimento', path: '/knowledge-base', category: 'inteligencia' },
    
    // Analytics
    { icon: BarChart2, label: 'Analytics', path: '/analytics', category: 'analytics' },
    { icon: Activity, label: 'IA Analytics', path: '/ai-analytics', category: 'analytics' },
    
    // Configurações
    { icon: Building2, label: 'Empresa', path: '/settings/company', category: 'configuracoes' },
    { icon: UserCog, label: 'Usuários', path: '/users', category: 'configuracoes' },
    { icon: MessageSquare, label: 'Canais', path: '/settings/channels', category: 'configuracoes' },
    { icon: Filter, label: 'Fluxos', path: '/settings/flows', category: 'configuracoes' },
    { icon: Bot, label: 'Agentes IA', path: '/settings/ai-agents', category: 'configuracoes' },
    { icon: Activity, label: 'Eventos IA', path: '/settings/ai-webhooks', category: 'configuracoes' },
    { icon: Webhook, label: 'Webhooks', path: '/settings/webhooks', category: 'configuracoes' },
    { icon: Zap, label: 'Integrações', path: '/settings/integrations', category: 'configuracoes' },
    { icon: Shield, label: 'Segurança', path: '/settings/security', category: 'configuracoes' },
    { icon: Code, label: 'API', path: '/api', category: 'configuracoes' },
    
    // Clientes
    { icon: Users, label: 'Clientes', path: '/customers', category: 'clientes' },
  ];

  const categories = {
    principal: { label: 'Principal' },
    atendimento: { label: 'Atendimento' },
    inteligencia: { label: 'Inteligência' },
    analytics: { label: 'Analytics' },
    configuracoes: { label: 'Configurações' },
    clientes: { label: 'Clientes' }
  };

  if (!session) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  if (themeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            menuItems={menuItems} 
            categories={categories}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/crm-funnel" element={<CRMFunnel />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/company" element={<CompanySettings />} />
            <Route path="/settings/channels" element={<Channels />} />
            <Route path="/settings/flows" element={<Flows />} />
            <Route path="/settings/general" element={<General />} />
            <Route path="/settings/ai-agents" element={<AIAgentList />} />
            <Route path="/settings/ai-agents/:id" element={<AIAgentDetail />} />
            <Route path="/settings/ai-agents/new" element={<AIAgentNew />} />
            <Route path="/settings/ai-webhooks" element={<AIWebhooks />} />
            <Route path="/settings/webhooks" element={<WebhookManagement />} />
            <Route path="/settings/integrations" element={<Integrations />} />
            <Route path="/settings/security" element={<Security />} />
            <Route path="/api" element={<API />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai-analytics" element={<AIAnalytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;