import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Save, 
  Zap, 
  Book, 
  Settings, 
  MessageSquare, 
  BrainCircuit,
  Gauge,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AIAgentAdvancedSettingsProps {
  agentId: string;
  onSave?: () => void;
  initialData?: any;
  showHeader?: boolean;
}

export default function AIAgentAdvancedSettings({
  agentId,
  onSave,
  initialData,
  showHeader = true
}: AIAgentAdvancedSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'model' | 'behavior' | 'knowledge'>('model');
  const [settings, setSettings] = useState({
    model_config: {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    },
    behavior_settings: {
      confidence_threshold: 0.7,
      max_conversation_turns: 10,
      auto_handoff_enabled: true,
      auto_handoff_threshold: 0.5,
      auto_handoff_after_turns: 5,
      use_knowledge_base: true,
      knowledge_base_weight: 0.8
    },
    knowledge_bases: [] as string[]
  });

  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (initialData) {
      setSettings(initialData);
    } else {
      fetchSettings();
    }
    fetchKnowledgeBases();
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
        setSettings({
          model_config: data.model_config,
          behavior_settings: data.behavior_settings,
          knowledge_bases: []
        });
      }

      // Fetch knowledge bases linked to this agent
      const { data: agentKBs, error: kbError } = await supabase
        .from('agent_knowledge_bases')
        .select('knowledge_base_id')
        .eq('agent_id', agentId);

      if (kbError) {
        console.error('Error fetching agent knowledge bases:', kbError);
        return;
      }

      if (agentKBs) {
        setSettings(prev => ({
          ...prev,
          knowledge_bases: agentKBs.map(kb => kb.knowledge_base_id)
        }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchKnowledgeBases() {
    try {
      const { data, error } = await supabase
        .from('knowledge_bases')
        .select('id, name')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching knowledge bases:', error);
        return;
      }

      setAvailableKnowledgeBases(data || []);
    } catch (err) {
      console.error('Error fetching knowledge bases:', err);
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
            model_config: settings.model_config,
            behavior_settings: settings.behavior_settings,
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
            model_config: settings.model_config,
            behavior_settings: settings.behavior_settings
          });
        
        error = insertError;
      }

      if (error) throw error;

      // Update knowledge base associations
      // First, remove all existing associations
      const { error: deleteError } = await supabase
        .from('agent_knowledge_bases')
        .delete()
        .eq('agent_id', agentId);

      if (deleteError) throw deleteError;

      // Then, add new associations
      if (settings.knowledge_bases.length > 0) {
        const kbInserts = settings.knowledge_bases.map(kbId => ({
          agent_id: agentId,
          knowledge_base_id: kbId
        }));

        const { error: insertKbError } = await supabase
          .from('agent_knowledge_bases')
          .insert(kbInserts);

        if (insertKbError) throw insertKbError;
      }
      
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

  const handleModelChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      model_config: {
        ...prev.model_config,
        [field]: value
      }
    }));
  };

  const handleBehaviorChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      behavior_settings: {
        ...prev.behavior_settings,
        [field]: value
      }
    }));
  };

  const handleKnowledgeBaseToggle = (kbId: string) => {
    setSettings(prev => {
      const currentKBs = prev.knowledge_bases || [];
      const newKBs = currentKBs.includes(kbId)
        ? currentKBs.filter(id => id !== kbId)
        : [...currentKBs, kbId];
      
      return {
        ...prev,
        knowledge_bases: newKBs
      };
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {showHeader && (
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-full">
              <Bot className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-medium">Configurações Avançadas do Agente IA</h2>
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
            <span className="flex items-center gap-1">
              <BrainCircuit className="w-4 h-4" />
              Modelo
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('behavior')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'behavior' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              Comportamento
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'knowledge' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Book className="w-4 h-4" />
              Conhecimento
            </span>
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
                value={settings.model_config.model}
                onChange={(e) => handleModelChange('model', e.target.value)}
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
                  value={settings.model_config.temperature}
                  onChange={(e) => handleModelChange('temperature', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded w-12 text-center">
                  {settings.model_config.temperature}
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
                value={settings.model_config.max_tokens}
                onChange={(e) => handleModelChange('max_tokens', parseInt(e.target.value))}
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
                    value={settings.model_config.top_p}
                    onChange={(e) => handleModelChange('top_p', parseFloat(e.target.value))}
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
                    value={settings.model_config.frequency_penalty}
                    onChange={(e) => handleModelChange('frequency_penalty', parseFloat(e.target.value))}
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
                    value={settings.model_config.presence_penalty}
                    onChange={(e) => handleModelChange('presence_penalty', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
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
                  {settings.behavior_settings.confidence_threshold * 100}%
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.05"
                  value={settings.behavior_settings.confidence_threshold}
                  onChange={(e) => handleBehaviorChange('confidence_threshold', parseFloat(e.target.value))}
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
                  checked={settings.behavior_settings.auto_handoff_enabled}
                  onChange={(e) => handleBehaviorChange('auto_handoff_enabled', e.target.checked)}
                  className="sr-only"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {settings.behavior_settings.auto_handoff_enabled && (
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Threshold de Transferência
                    </label>
                    <div className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                      {settings.behavior_settings.auto_handoff_threshold * 100}%
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.05"
                    value={settings.behavior_settings.auto_handoff_threshold}
                    onChange={(e) => handleBehaviorChange('auto_handoff_threshold', parseFloat(e.target.value))}
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
                      value={settings.behavior_settings.max_conversation_turns}
                      onChange={(e) => handleBehaviorChange('max_conversation_turns', parseInt(e.target.value))}
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
                      value={settings.behavior_settings.auto_handoff_after_turns}
                      onChange={(e) => handleBehaviorChange('auto_handoff_after_turns', parseInt(e.target.value))}
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
          </div>
        )}
        
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <div>
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
                    checked={settings.behavior_settings.use_knowledge_base}
                    onChange={(e) => handleBehaviorChange('use_knowledge_base', e.target.checked)}
                    className="sr-only"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full
                  peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                  after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                  after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {settings.behavior_settings.use_knowledge_base && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Peso da Base de Conhecimento
                    </label>
                    <div className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                      {settings.behavior_settings.knowledge_base_weight * 100}%
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.05"
                    value={settings.behavior_settings.knowledge_base_weight}
                    onChange={(e) => handleBehaviorChange('knowledge_base_weight', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Define quanto a base de conhecimento deve influenciar nas respostas do agente.
                  </p>
                </div>
              )}
            </div>
            
            {settings.behavior_settings.use_knowledge_base && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Bases de Conhecimento Disponíveis</h3>
                
                {availableKnowledgeBases.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Book className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhuma base de conhecimento disponível</p>
                    <button
                      type="button"
                      className="mt-2 text-primary hover:underline text-sm"
                      onClick={() => window.location.href = '/knowledge-base'}
                    >
                      Criar base de conhecimento
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                    {availableKnowledgeBases.map(kb => (
                      <div key={kb.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id={`kb-${kb.id}`}
                          checked={settings.knowledge_bases.includes(kb.id)}
                          onChange={() => handleKnowledgeBaseToggle(kb.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`kb-${kb.id}`} className="ml-2 block text-sm text-gray-700">
                          {kb.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-700">Dica</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Associar múltiplas bases de conhecimento permite que o agente tenha acesso a um conjunto mais amplo de informações, mas pode reduzir a precisão das respostas. Recomendamos selecionar apenas as bases mais relevantes para o contexto do agente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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