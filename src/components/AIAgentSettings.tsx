import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bot, 
  Save, 
  Book, 
  Zap, 
  AlertCircle, 
  MessageSquare,
  Code,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AIAgentSettingsProps {
  agentId: string;
  onSave?: () => void;
  initialData?: any;
  showHeader?: boolean;
}

interface ModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

interface PromptTemplates {
  greeting: string;
  system_prompt: string;
  handoff_prompt: string;
  fallback_prompt: string;
}

interface BehaviorSettings {
  confidence_threshold: number;
  max_conversation_turns: number;
  auto_handoff_enabled: boolean;
  auto_handoff_threshold: number;
  auto_handoff_after_turns: number;
  use_knowledge_base: boolean;
  knowledge_base_weight: number;
}

interface FormData {
  model_config: ModelConfig;
  prompt_templates: PromptTemplates;
  behavior_settings: BehaviorSettings;
}

const defaultFormData: FormData = {
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
};

export default function AIAgentSettings({ 
  agentId, 
  onSave, 
  initialData,
  showHeader = true 
}: AIAgentSettingsProps) {
  const [activeTab, setActiveTab] = useState<'model' | 'prompts' | 'behavior'>('model');
  const [formData, setFormData] = useState<FormData>(initialData || defaultFormData);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!initialData) {
      fetchSettings();
    } else {
      setFormData(initialData);
    }
  }, [agentId, initialData]);

  async function fetchSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_agent_settings')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        setFormData({
          model_config: data.model_config,
          prompt_templates: data.prompt_templates,
          behavior_settings: data.behavior_settings
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      // Check if settings already exist
      const { data: existingData } = await supabase
        .from('ai_agent_settings')
        .select('id')
        .eq('agent_id', agentId)
        .maybeSingle();

      let error;
      if (existingData) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('ai_agent_settings')
          .update({
            model_config: formData.model_config,
            prompt_templates: formData.prompt_templates,
            behavior_settings: formData.behavior_settings,
            updated_at: new Date().toISOString()
          })
          .eq('agent_id', agentId);
        
        error = updateError;
      } else {
        // Create new settings
        const { error: insertError } = await supabase
          .from('ai_agent_settings')
          .insert({
            agent_id: agentId,
            model_config: formData.model_config,
            prompt_templates: formData.prompt_templates,
            behavior_settings: formData.behavior_settings
          });
        
        error = insertError;
      }

      if (error) throw error;
      
      setSaved(true);
      if (onSave) onSave();
      
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (
    section: keyof FormData, 
    field: string, 
    value: string | number | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {showHeader && (
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-full">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-medium">Configurações do Agente IA</h2>
          </div>
          <div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                saved 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-primary text-white hover:bg-primary-dark'
              } transition-colors`}
            >
              {saved ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="border-b">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('model')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'model' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Configurações de Modelo
          </button>
          <button 
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'prompts' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Templates de Prompts
          </button>
          <button 
            onClick={() => setActiveTab('behavior')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'behavior' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Comportamento
          </button>
        </div>
      </div>

      <form className="p-6 space-y-6">
        {activeTab === 'model' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <select
                value={formData.model_config.model}
                onChange={(e) => handleChange('model_config', 'model', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="gpt-4o">GPT-4o (Recomendado)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                O modelo define a qualidade das respostas e capacidades do agente de IA.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperatura <span className="text-sm font-normal text-gray-500">(0 - 1)</span>
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1"
                  value={formData.model_config.temperature}
                  onChange={(e) => handleChange('model_config', 'temperature', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded w-12 text-center">
                  {formData.model_config.temperature}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Preciso e determinístico</span>
                <span>Criativo e variado</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tokens Máximos
              </label>
              <input 
                type="number" 
                min="100" 
                max="4000"
                value={formData.model_config.max_tokens}
                onChange={(e) => handleChange('model_config', 'max_tokens', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-gray-500">
                Define o tamanho máximo da resposta gerada.
              </p>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Configurações Avançadas</h3>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <div className="absolute right-0 bottom-6 w-64 bg-black text-white text-xs rounded p-2 hidden group-hover:block">
                    Estas configurações afetam a maneira como o modelo gera texto. Recomendamos manter os valores padrão a menos que você entenda o impacto destas alterações.
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Top P
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={formData.model_config.top_p}
                    onChange={(e) => handleChange('model_config', 'top_p', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Frequency Penalty
                  </label>
                  <input 
                    type="number" 
                    min="-2" 
                    max="2" 
                    step="0.1"
                    value={formData.model_config.frequency_penalty}
                    onChange={(e) => handleChange('model_config', 'frequency_penalty', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Presence Penalty
                  </label>
                  <input 
                    type="number" 
                    min="-2" 
                    max="2" 
                    step="0.1"
                    value={formData.model_config.presence_penalty}
                    onChange={(e) => handleChange('model_config', 'presence_penalty', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Mensagem de Saudação
                </label>
                <div className="text-xs text-gray-500">
                  Primeira mensagem enviada ao cliente
                </div>
              </div>
              <textarea
                value={formData.prompt_templates.greeting}
                onChange={(e) => handleChange('prompt_templates', 'greeting', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Olá! Sou o assistente virtual. Como posso ajudar?"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Sistema (Instruções do Agente)
                </label>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  Não visível para o cliente
                </div>
              </div>
              <textarea
                value={formData.prompt_templates.system_prompt}
                onChange={(e) => handleChange('prompt_templates', 'system_prompt', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="Você é um assistente virtual para a empresa XYZ..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Estas instruções definem a personalidade, conhecimentos e limitações do agente de IA.
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Mensagem de Transferência
                </label>
                <div className="text-xs text-gray-500">
                  Enviada quando uma conversa é transferida para um humano
                </div>
              </div>
              <textarea
                value={formData.prompt_templates.handoff_prompt}
                onChange={(e) => handleChange('prompt_templates', 'handoff_prompt', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Parece que esta questão requer assistência especializada..."
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Mensagem de Fallback
                </label>
                <div className="text-xs text-gray-500">
                  Usada quando o agente não consegue entender a pergunta
                </div>
              </div>
              <textarea
                value={formData.prompt_templates.fallback_prompt}
                onChange={(e) => handleChange('prompt_templates', 'fallback_prompt', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Desculpe, não entendi completamente sua pergunta..."
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="p-2 bg-blue-100 rounded-full mt-1">
                  <Code className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Variáveis disponíveis</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Você pode usar estas variáveis nos seus templates:
                  </p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <code className="bg-gray-100 px-2 py-1 rounded">&#123;&#123;customer_name&#125;&#125;</code>
                    <span className="text-gray-600">Nome do cliente</span>
                    
                    <code className="bg-gray-100 px-2 py-1 rounded">&#123;&#123;agent_name&#125;&#125;</code>
                    <span className="text-gray-600">Nome do agente</span>
                    
                    <code className="bg-gray-100 px-2 py-1 rounded">&#123;&#123;company_name&#125;&#125;</code>
                    <span className="text-gray-600">Nome da empresa</span>
                    
                    <code className="bg-gray-100 px-2 py-1 rounded">&#123;&#123;date&#125;&#125;</code>
                    <span className="text-gray-600">Data atual</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'behavior' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Threshold de Confiança
                </label>
                <div className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                  {formData.behavior_settings.confidence_threshold * 100}%
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.05"
                  value={formData.behavior_settings.confidence_threshold}
                  onChange={(e) => handleChange('behavior_settings', 'confidence_threshold', parseFloat(e.target.value))}
                  className="flex-1"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Define o nível mínimo de confiança para o agente responder sem transferir.
              </p>
            </div>
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ativar Transferência Automática
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  O agente transferirá automaticamente para um humano em casos de baixa confiança
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.behavior_settings.auto_handoff_enabled}
                  onChange={(e) => handleChange('behavior_settings', 'auto_handoff_enabled', e.target.checked)}
                  className="sr-only"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {formData.behavior_settings.auto_handoff_enabled && (
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Threshold de Transferência
                    </label>
                    <div className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                      {formData.behavior_settings.auto_handoff_threshold * 100}%
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.05"
                    value={formData.behavior_settings.auto_handoff_threshold}
                    onChange={(e) => handleChange('behavior_settings', 'auto_handoff_threshold', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Se a confiança do agente estiver abaixo deste valor, a conversa será transferida.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Turnos de Conversa
                  </label>
                  <div className="flex rounded-lg overflow-hidden">
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      value={formData.behavior_settings.max_conversation_turns}
                      onChange={(e) => handleChange('behavior_settings', 'max_conversation_turns', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border-y border-l rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="bg-gray-100 text-gray-700 px-3 flex items-center border-y border-r rounded-r-lg">
                      turnos
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Número máximo de turnos antes que a conversa seja considerada complexa demais.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transferência Após Turnos
                  </label>
                  <div className="flex rounded-lg overflow-hidden">
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      value={formData.behavior_settings.auto_handoff_after_turns}
                      onChange={(e) => handleChange('behavior_settings', 'auto_handoff_after_turns', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border-y border-l rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="bg-gray-100 text-gray-700 px-3 flex items-center border-y border-r rounded-r-lg">
                      turnos
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Transfere automaticamente após este número de turnos, independente da confiança.
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Usar Base de Conhecimento
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    O agente usará a base de conhecimento para responder às perguntas
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.behavior_settings.use_knowledge_base}
                    onChange={(e) => handleChange('behavior_settings', 'use_knowledge_base', e.target.checked)}
                    className="sr-only"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                  peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                  after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                  after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {formData.behavior_settings.use_knowledge_base && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Peso da Base de Conhecimento
                    </label>
                    <div className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                      {formData.behavior_settings.knowledge_base_weight * 100}%
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.05"
                    value={formData.behavior_settings.knowledge_base_weight}
                    onChange={(e) => handleChange('behavior_settings', 'knowledge_base_weight', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Define quanto a base de conhecimento deve influenciar nas respostas do agente.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Book className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800">Dica de Configuração</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Para obter melhores resultados:
                  </p>
                  <ul className="mt-2 text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>Use um threshold de confiança maior para assuntos complexos</li>
                    <li>Aumente o peso da base de conhecimento para respostas mais precisas</li>
                    <li>Reduza a temperatura para respostas mais consistentes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              saved 
                ? 'bg-green-100 text-green-700' 
                : 'bg-primary text-white hover:bg-primary-dark'
            } transition-colors`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : saved ? (
              <>
                <Save className="w-4 h-4" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}