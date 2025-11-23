// Basado en documentación de webhooks de Kapso
// https://docs.kapso.ai/docs/platform/webhooks/event-types

export interface KapsoWebhookPayload {
  message: {
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts' | 'interactive';
    text?: {
      body: string;
    };
    image?: {
      caption?: string;
      id?: string;
      link?: string;
      mime_type?: string;
      sha256?: string;
    };
    audio?: {
      id?: string;
      voice?: boolean;
      link?: string;
      mime_type?: string;
      sha256?: string;
    };
    caption?: {
      body?: string;
    };
    kapso: {
      direction: 'inbound' | 'outbound';
      status: string;
      processing_status: string;
      origin: string;
      has_media: boolean;
      media_url?: string;
      media_data?: {
        url: string;
        filename: string;
        content_type: string;
        byte_size: number;
      };
    };
  };
  conversation: {
    id: string;
    phone_number: string;
    status: string;
    phone_number_id: string;
    kapso?: {
      contact_name?: string;
      messages_count: number;
      last_message_text?: string;
    };
  };
  is_new_conversation: boolean;
  phone_number_id: string;
}

export interface UserContext {
  exists: boolean;
  user?: {
    phone_number: string;
    display_name?: string;
  };
  household?: {
    id: number;
    role: string;
    household_size: number;
  };
}

