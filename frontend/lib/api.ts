import { User, Workspace, KnowledgeBase, DocumentItem, DocumentChunk, Conversation, Message } from '@/types';

const API_BASE = process.env.NEXT_API_URL || 'http://localhost:8000/api/v1';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errData = await res.json();
      errorDetail = errData.detail || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: any) => request<{ access_token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<{ access_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<User>('/auth/me'),

  // Workspaces
  getWorkspaces: () => request<Workspace[]>('/workspaces'),
  createWorkspace: (data: { name: string; description?: string }) =>
    request<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify(data) }),

  // Knowledge Bases
  getKnowledgeBases: (workspaceId: string) => request<KnowledgeBase[]>(`/knowledge-bases?workspace_id=${workspaceId}`),
  createKnowledgeBase: (data: { name: string; description?: string; workspace_id: string }) =>
    request<KnowledgeBase>('/knowledge-bases', { method: 'POST', body: JSON.stringify(data) }),

  // Documents
  getDocuments: (kbId: string) => request<DocumentItem[]>(`/documents?knowledge_base_id=${kbId}`),
  getDocument: (id: string) => request<DocumentItem>(`/documents/${id}`),
  getDocumentChunks: (id: string) => request<DocumentChunk[]>(`/documents/${id}/chunks`),
  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
  reindexDocument: (id: string) => request<DocumentItem>(`/documents/${id}/reindex`, { method: 'POST' }),
  uploadDocument: (file: File, kbId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('knowledge_base_id', kbId);
    return request<DocumentItem>('/documents/upload', { method: 'POST', body: formData });
  },
  uploadMultipleDocuments: (files: File[], kbId: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('knowledge_base_id', kbId);
    return request<DocumentItem[]>('/documents/upload-multiple', { method: 'POST', body: formData });
  },

  // Search
  search: (data: { query: string; knowledge_base_id: string; top_k?: number }) =>
    request<any>('/search', { method: 'POST', body: JSON.stringify(data) }),

  // Conversations
  getConversations: (kbId?: string) => request<Conversation[]>(`/conversations${kbId ? `?knowledge_base_id=${kbId}` : ''}`),
  getConversation: (id: string) => request<Conversation>(`/conversations/${id}`),
  deleteConversation: (id: string) => request<void>(`/conversations/${id}`, { method: 'DELETE' }),
  sendFeedback: (messageId: string, rating: number, comment?: string) =>
    request<any>(`/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),

  // Chat SSE Streaming helper
  streamChat: async (
    payload: {
      message: string;
      knowledge_base_id: string;
      conversation_id?: string;
      response_mode?: string;
      provider_name?: string;
      model_name?: string;
      custom_api_key?: string;
      allow_web_search?: boolean;
    },
    onEvent: (event: any) => void,
    onError: (err: any) => void
  ) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ ...payload, stream: true }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Chat request failed.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.replace('data: ', '');
            try {
              const data = JSON.parse(jsonStr);
              onEvent(data);
            } catch (e) {
              console.error('SSE JSON parse error', e);
            }
          }
        }
      }
    } catch (err) {
      onError(err);
    }
  },
};
