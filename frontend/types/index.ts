export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  document_count?: number;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  chunk_count: number;
  status: 'processing' | 'indexed' | 'error';
  error_message?: string;
  knowledge_base_id: string;
  workspace_id: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  content: string;
  metadata_json: {
    document_id: string;
    source: string;
    page_number?: number;
    section?: string;
    timestamp?: string;
  };
  score?: number;
}

export interface Citation {
  id: string;
  citation_label: string;
  excerpt: string;
  document_name: string;
  page_number?: number;
  section?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  raw_query?: string;
  confidence_score?: number;
  agent_trace?: { steps: any[] };
  citations?: Citation[];
  follow_up_questions?: string[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  knowledge_base_id: string;
  workspace_id: string;
  response_mode: string;
  message_count?: number;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export type ResponseMode = 'Brief' | 'Detailed' | 'Technical' | 'Beginner' | 'Explain with example';

export interface AgentProgressStep {
  step: string;
  message: string;
  completed: boolean;
  active: boolean;
}
