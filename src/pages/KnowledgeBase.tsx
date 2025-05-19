import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Upload,
  Download,
  FileText,
  File,
  FolderPlus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bot,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  document_count: { count: number } | number;
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

interface Team {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function KnowledgeBase() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
    team_id: '',
    is_active: true
  });
  const [documentForm, setDocumentForm] = useState({
    title: '',
    content: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchKnowledgeBases();
    fetchTeams();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedKB) {
      fetchDocuments(selectedKB.id);
    }
  }, [selectedKB]);

  async function fetchKnowledgeBases() {
    try {
      setLoading(true);
      // Try to fetch knowledge bases, if the table doesn't exist or there's an error, use mock data
      const { data, error } = await supabase
        .from('knowledge_bases')
        .select(`
          *,
          department:departments(name),
          team:teams(name),
          document_count:documents(count)
        `);

      if (error) {
        console.error('Error fetching knowledge bases:', error);
        // Use mock data if there's an error (likely because the table doesn't exist)
        setKnowledgeBases([
          {
            id: '1',
            name: 'Base de Conhecimento Geral',
            description: 'Documentação geral do produto e FAQ',
            is_active: true,
            department_id: null,
            team_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_count: 23,
            last_trained: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Suporte Técnico',
            description: 'Base de conhecimento para o time de suporte técnico',
            is_active: true,
            department_id: '1',
            team_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_count: 45,
            last_trained: new Date().toISOString(),
            department: { name: 'Suporte Técnico' },
            team: { name: 'Suporte Técnico N2' },
          },
          {
            id: '3',
            name: 'FAQs de Vendas',
            description: 'Perguntas frequentes sobre produtos e serviços',
            is_active: true,
            department_id: '2',
            team_id: '2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_count: 17,
            last_trained: new Date().toISOString(),
            department: { name: 'Vendas' },
            team: { name: 'Vendas' },
          }
        ]);
        return;
      } 
      
      setKnowledgeBases(data || []);
    } catch (err) {
      console.error('Error fetching knowledge bases:', err);
      // In case of any other error, set empty array
      setKnowledgeBases([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeams() {
    try {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true);
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }

  async function fetchDepartments() {
    try {
      const { data } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);
      setDepartments(data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }

  async function fetchDocuments(knowledgeBaseId: string) {
    try {
      setDocumentLoading(true);
      
      // Mock data for now
      const mockDocuments: Document[] = [
        {
          id: '1',
          knowledge_base_id: knowledgeBaseId,
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
          knowledge_base_id: knowledgeBaseId,
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
          knowledge_base_id: knowledgeBaseId,
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
          knowledge_base_id: knowledgeBaseId,
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
          knowledge_base_id: knowledgeBaseId,
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
      
      setDocuments(mockDocuments);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setDocumentLoading(false);
    }
  }

  function handleCreateKnowledgeBase() {
    // Mock implementation for now
    const newKB: KnowledgeBase = {
      id: Math.random().toString(36).substring(7),
      name: formData.name,
      description: formData.description,
      is_active: formData.is_active,
      department_id: formData.department_id || null,
      team_id: formData.team_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      document_count: 0,
      last_trained: null,
      department: departments.find(d => d.id === formData.department_id)?.name ? 
        { name: departments.find(d => d.id === formData.department_id)!.name } : 
        undefined,
      team: teams.find(t => t.id === formData.team_id)?.name ?
        { name: teams.find(t => t.id === formData.team_id)!.name } :
        undefined
    };

    setKnowledgeBases([...knowledgeBases, newKB]);
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      department_id: '',
      team_id: '',
      is_active: true
    });
  }

  function handleAddDocument() {
    // Mock implementation for now
    if (!selectedKB) return;

    const newDocument: Document = {
      id: Math.random().toString(36).substring(7),
      knowledge_base_id: selectedKB.id,
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
    
    // Update the document count in the selected knowledge base
    setKnowledgeBases(knowledgeBases.map(kb => 
      kb.id === selectedKB.id ? { 
        ...kb, 
        document_count: typeof kb.document_count === 'number' ? 
          kb.document_count + 1 : 
          { count: kb.document_count.count + 1 } 
      } : kb
    ));
    
    setShowDocumentModal(false);
    setDocumentForm({
      title: '',
      content: '',
      file: null
    });

    // Simulate processing delay
    setTimeout(() => {
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === newDocument.id ? { ...doc, status: 'processed' } : doc
        )
      );
    }, 3000);
  }

  function handleDeleteKnowledgeBase(kbId: string) {
    // Mock implementation for now
    setKnowledgeBases(knowledgeBases.filter(kb => kb.id !== kbId));
    setShowDeleteModal(null);
    if (selectedKB?.id === kbId) {
      setSelectedKB(null);
    }
  }

  function handleTrainModel(kbId: string) {
    setKnowledgeBases(knowledgeBases.map(kb => 
      kb.id === kbId ? { ...kb, last_trained: new Date().toISOString() } : kb
    ));
    
    // Show success alert (in a real app, use a toast notification)
    alert('Modelo treinado com sucesso!');
  }

  function renderKBStatus(kb: KnowledgeBase) {
    if (!kb.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Inativo</span>;
    }

    const docCount = typeof kb.document_count === 'number' ? 
      kb.document_count : 
      kb.document_count.count;

    if (docCount === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Vazio</span>;
    }

    if (!kb.last_trained) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Não Treinado</span>;
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Ativo</span>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bases de Conhecimento</h1>
          <p className="text-gray-600 mt-1">Gerencie os conteúdos que alimentam a inteligência artificial</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Base de Conhecimento
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar bases de conhecimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Main content - Split view */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Knowledge Bases List */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Bases Disponíveis</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : knowledgeBases.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <Book className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>Nenhuma base de conhecimento encontrada</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-primary hover:underline"
                >
                  Criar uma nova
                </button>
              </div>
            ) : (
              <ul className="divide-y">
                {knowledgeBases
                  .filter(kb => 
                    kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    kb.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(kb => (
                    <li 
                      key={kb.id} 
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedKB?.id === kb.id ? 'bg-gray-50' : ''
                      }`}
                      onClick={() => setSelectedKB(kb)}
                    >
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">{kb.name}</h3>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({
                                name: kb.name,
                                description: kb.description,
                                department_id: kb.department_id || '',
                                team_id: kb.team_id || '',
                                is_active: kb.is_active
                              });
                              setShowCreateModal(true);
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteModal(kb.id);
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {kb.description}
                      </p>

                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {(typeof kb.document_count === 'number' ? 
                            kb.document_count : kb.document_count.count) + " documentos"}
                        </span>
                        
                        {renderKBStatus(kb)}
                        
                        {kb.department && (
                          <span className="px-2 py-1 rounded-full bg-gray-100">
                            {kb.department.name}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="w-full md:w-2/3">
          {selectedKB ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium">{selectedKB.name}</h2>
                  <p className="text-sm text-gray-500">{selectedKB.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Documento
                  </button>
                  
                  <button
                    onClick={() => handleTrainModel(selectedKB.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    disabled={typeof selectedKB.document_count === 'number' ? 
                      selectedKB.document_count === 0 : 
                      selectedKB.document_count.count === 0}
                  >
                    <Bot className="w-4 h-4" />
                    Treinar Modelo
                  </button>
                </div>
              </div>

              <div className="p-4">
                {documentLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center p-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>Nenhum documento encontrado nesta base</p>
                    <button
                      onClick={() => setShowDocumentModal(true)}
                      className="mt-4 text-primary hover:underline"
                    >
                      Adicionar um documento
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {documents.map(doc => (
                      <li key={doc.id} className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-gray-100 rounded">
                              {doc.file_type?.includes('pdf') ? (
                                <File className="w-8 h-8 text-red-500" />
                              ) : (
                                <FileText className="w-8 h-8 text-blue-500" />
                              )}
                            </div>
                            
                            <div>
                              <h3 className="font-medium">{doc.title}</h3>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {doc.content}
                              </p>
                              
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
                                    <Download className="w-3 h-3" />
                                    Baixar
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button className="p-1 rounded hover:bg-gray-100 text-gray-500">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 rounded hover:bg-gray-100 text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow flex items-center justify-center p-12">
              <div className="text-center">
                <Book className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-600 mb-2">Nenhuma base selecionada</h2>
                <p className="text-gray-500">
                  Selecione uma base de conhecimento para visualizar seus documentos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Knowledge Base Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {formData.name ? 'Editar Base de Conhecimento' : 'Nova Base de Conhecimento'}
              </h2>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateKnowledgeBase();
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Base de Conhecimento
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Suporte Técnico"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descreva o propósito desta base de conhecimento"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento (opcional)
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
                    Time (opcional)
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
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Base de conhecimento ativa
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Adicionar Novo Documento</h2>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddDocument();
            }} className="p-6 space-y-4">
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

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  disabled={!documentForm.title || (!documentForm.content && !documentForm.file)}
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta base de conhecimento? Esta ação não pode ser desfeita.
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
                onClick={() => showDeleteModal && handleDeleteKnowledgeBase(showDeleteModal)}
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