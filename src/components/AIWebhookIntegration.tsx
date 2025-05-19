import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Copy, 
  Check, 
  Code, 
  ExternalLink, 
  AlertCircle, 
  Info,
  Globe,
  Key
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AIWebhookIntegrationProps {
  onClose?: () => void;
}

export default function AIWebhookIntegration({ onClose }: AIWebhookIntegrationProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch the actual API key and webhook URL
    // For demo purposes, we're generating a mock API key
    const mockApiKey = `ai_${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(mockApiKey);
    
    // Set the webhook URL based on the Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    setWebhookUrl(`${supabaseUrl}/functions/v1/ai-webhook-handler`);
    
    setLoading(false);
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const codeExamples = {
    javascript: `// Enviar evento para o webhook
fetch("${webhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey}"
  },
  body: JSON.stringify({
    event_type: "ai.conversation.completed",
    conversation_id: "CONVERSATION_ID",
    data: {
      customer_id: "CUSTOMER_ID",
      satisfaction_score: 4.5,
      resolution_time: "00:02:15",
      ai_confidence: 0.92
    }
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));`,

    python: `import requests
import json

url = "${webhookUrl}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey}"
}
payload = {
    "event_type": "ai.conversation.completed",
    "conversation_id": "CONVERSATION_ID",
    "data": {
        "customer_id": "CUSTOMER_ID",
        "satisfaction_score": 4.5,
        "resolution_time": "00:02:15",
        "ai_confidence": 0.92
    }
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
print(response.json())`,

    curl: `curl -X POST "${webhookUrl}" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apiKey}" \\
-d '{
  "event_type": "ai.conversation.completed",
  "conversation_id": "CONVERSATION_ID",
  "data": {
    "customer_id": "CUSTOMER_ID",
    "satisfaction_score": 4.5,
    "resolution_time": "00:02:15",
    "ai_confidence": 0.92
  }
}'`
  };

  const [activeTab, setActiveTab] = useState<'javascript' | 'python' | 'curl'>('javascript');

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-medium">Integração de Webhooks IA</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-700">Sobre Webhooks IA</h3>
              <p className="text-sm text-blue-600 mt-1">
                Os webhooks permitem que você receba notificações em tempo real sobre eventos de IA, como conversas iniciadas, transferências e feedback recebido. Use estas informações para integrar com seus sistemas existentes.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Key className="w-4 h-4 text-gray-500" />
                Chave de API
              </h3>
              <button
                onClick={() => handleCopy(apiKey, 'apiKey')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copiar chave de API"
              >
                {copied === 'apiKey' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
              {apiKey}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Esta chave é necessária para autenticar suas solicitações ao webhook.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Globe className="w-4 h-4 text-gray-500" />
                URL do Webhook
              </h3>
              <button
                onClick={() => handleCopy(webhookUrl, 'webhookUrl')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copiar URL do webhook"
              >
                {copied === 'webhookUrl' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
              {webhookUrl}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Envie solicitações POST para esta URL para acionar eventos de IA.
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
            <Code className="w-4 h-4 text-gray-500" />
            Exemplos de Código
          </h3>

          <div className="border rounded-lg overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('javascript')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'javascript' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                JavaScript
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'python' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setActiveTab('curl')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'curl' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                cURL
              </button>
            </div>
            <div className="relative">
              <pre className="p-4 bg-gray-800 text-white text-sm overflow-x-auto">
                <code>{codeExamples[activeTab]}</code>
              </pre>
              <button
                onClick={() => handleCopy(codeExamples[activeTab], 'code')}
                className="absolute top-2 right-2 p-1 bg-gray-700 rounded hover:bg-gray-600"
                title="Copiar código"
              >
                {copied === 'code' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Eventos Disponíveis</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">ai.conversation.started</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Acionado quando uma nova conversa com IA é iniciada
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm">ai.conversation.completed</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Acionado quando uma conversa com IA é concluída
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-sm">ai.handoff.requested</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Acionado quando uma transferência para humano é solicitada
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">ai.handoff.completed</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Acionado quando uma transferência para humano é concluída
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-sm">ai.feedback.received</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Acionado quando um feedback sobre resposta de IA é recebido
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-sm">ai.knowledge.used</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Acionado quando a base de conhecimento é utilizada para resposta
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <a 
            href="https://docs.example.com/ai-webhooks" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Ver documentação completa
          </a>
        </div>
      </div>
    </div>
  );
}

// Add missing imports
import { XCircle, ArrowUpRight, Star, Book } from 'lucide-react';