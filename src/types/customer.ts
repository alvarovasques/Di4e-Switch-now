export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  channel_type: 'whatsapp' | 'telegram' | 'email' | 'webchat';
  channel_id: string;
  first_seen: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  notes: Note[];
  tasks: Task[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  customer_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}