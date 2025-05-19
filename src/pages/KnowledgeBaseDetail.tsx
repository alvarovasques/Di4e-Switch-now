import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Book, 
  ChevronLeft, 
  File, 
  FileText, 
  Plus, 
  Pencil,
  Trash2, 
  ArrowLeft,
  CheckCircle,
  Clock, 
  Upload,
  Sparkles,
  Bot,
  Search,
  AlertCircle,
  Settings,
  Users,
  Building2,
  Loader2,
  Check,
  X,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import KnowledgeBaseTraining from '../components/KnowledgeBaseTraining';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  department_id: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  last_trained: string | null;
  document_count: number;
  department?: {
    name: string;
  };
  team?: {
    name: string;
  };
}

interface Document {
  id: string;
  knowledge_base_id: string;
  title: string;
  content: string;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  status: 'pending' | 'processed' | 'error';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

export default function KnowledgeBaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'training' | 'settings'>('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    content: '',
    file: null as File | null
  });
  
  useEffect(() => {
    if (id) {
      fetchKnowledgeBase(id);
      fetchDocuments(id);
    }
    fetchTeams();
    fetchDepartments();
  }, [id]);
  
  async function fetchKnowledgeBase(kbId: string) {
    try {
      setLoading(true);
      // Mock knowledge base fetch
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockKnowledgeBase: KnowledgeBase = {
        id: kbId,
        name: 'Base de Conhecimento Geral',
        description: 'Documentação principal dos produtos e serviços da empresa',
        is_active: true,
        department_id: '1',
        team_id: '2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_trained: Math.random() > 0.5 ? new Date().toISOString() : null,
        document_count: 27,
        department: { name: 'Suporte Técnico' },
        team: { name: 'Atendimento Geral' }
      };
      
      setKnowledgeBase(mockKnowledgeBase);
    } catch (err) {
      console.error('Error fetching knowledge base:', err);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchDocuments(kbId: string) {
    try {
      setDocumentLoading(true);
      // Mock documents
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockDocs: Document[] = [
        {
          id: '1',
          knowledge_base_id: kbId,
          title: 'Guia de Início Rápido',
          content: 'Este guia vai te ajudar a começar a usar nosso produto...',
          file_url: null,
          file_type: null,
          file_size: null,
          status: 'processed',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          knowledge_base_id: kbId,
          title: 'Troubleshooting de Erros Comuns',
          content: 'Aqui estão as soluções para os problemas mais frequentes...',
          file_url: null,
          file_type: null,
          file_size: null,
          status: 'processed',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          knowledge_base_id: kbId,
          title: 'FAQ - Perguntas Frequentes',
          content: 'Respostas para as perguntas mais frequentes dos usuários...',
          file_url: null,
          file_type: null,
          file_size: null,
          status: 'processed',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          knowledge_base_id: kbId,
          title: 'Integrações Disponíveis',
          content: 'Lista de todas as integrações suportadas e como configurá-las...',
          file_url: 'https://example.com/integrations.pdf',
          file_type: 'pdf',
          file_size: 2500000,
          status: 'processed',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          knowledge_base_id: kbId,
          title: 'Manual do Administrador',
          content: 'Guia completo para administradores do sistema...',
          file_url: 'https://example.com/admin-manual.pdf',
          file_type: 'pdf',
          file_size: 3200000,
          status: 'processed',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setDocuments(mockDocs);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setDocumentLoading(false);
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
  
  const handleAddDocument = async () => {
    if (!id) return;
    
    try {
      // In a real app, you would upload and process the document here
      
      const newDocument: Document = {
        id: Math.random().toString(36).substring(7),
        knowledge_base_id: id,
        title: documentForm.title,
        content: documentForm.content,
        file_url: documentForm.file ? URL.createObjectURL(documentForm.file) : null,
        file_type: documentForm.file ? documentForm.file.type : null,
        file_size: documentForm.file ? documentForm.file.size : null,
        status: 'pending',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setDocuments([...documents, newDocument]);
      
      // Update document count in knowledge base
      if (knowledgeBase) {
        setKnowledgeBase({
          ...knowledgeBase,
          document_count: knowledgeBase.document_count + 1
        });
      }
      
      setShowDocumentModal(false);
      setDocumentForm({
        title: '',
        content: '',
        file: null
      });
      
      // Simulate processing
      setTimeout(() => {
        setDocuments(docs => 
          docs.map(doc => 
            doc.id === newDocument.id ? { ...doc, status: 'processed' } : doc
          )
        );
      }, 3000);
    } catch (err) {
      console.error('Error adding document:', err);
    }
  };
  
  const handleDeleteDocument = async (docId: string) => {
    try {
      setDocuments(documents.filter(doc => doc.id !== docId));
      
      // Update document count in knowledge base
      if (knowledgeBase) {
        setKnowledgeBase({
          ...knowledgeBase,
          document_count: Math.max(0, knowledgeBase.document_count - 1)
        });
      }
      
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!knowledgeBase) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Base de conhecimento não encontrada</span>
        </div>
        
        <button 
          onClick={() => navigate('/knowledge-base')}
          className="mt-4 flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a lista de bases de conhecimento
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/knowledge-base')}
          className="mb-4 flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar para a lista</span>
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{knowledgeBase.name}</h1>
            <p className="text-gray-600">{knowledgeBase.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {knowledgeBase.department && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{knowledgeBase.department.name}</span>
                </div>
              )}
              
              {knowledgeBase.team && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{knowledgeBase.team.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>{knowledgeBase.document_count} documentos</span>
              </div>
              
              {knowledgeBase.last_trained ? (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Treinado em {new Date(knowledgeBase.last_trained).toLocaleDateString()}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Nunca treinado</span>
                </div>
              )}
              
              {knowledgeBase.is_active ? (
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                  Ativo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                  Inativo
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                activeTab === 'documents' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Documentos</span>
            </button>
            
            <button
              onClick={() => setActiveTab('training')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                activeTab === 'training' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bot className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Treinamento</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                activeTab === 'settings' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Configurações</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <button
              onClick={() => setShowDocumentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <Plus className="w-5 h-5" />
              Adicionar Documento
            </button>
          </div>
          
          {documentLoading ? (
            <div className="bg-white rounded-lg shadow p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? `Nenhum documento corresponde a "${searchTerm}"` : 'Esta base de conhecimento ainda não tem documentos'}
              </p>
              <button
                onClick={() => setShowDocumentModal(true)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Plus className="w-5 h-5" />
                Adicionar Primeiro Documento
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <ul className="divide-y">
                {documents
                  .filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(doc => (
                    <li key={doc.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded">
                          {doc.file_type?.includes('pdf') ? (
                            <File className="w-8 h-8 text-red-500" />
                          ) : (
                            <FileText className="w-8 h-8 text-blue-500" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{doc.title}</h3>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {doc.content}
                              </p>
                            </div>
                            
                            <div className="flex items-start gap-1">
                              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-gray-100 rounded"
                                onClick={() => setShowDeleteModal(doc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                            
                            {doc.status === 'processed' ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Processado
                              </span>
                            ) : doc.status === 'pending' ? (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Processando
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                Erro
                              </span>
                            )}
                            
                            {doc.file_url && (
                              <a 
                                href={doc.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                Baixar
                              </a>
                            )}
                            
                            {doc.file_size && (
                              <span className="text-gray-500">
                                {(doc.file_size / 1024 / 1024).toFixed(1)}MB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
              
              {documents.filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="p-8 text-center">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhum documento corresponde a "{searchTerm}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'training' && (
        <KnowledgeBaseTraining knowledgeBaseId={id} showDocumentUploader />
      )}
      
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-medium">Configurações da Base de Conhecimento</h2>
          <p className="text-gray-600">Edite as configurações desta base de conhecimento</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Base de Conhecimento
              </label>
              <input
                type="text"
                value={knowledgeBase.name}
                onChange={(e) => setKnowledgeBase({ ...knowledgeBase, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={knowledgeBase.is_active ? 'active' : 'inactive'}
                onChange={(e) => setKnowledgeBase({ 
                  ...knowledgeBase, 
                  is_active: e.target.value === 'active' 
                })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={knowledgeBase.description}
                onChange={(e) => setKnowledgeBase({ ...knowledgeBase, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <select
                value={knowledgeBase.department_id || ''}
                onChange={(e) => setKnowledgeBase({ 
                  ...knowledgeBase, 
                  department_id: e.target.value || null,
                  department: departments.find(d => d.id === e.target.value) || undefined
                })}
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
                value={knowledgeBase.team_id || ''}
                onChange={(e) => setKnowledgeBase({ 
                  ...knowledgeBase, 
                  team_id: e.target.value || null,
                  team: teams.find(t => t.id === e.target.value) || undefined
                })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um time</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button 
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => fetchKnowledgeBase(id!)}
            >
              Cancelar
            </button>
            <button 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              onClick={() => alert('As alterações seriam salvas em uma implementação real')}
            >
              Salvar Alterações
            </button>
          </div>
          
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-red-600 mb-2">Zona de Perigo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ações destrutivas que não podem ser desfeitas
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="px-4 py-2 bg-amber-100 text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-200"
                onClick={() => alert('Isso limparia todos os documentos em uma implementação real')}
              >
                Limpar Documentos
              </button>
              
              <button 
                className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200"
                onClick={() => alert('Isso excluiria a base de conhecimento em uma implementação real')}
              >
                Excluir Base de Conhecimento
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Adicionar Novo Documento</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Documento
                </label>
                <input 
                  type="text"
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm({...documentForm, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Guia de Instalação"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo
                </label>
                <textarea
                  value={documentForm.content}
                  onChange={(e) => setDocumentForm({...documentForm, content: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Digite o conteúdo do documento ou use o upload de arquivo"
                  rows={8}
                />
              </div>
              
              <div className="border-2 border-dashed rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">
                    Arraste um arquivo aqui ou clique para fazer upload
                  </p>
                  <p className="text-xs text-gray-400">
                    Suportamos arquivos PDF, DOCX, TXT, MD e HTML (máx. 10MB)
                  </p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="document-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDocumentForm({
                          ...documentForm,
                          file: e.target.files[0],
                          title: documentForm.title || e.target.files[0].name.split('.')[0]
                        });
                      }
                    }}
                    accept=".pdf,.docx,.txt,.md,.html"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('document-upload')?.click()}
                    className="mt-4 px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Selecionar Arquivo
                  </button>
                </div>
                
                {documentForm.file && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{documentForm.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(documentForm.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocumentForm({...documentForm, file: null})}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDocumentModal(false)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddDocument}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                disabled={!documentForm.title || (!documentForm.content && !documentForm.file)}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => showDeleteModal && handleDeleteDocument(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}