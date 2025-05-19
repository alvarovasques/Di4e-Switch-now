export type UserRole = 'agent' | 'supervisor' | 'manager' | 'admin';

export interface AgentPermissions {
  can_transfer: boolean;
  can_close: boolean;
  can_view_metrics: boolean;
  can_manage_users: boolean;
  can_configure_system: boolean;
}

export interface Agent {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: AgentPermissions;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentPerformance {
  id: string;
  agent_id: string;
  date: string;
  conversations_handled: number;
  avg_response_time: string;
  avg_resolution_time: string;
  customer_satisfaction: number;
}

export interface ConversationMetrics {
  id: string;
  conversation_id: string;
  first_response_time: string;
  resolution_time: string;
  transfers_count: number;
  messages_count: number;
  customer_satisfaction: number;
}

export interface MetricsSnapshot {
  id: string;
  snapshot_time: string;
  metrics_type: string;
  period: string;
  metrics: Record<string, any>;
}