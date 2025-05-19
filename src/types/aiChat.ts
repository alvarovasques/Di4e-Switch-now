export interface AIConversationLog {
  id: string;
  conversation_id: string;
  agent_id: string | null;
  prompt: string;
  response: string;
  tokens_used: number | null;
  processing_time: string | null;
  confidence_score: number | null;
  feedback_score: number | null;
  created_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  feedbackRecorded?: boolean;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  is_active: boolean;
  is_global: boolean;
  department_id: string | null;
  team_id: string | null;
  settings: AIAgentSettings;
  performance: AIAgentPerformance;
}

export interface AIAgentSettings {
  greeting: string;
  max_context_length: number;
  temperature: number;
  model: string;
  prompt_template: string;
  conversation_limit: number;
}

export interface AIAgentPerformance {
  conversations_handled: number;
  success_rate: number;
  avg_resolution_time: string;
  handoff_rate: number;
}

export interface AIKnowledgeBase {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  document_count: number;
  last_trained: string | null;
}

export interface AIConversation {
  id: string;
  customer_id: string;
  status: string;
  ai_confidence: number | null;
  ai_response_time: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    name: string | null;
    email: string | null;
  };
}

export interface AIMetrics {
  totalConversations: number;
  avgConfidence: number;
  avgResponseTime: number;
  handoffRate: number;
  satisfactionRate: number;
}

export interface AIFeedback {
  messageId: string;
  score: number;
  comment?: string;
  timestamp: Date;
}

export interface AIResponse {
  response: string;
  conversation_id: string;
  confidence: number;
  processing_time: number;
  tokens_used: number;
}