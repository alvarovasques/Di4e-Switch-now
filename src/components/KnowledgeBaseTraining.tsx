import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  Clock, 
  FileText, 
  Sparkles,
  Zap,
  Database,
  Loader2,
  BookOpen,
  BarChart2,
  Check,
  X,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  document_count: number;
  last_trained: string | null;
}

interface TrainingProps {
  knowledgeBaseId?: string;
  className?: string;
  showDocumentUploader?: boolean;
}

export default function KnowledgeBaseTraining({ 
  knowledgeBaseId,
  className = '',
  showDocumentUploader = true
}: TrainingProps) {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trainingQuality, setTrainingQuality] = useState<number>(0);
  
  // Fetch knowledge base data
  useEffect(() => {
    if (knowledgeBaseId) {
      fetchKnowledgeBase();
    } else {
      setLoading(false);
    }
  }, [knowledgeBaseId]);
  
  // Simulated training progress
  useEffect(() => {
    if (training && progress < 100) {
      const timer = setTimeout(() => {
        setProgress((prevProgress) => {
          const increment = Math.random() * 10;
          const newProgress = Math.min(prevProgress + increment, 100);
          
          if (newProgress === 100) {
            setTraining(false);
            setSuccess('Treinamento concluído com sucesso!');
            setTrainingQuality(Math.random() * 40 + 60); // Random quality between 60-100%
            // Update last_trained in knowledge base
            if (knowledgeBase) {
              setKnowledgeBase({
                ...knowledgeBase,
                last_trained: new Date().toISOString()
              });
            }
          }
          
          return newProgress;
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [training, progress, knowledgeBase]);
  
  const fetchKnowledgeBase = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from the database
      // For this example, we're simulating it
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data
      if (knowledgeBaseId) {
        const mockKnowledgeBase: KnowledgeBase = {
          id: knowledgeBaseId,
          name: 'Base de Conhecimento Geral',
          description: 'Documentação principal dos produtos e serviços',
          document_count: 27,
          last_trained: Math.random() > 0.5 ? new Date().toISOString() : null
        };
        
        setKnowledgeBase(mockKnowledgeBase);
        
        // Set a random training quality
        if (mockKnowledgeBase.last_trained) {
          setTrainingQuality(Math.random() * 40 + 60); // Random quality between 60-100%
        }
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      setError('Falha ao carregar informações da base de conhecimento');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };
  
  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulated upload process
      // In a real implementation, you'd upload to Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After successful upload, update document count
      if (knowledgeBase) {
        setKnowledgeBase({
          ...knowledgeBase,
          document_count: knowledgeBase.document_count + 1
        });
      }
      
      setSuccess('Documento enviado com sucesso!');
      setUploadFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Falha ao enviar o arquivo. Por favor, tente novamente.');
    } finally {
      setUploading(false);
    }
  };
  
  const startTraining = () => {
    setTraining(true);
    setProgress(0);
    setError(null);
    setSuccess(null);
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-600';
    if (quality >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };
  
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6 border-b">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          {knowledgeBase ? `Treinamento: ${knowledgeBase.name}` : 'Treinamento de IA'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie o treinamento da IA com sua base de conhecimento
        </p>
      </div>
      
      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}
          
          {knowledgeBase && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Informações da Base</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Documentos
                    </span>
                    <span className="text-sm font-medium">{knowledgeBase.document_count}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Último treinamento
                    </span>
                    <span className="text-sm font-medium">{formatDate(knowledgeBase.last_trained)}</span>
                  </div>
                  
                  {trainingQuality > 0 && knowledgeBase.last_trained && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        Qualidade do treinamento
                      </span>
                      <span className={`text-sm font-medium ${getQualityColor(trainingQuality)}`}>
                        {Math.round(trainingQuality)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Status do Treinamento</h3>
                {training ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Progresso</span>
                      <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-center mt-3">
                      <p className="text-sm text-gray-500 mb-1">Processando documentos...</p>
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        {progress < 30 ? 'Analisando conteúdo' : 
                         progress < 60 ? 'Processando relações' :
                         progress < 90 ? 'Gerando embeddings' : 'Finalizando treinamento'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className={`text-sm font-medium ${knowledgeBase.last_trained ? 'text-green-600' : 'text-amber-600'} flex items-center gap-1`}>
                        {knowledgeBase.last_trained ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Treinado
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Não treinado
                          </>
                        )}
                      </span>
                    </div>
                    
                    <button
                      onClick={startTraining}
                      disabled={knowledgeBase.document_count === 0}
                      className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {knowledgeBase.last_trained ? 'Retreinar IA' : 'Treinar IA'}
                    </button>
                    
                    {knowledgeBase.document_count === 0 && (
                      <div className="text-xs text-amber-600 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Adicione documentos antes de treinar
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {showDocumentUploader && (
            <div className="border-t pt-6 mt-2">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                <Upload className="w-4 h-4 text-gray-500" />
                Enviar Documento
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  {uploadFile ? (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="text-sm font-medium">{uploadFile.name}</span>
                        </div>
                        <button
                          onClick={() => setUploadFile(null)}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-3">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB • {uploadFile.type || 'Arquivo desconhecido'}
                      </div>
                      
                      <button
                        onClick={handleFileUpload}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Enviar Documento
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Arraste e solte arquivos aqui ou clique para selecionar
                      </p>
                      <p className="text-xs text-gray-500">
                        Suporta PDF, DOCX, TXT, MD e HTML (máximo 10MB)
                      </p>
                      
                      <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt,.md,.html"
                      />
                      
                      <button
                        type="button"
                        onClick={() => document.getElementById('document-upload')?.click()}
                        className="mt-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Selecionar Arquivo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Treinamento Eficaz */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
            <h3 className="font-medium mb-2 flex items-center gap-1">
              <Info className="w-4 h-4" />
              Dicas para Treinamento Eficaz
            </h3>
            
            <ul className="list-disc ml-5 space-y-1">
              <li>Inclua documentos com linguagem semelhante à usada pelos clientes</li>
              <li>Adicione perguntas frequentes (FAQs) em formato de pergunta e resposta</li>
              <li>Mantenha os documentos atualizados e retreine periodicamente</li>
              <li>Para tópicos específicos, crie bases de conhecimento separadas</li>
            </ul>
          </div>
          
          {/* Insights de Treinamento - Aparece apenas quando há pelo menos um treinamento */}
          {trainingQuality > 0 && knowledgeBase?.last_trained && (
            <div className="mt-4 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                <BarChart2 className="w-4 h-4 text-gray-500" />
                Insights de Treinamento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Qualidade do Modelo</h4>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-full rounded-full ${
                              trainingQuality >= 80 ? 'bg-green-500' :
                              trainingQuality >= 70 ? 'bg-yellow-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${trainingQuality}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getQualityColor(trainingQuality)}`}>
                          {Math.round(trainingQuality)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {trainingQuality >= 80 ? 'Excelente qualidade de treinamento' :
                         trainingQuality >= 70 ? 'Boa qualidade, mas pode ser melhorada' :
                         'Qualidade média, recomendamos adicionar mais documentos'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Database className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Cobertura de Tópicos</h4>
                      <div className="mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Produtos</span>
                          <span className="text-xs font-medium">85%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div className="mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Suporte Técnico</span>
                          <span className="text-xs font-medium">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      <div className="mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Faturamento</span>
                          <span className="text-xs font-medium">68%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}