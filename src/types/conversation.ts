export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type ChannelType = 'whatsapp' | 'telegram' | 'email' | 'webchat';
export type SenderType = 'customer' | 'agent' | 'system' | 'ai';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface ChannelConfig {
  id: string;
  channel_type: ChannelType;
  name: string;
  config: Record<string, any>;
  is_active: boolean;
}

export interface QueueSettings {
  id: string;
  department_id: string;
  name: string;
  routing_method: 'round-robin' | 'load-balanced';
  settings: Record<string, any>;
  is_active: boolean;
}

export interface Conversation {
  id: string;
  customer_id: string;
  department_id: string;
  channel_type: ChannelType;
  channel_config_id: string;
  status: TicketStatus;
  priority: PriorityLevel;
  subject: string | null;
  assigned_to: string | null;
  previous_agent: string | null;
  sla_due_at: string | null;
  first_response_at: string | null;
  resolution_time: string | null;
  is_ai_handled: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  content: string;
  attachments: Array<{
    url: string;
    type: string;
    name: string;
    size: number;
  }>;
  metadata: Record<string, any>;
  created_at: string;
}