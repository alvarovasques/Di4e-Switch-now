export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  department_id: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  last_trained: string | null;
  document_count?: number;
  department?: {
    name: string;
  };
  team?: {
    name: string;
  };
}

export interface Document {
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

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, any>;
  created_at: string;
}