export type ChannelType = 'whatsapp' | 'telegram' | 'email' | 'webchat' | 'custom';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video';

export interface Contact {
  id: string;
  external_id: string;
  name: string | null;
  channel_type: ChannelType;
  last_seen: string;
  created_at: string;
}

export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  n8n_webhook_url: string | null;
  is_active: boolean;
  created_at: string;
  config?: {
    api_key?: string;
    api_secret?: string;
    endpoint_url?: string;
    custom_headers?: Record<string, string>;
    [key: string]: any;
  };
}

export interface Message {
  id: string;
  direction: MessageDirection;
  message_type: MessageType;
  content: string | null;
  media_url: string | null;
  contact_id: string;
  channel_id: string;
  session_id: string | null;
  sender_name: string | null;
  received_at: string;
  sent_at: string | null;
  created_at: string;
}