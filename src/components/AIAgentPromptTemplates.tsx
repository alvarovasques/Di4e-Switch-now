import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Terminal, 
  Code, 
  Save, 
  AlertCircle, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AIAgentPromptTemplatesProps {
  agentId: string;
  onSave?: () => void;
  initialData?: any;
}

interface PromptTemplates {
  greeting: string;
  system_prompt: string;
  handoff_prompt: string;
  fallback_prompt: string;
}

export default function AIAgentPromptTemplates({ 
  agentId, 
  onSave,
  initialData
}: AIAgentPromptTemplatesProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PromptTemplates>({
    greeting: 'Olá! Sou o assistente virtual. Como posso ajudar?',
    system_prompt: 'Você é um assistente útil e amigável para a empresa. Responda às perguntas do cliente de maneira educada e profissional.',
    handoff_prompt: 'Parece que esta questão requer assistência especializada. Vou transferir você para um atendente humano.',
    fallback_prompt: 'Desculpe, não entendi completamente sua pergunta. Poderia reformulá-la?'
  });

  useEffect(() => {
    if (initialData) {
      setTemplates(initialData);
    } else {
      fetchTemplates();
    }
  }, [agentId, initialData]);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_agent_settings')
        .select('prompt_templates')
        .eq('agent_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching prompt templates:', error);
        setError('Erro ao carregar templates');
        return;
      }

      if (data && data.prompt_templates) {
        setTemplates(data.prompt_templates);
      }
    } catch (err) {
      console.error('Error fetching prompt templates:', err);
      setError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

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
            prompt_templates: templates,
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
            prompt_templates: templates
          });
        
        error = insertError;
      }

      if (error) throw error;
      
      setSuccess('Templates salvos com sucesso!');
      if (onSave) onSave();
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving prompt templates:', err);
      setError('Erro ao salvar templates');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-medium">Templates de Prompts</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Configure as mensagens e instruções que o agente de IA utilizará
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            value={templates.greeting}
            onChange={(e) => setTemplates({...templates, greeting: e.target.value})}
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
            value={templates.system_prompt}
            onChange={(e) => setTemplates({...templates, system_prompt: e.target.value})}
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
            value={templates.handoff_prompt}
            onChange={(e) => setTemplates({...templates, handoff_prompt: e.target.value})}
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
            value={templates.fallback_prompt}
            onChange={(e) => setTemplates({...templates, fallback_prompt: e.target.value})}
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

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Templates</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}