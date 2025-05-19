export interface AIAgent {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  is_active: boolean;
  is_global: boolean;
  department_id: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  settings: AIAgentSettings;
  performance: AIAgentPerformance;
  department?: {
    name: string;
  };
  team?: {
    name: string;
  };
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

export interface AIConversation {
  id: string;
  agent_id: string;
  customer_id: string;
  status: 'active' | 'resolved' | 'transferred';
  messages: AIMessage[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: string;
}