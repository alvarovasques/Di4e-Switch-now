import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  ArrowLeft, 
  Save, 
  Users, 
  Building2, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Department {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

export default function AIAgentNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_global: false,
    department_id: '',
    team_id: ''
  });

  useEffect(() => {
    fetchDepartments();
    fetchTeams();
  }, []);

  async function fetchDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create the AI agent
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          is_global: formData.is_global,
          department_id: formData.is_global ? null : formData.department_id || null,
          team_id: formData.is_global ? null : formData.team_id || null,
          settings: {
            greeting: 'Olá! Sou o assistente virtual. Como posso ajudar?',
            max_context_length: 10,
            temperature: 0.7,
            model: 'gpt-4o',
            prompt_template: 'Você é um assistente útil e amigável para a empresa. Responda às perguntas do cliente de maneira educada e profissional.',
            conversation_limit: 10
          },
          performance: {
            conversations_handled: 0,
            success_rate: 0,
            avg_resolution_time: '0s',
            handoff_rate: 0
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Create default settings for the new agent
      if (data) {
        const { error: settingsError } = await supabase
          .from('ai_agent_settings')
          .insert({
            agent_id: data.id,
            model_config: {
              model: 'gpt-4o',
              temperature: 0.7,
              max_tokens: 1000,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0
            },
            prompt_templates: {
              greeting: 'Olá! Sou o assistente virtual. Como posso ajudar?',
              system_prompt: 'Você é um assistente útil e amigável para a empresa. Responda às perguntas do cliente de maneira educada e profissional.',
              handoff_prompt: 'Parece que esta questão requer assistência especializada. Vou transferir você para um atendente humano.',
              fallback_prompt: 'Desculpe, não entendi completamente sua pergunta. Poderia reformulá-la?'
            },
            behavior_settings: {
              confidence_threshold: 0.7,
              max_conversation_turns: 10,
              auto_handoff_enabled: true,
              auto_handoff_threshold: 0.5,
              auto_handoff_after_turns: 5,
              use_knowledge_base: true,
              knowledge_base_weight: 0.8
            }
          });

        if (settingsError) {
          console.error('Error creating agent settings:', settingsError);
        }

        // Navigate to the agent detail page
        navigate(`/settings/ai-agents/${data.id}`);
      }
    } catch (err) {
      console.error('Error creating agent:', err);
      setError('Erro ao criar o agente');
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/settings/ai-agents')}
          className="mb-4 flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a lista</span>
        </button>
        
        <h1 className="text-2xl font-semibold text-gray-900">Novo Agente IA</h1>
        <p className="text-gray-600">Crie um novo assistente virtual de IA</p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-medium">Informações do Agente</h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Agente
              </label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Assistente de Suporte Técnico"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.is_active}
                    onChange={() => setFormData({...formData, is_active: true})}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span>Ativo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.is_active}
                    onChange={() => setFormData({...formData, is_active: false})}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span>Inativo</span>
                </label>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Descreva a função deste agente"
                rows={3}
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="is_global"
                  checked={formData.is_global}
                  onChange={(e) => setFormData({...formData, is_global: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_global" className="ml-2 block text-sm text-gray-700">
                  Agente global (atende a todos os departamentos e times)
                </label>
              </div>
            </div>
            
            {!formData.is_global && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <select
                    value={formData.team_id}
                    onChange={(e) => setFormData({...formData, team_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione um time</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-700">Sobre os Agentes IA</h3>
                <p className="text-sm text-blue-600 mt-1">
                  Após criar o agente, você poderá configurar suas preferências de modelo, comportamento e bases de conhecimento na página de detalhes.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Criar Agente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}