'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, Plus, MessageSquare, Trash2, Bot, Sparkles, Folder, FileText, ChevronRight, AlertCircle, CheckCircle2, AlertTriangle, X, Cpu, Settings, LogOut } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ChatMessage } from '@/components/chat/chat-message';
import { AgentProgress, ProgressStep } from '@/components/chat/agent-progress';
import { ResponseModeSelector } from '@/components/chat/response-mode-selector';
import { ALL_MODEL_OPTIONS, ModelOption } from '@/lib/models';
import { SuggestedFollowups } from '@/components/chat/suggested-followups';
import { api, getAuthToken, removeAuthToken } from '@/lib/api';
import { KnowledgeBase, Conversation, Message, ResponseMode, DocumentItem } from '@/types';

import dynamic from 'next/dynamic';

const ThreeDModel = dynamic(() => import('@/components/ui/three-model').then(m => m.ThreeDModel), {
  ssr: false,
  loading: () => <div className="h-32 border border-[#262626] rounded bg-[#141414]" />,
});

// ─── Chat Cache (localStorage + TTL) ────────────────────────────────────────
// localStorage survives tab reloads (unlike sessionStorage which dies on close).
// Each entry is { data, ts } and expires after the given TTL ms.
const CONV_LIST_TTL = 5  * 60 * 1000;  // 5 min  — list refreshes quickly
const CONV_MSGS_TTL = 60 * 60 * 1000;  // 60 min — message history is stable

function cacheSet(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* storage full — silently skip */ }
}

function cacheGet<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > ttl) { localStorage.removeItem(key); return null; }
    return data as T;
  } catch { return null; }
}

function cacheDel(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}
// ────────────────────────────────────────────────────────────────────────────


export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const activeConvId = params?.conversationId as string | undefined;

  const [user, setUser] = useState<any>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>('');
  const [kbDocuments, setKbDocuments] = useState<DocumentItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoadingConv, setIsLoadingConv] = useState(false);

  // Error Toast State
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // New Chat KB Selection Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Model & Custom Key State
  const [selectedModel, setSelectedModel] = useState<ModelOption>(ALL_MODEL_OPTIONS[0]);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [responseMode, setResponseMode] = useState<ResponseMode>('Detailed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref to always hold the latest messages — avoids stale closure in async handleSend callbacks
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    const storedModelId = localStorage.getItem('user_selected_model_id');
    if (storedModelId) {
      const found = ALL_MODEL_OPTIONS.find((m) => m.id === storedModelId);
      if (found) setSelectedModel(found);
    }
  }, []);

  useEffect(() => {
    checkCustomKeyStatus();
  }, [selectedModel]);

  const checkCustomKeyStatus = () => {
    const stored = localStorage.getItem('user_custom_api_keys');
    if (stored) {
      try {
        const keys = JSON.parse(stored);
        setHasCustomKey(Boolean(keys[selectedModel.provider]?.trim()));
      } catch (e) {
        setHasCustomKey(false);
      }
    } else {
      setHasCustomKey(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchInitialData();
  }, [router]);

  useEffect(() => {
    if (selectedKbId) {
      fetchConversations(selectedKbId);
      fetchKbDocuments(selectedKbId);
    }
  }, [selectedKbId]);

  useEffect(() => {
    if (activeConvId) {
      if (activeConvId !== currentConversation?.id) {
        fetchConversationDetail(activeConvId);
      }
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [activeConvId]);

  // Keep messagesRef in sync with messages state (for stale-closure-safe async access)
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, progressSteps]);

  const fetchInitialData = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
      const wsList = await api.getWorkspaces();
      if (wsList.length > 0) {
        const kbList = await api.getKnowledgeBases(wsList[0].id);
        setKnowledgeBases(kbList);
        if (kbList.length > 0) {
          setSelectedKbId(kbList[0].id);
        }
      }
    } catch (err) {
      console.error('Authentication/initialization error:', err);
      removeAuthToken();
      router.push('/login');
    }
  };

  const fetchConversations = async (kbId: string, forceRefresh = false) => {
    const CACHE_KEY = `chat_convs_${kbId}`;

    // 1. Instant render from cache if available and not stale
    const cached = cacheGet<Conversation[]>(CACHE_KEY, CONV_LIST_TTL);
    if (cached) {
      setConversations(cached);
      if (!forceRefresh) return; // Cache is fresh — skip DB fetch entirely
    }

    // 2. Fetch fresh from DB (only when cache is missing or forceRefresh)
    try {
      const convs = await api.getConversations(kbId);
      setConversations(convs);
      cacheSet(CACHE_KEY, convs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKbDocuments = async (kbId: string) => {
    try {
      const docs = await api.getDocuments(kbId);
      setKbDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch KB documents:', err);
    }
  };

  const fetchConversationDetail = async (convId: string) => {
    if (currentConversation?.id === convId && messages.length > 0) return;

    const CACHE_KEY = `chat_conv_${convId}`;

    // 1. Instant render from cache — no loading spinner, no DB call if fresh
    const cached = cacheGet<Conversation & { messages: Message[] }>(CACHE_KEY, CONV_MSGS_TTL);
    if (cached) {
      setCurrentConversation(cached);
      setMessages(cached.messages || []);
      setResponseMode((cached.response_mode as ResponseMode) || 'Detailed');
      if (cached.knowledge_base_id) setSelectedKbId(cached.knowledge_base_id);
      setIsLoadingConv(false);
      return; // ← Skip DB fetch entirely if cache is still fresh
    }

    // 2. No cache — show spinner and fetch from DB
    setIsLoadingConv(true);
    try {
      const conv = await api.getConversation(convId);
      setCurrentConversation(conv);
      setMessages(conv.messages || []);
      setResponseMode((conv.response_mode as ResponseMode) || 'Detailed');
      if (conv.knowledge_base_id) setSelectedKbId(conv.knowledge_base_id);
      cacheSet(CACHE_KEY, conv);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingConv(false);
    }
  };

  const handleStartNewChatClick = () => {
    if (knowledgeBases.length > 1) {
      setIsNewChatModalOpen(true);
    } else {
      confirmStartNewChat(selectedKbId);
    }
  };

  const confirmStartNewChat = (kbId: string) => {
    setSelectedKbId(kbId);
    setCurrentConversation(null);
    setMessages([]);
    setSuggestedFollowups([]);
    setIsNewChatModalOpen(false);
    router.push('/chat');
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      const updatedConvs = conversations.filter((c) => c.id !== convId);
      setConversations(updatedConvs);
      // Purge conversation messages from cache
      cacheDel(`chat_conv_${convId}`);
      // Update conversation list cache immediately so next render is instant
      if (selectedKbId) cacheSet(`chat_convs_${selectedKbId}`, updatedConvs);
      if (currentConversation?.id === convId) {
        confirmStartNewChat(selectedKbId);
      }
    } catch (err) {
      alert('Failed to delete conversation');
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputMessage;
    if (!textToSend.trim() || isGenerating) return;
    if (!selectedKbId) {
      setErrorToast('Please select a Knowledge Base to query before sending a message.');
      return;
    }
    setErrorToast(null);

    setInputMessage('');
    setIsGenerating(true);
    setSuggestedFollowups([]);

    const initialSteps: ProgressStep[] = [
      { id: 'query_analysis', label: 'Analyzing question', status: 'pending' },
      { id: 'retrieval', label: 'Hybrid search (Vector + Keyword)', status: 'pending' },
      { id: 'reranking', label: 'Reranking candidates', status: 'pending' },
      { id: 'compression', label: 'Formatting context & citations', status: 'pending' },
      { id: 'answer', label: 'Generating evidence-grounded answer', status: 'pending' },
      { id: 'verification', label: 'Verifying answer correctness', status: 'pending' },
    ];
    setProgressSteps(initialSteps);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    const assistantMsgId = `asst-${Date.now()}`;
    let accumulatedContent = '';
    let citations: any[] = [];
    let confidenceScore = 1.0;
    let agentTrace: any[] = [];
    let activeConvId = currentConversation?.id;

    const placeholderAsstMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      citations: [],
      created_at: new Date().toISOString(),
    };

    // Append both user query and placeholder assistant message immediately
    setMessages((prev) => [...prev, userMsg, placeholderAsstMsg]);

    // Extract custom key for selected provider from localStorage
    let customKey: string | undefined = undefined;
    const storedKeys = localStorage.getItem('user_custom_api_keys');
    if (storedKeys) {
      try {
        const parsed = JSON.parse(storedKeys);
        customKey = parsed[selectedModel.provider]?.trim() || undefined;
      } catch (e) {
        console.error(e);
      }
    }

    // Detect if user is approving external web search
    const textLower = textToSend.toLowerCase().trim();
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const isConsentPrompt = lastMsg?.content?.includes('Would you like me to fetch the information for this question from the internet?');
    const isApprovalText = textLower.includes('search the internet') || textLower === 'yes' || textLower.startsWith('yes');
    const allowWebSearch = Boolean(isApprovalText || isConsentPrompt);

    await api.streamChat(
      {
        message: textToSend,
        knowledge_base_id: selectedKbId,
        conversation_id: currentConversation?.id,
        response_mode: responseMode,
        provider_name: selectedModel.provider,
        model_name: selectedModel.name,
        custom_api_key: customKey,
        allow_web_search: allowWebSearch,
      },
      (event) => {
        if (event.type === 'init') {
          activeConvId = event.conversation_id;
          if (!currentConversation) {
            setCurrentConversation({
              id: event.conversation_id,
              title: textToSend.substring(0, 40),
              knowledge_base_id: selectedKbId,
              workspace_id: selectedKb?.workspace_id || '',
              response_mode: responseMode,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            window.history.replaceState(null, '', `/chat/${event.conversation_id}`);
          }
        } else if (event.type === 'progress') {
          setProgressSteps((prevSteps) =>
            prevSteps.map((s) => {
              if (s.id === event.step) return { ...s, status: 'active' };
              if (s.status === 'active') return { ...s, status: 'completed' };
              return s;
            })
          );
        } else if (event.type === 'token') {
          accumulatedContent += event.content;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m))
          );
        } else if (event.type === 'metadata') {
          citations = event.citations || [];
          confidenceScore = event.confidence || 1.0;
          agentTrace = event.agent_trace || [];
          if (event.follow_up_questions) {
            setSuggestedFollowups(event.follow_up_questions);
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    citations,
                    confidence_score: confidenceScore,
                    agent_trace: { steps: agentTrace },
                  }
                : m
            )
          );
        } else if (event.type === 'done') {
          setProgressSteps((prevSteps) => prevSteps.map((s) => ({ ...s, status: 'completed' })));
          setIsGenerating(false);

          // Persist completed turn to localStorage cache (fixes stale-closure by reading ref)
          const targetConvId = activeConvId || currentConversation?.id;
          if (targetConvId) {
            const finalAsstMsg: Message = {
              id: assistantMsgId,
              role: 'assistant',
              content: accumulatedContent,
              citations,
              confidence_score: confidenceScore,
              agent_trace: { steps: agentTrace },
              created_at: new Date().toISOString(),
            };
            // Use messagesRef.current — always the live accumulated list, not stale closure
            const liveMessages = messagesRef.current;
            const convBase = currentConversation || {
              id: targetConvId,
              title: textToSend.substring(0, 40),
              knowledge_base_id: selectedKbId,
              workspace_id: selectedKb?.workspace_id || '',
              response_mode: responseMode,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            cacheSet(`chat_conv_${targetConvId}`, {
              ...convBase,
              id: targetConvId,
              // Replace placeholder assistant message with the fully-populated one
              messages: liveMessages.map((m) =>
                m.id === assistantMsgId ? finalAsstMsg : m
              ),
            });
          }

          // Force-refresh conversation list so sidebar title/ordering updates
          if (selectedKbId) fetchConversations(selectedKbId, true);
        }
      },
      (err) => {
        console.error(err);
        setIsGenerating(false);
        const errMsg = err?.message || 'Execution error during AI synthesis. Please check your model API key in Settings.';
        setErrorToast(errMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `⚠️ Error: ${errMsg}`,
                }
              : m
          )
        );
      }
    );
  };

  const selectedKb = knowledgeBases.find((kb) => kb.id === selectedKbId);

  return (
    <div className="h-screen bg-[#0d0d0d] text-white flex flex-col overflow-hidden font-sans">
      <Navbar
        user={user}
        knowledgeBases={knowledgeBases}
        selectedKbId={selectedKbId}
        onSelectKb={(id) => setSelectedKbId(id)}
      />

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Conversations & KB Documents Sidebar */}
        <aside className="w-80 bg-[#0d0d0d] border-r border-[#262626] hidden md:flex flex-col p-4 space-y-4">
          {/* Interactive 3D WebGL Core Model */}
          <ThreeDModel height="h-32" className="border border-[#262626] shadow-md" />

          <Button onClick={handleStartNewChatClick} className="w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> New Chat Session
          </Button>

          {/* Target Knowledge Base & Document Selector Panel */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#6f6f6f] uppercase tracking-widest flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#f84525]" /> TARGET KNOWLEDGE BASE
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                {kbDocuments.length} DOCS
              </span>
            </div>

            <select
              value={selectedKbId}
              onChange={(e) => setSelectedKbId(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-[#f84525] rounded-lg px-2.5 py-2 text-xs font-semibold text-white focus:outline-none transition-colors"
            >
              {knowledgeBases.map((kb) => (
                <option key={kb.id} value={kb.id} className="bg-[#141414] text-white">
                  {kb.name}
                </option>
              ))}
            </select>

            {/* Indexed Document List Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-mono text-[#9c9c9c] uppercase tracking-wider block">
                INDEXED DOCUMENTS IN KB:
              </span>
              {kbDocuments.length === 0 ? (
                <div className="p-2.5 rounded-lg bg-[#0d0d0d] border border-[#262626] text-[11px] font-mono text-[#6f6f6f] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>No documents uploaded. <button onClick={() => router.push('/documents')} className="text-[#f84525] underline">Upload Docs</button></span>
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {kbDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2 rounded-lg bg-[#0d0d0d] border border-[#262626] flex items-center justify-between text-xs text-[#9c9c9c] hover:border-[#f84525]/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-[#f84525] shrink-0" />
                        <span className="truncate text-[11px] font-medium text-white">{doc.filename}</span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-bold shrink-0">
                        {doc.chunk_count} CHUNKS
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Chat Sessions */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 border-t border-[#262626] pt-3">
            <span className="text-[10px] font-mono font-bold text-[#6f6f6f] uppercase tracking-widest block px-2 mb-2">
              RECENT CHAT SESSIONS
            </span>
            {conversations.length === 0 ? (
              <div className="text-xs font-mono text-[#6f6f6f] px-2 py-4 text-center">No past sessions in this KB</div>
            ) : (
              conversations.map((conv) => {
                const isActive = currentConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/chat/${conv.id}`)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all group ${
                      isActive
                        ? 'bg-[#161616] text-[#f84525] border border-[#f84525]/40 font-bold'
                        : 'text-[#9c9c9c] hover:bg-[#141414] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#f84525]" />
                      <span className="truncate">{conv.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-[#6f6f6f] hover:text-rose-400 p-1 rounded hover:bg-[#202020] transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* User Profile Card in Left Corner */}
          <div className="pt-3 border-t border-[#262626] mt-auto">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 flex items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-[#f84525]/20 text-[#f84525] border border-[#f84525]/40 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : user?.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="truncate text-left space-y-0.5">
                  <span className="block text-xs font-bold text-white truncate">{user?.full_name || 'User Profile'}</span>
                  <span className="block text-[10px] font-mono text-[#6f6f6f] truncate">{user?.email || 'user@rag.ai'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => router.push('/settings')}
                  className="p-1.5 text-[#6f6f6f] hover:text-[#f84525] hover:bg-[#202020] rounded transition-colors"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    removeAuthToken();
                    router.push('/login');
                  }}
                  className="p-1.5 text-[#6f6f6f] hover:text-rose-400 hover:bg-[#202020] rounded transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Interface */}
        <main className="flex-1 flex flex-col bg-[#121212] overflow-hidden relative">
          {/* Header Controls */}
          <div className="p-4 border-b border-[#262626] bg-[#0d0d0d]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 relative z-30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#f84525]" />
              <div className="flex flex-col">
                <span className="font-display font-bold uppercase tracking-wider text-xs text-white">
                  {currentConversation ? currentConversation.title : 'NEW CHAT SESSION'}
                </span>
                <span className="text-[10px] font-mono text-[#f84525] uppercase tracking-wider">
                  ACTIVE KB: {selectedKb?.name || 'DEFAULT KB'} ({kbDocuments.length} DOCS INDEXED)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Active Model Indicator (Selection Managed Exclusively in Settings) */}
              <div className="flex items-center gap-2 bg-[#161616] border border-[#262626] px-3 py-1.5 rounded-lg text-xs font-mono text-[#cccccc]">
                <Cpu className="w-3.5 h-3.5 text-[#f84525] shrink-0" />
                <span>MODEL: <strong className="text-white font-semibold">{selectedModel.displayName}</strong></span>
                <span className="bg-[#f84525]/15 text-[#f84525] text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold shrink-0">
                  {selectedModel.tag}
                </span>
                <button
                  onClick={() => router.push('/settings')}
                  className="text-[10px] font-mono text-[#f84525] hover:underline ml-1 font-bold"
                  title="Change Active Model Engine in Settings"
                >
                  Settings ⚙️
                </button>
              </div>
              <ResponseModeSelector value={responseMode} onChange={(m) => setResponseMode(m)} />
            </div>
          </div>

          {/* Custom Error Toast Banner */}
          {errorToast && (
            <div className="mx-4 my-3 p-3.5 rounded-xl bg-[#1c0808] border border-[#f84525] text-white shadow-2xl flex items-center justify-between gap-4 animate-fade-in z-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#f84525] shrink-0" />
                <div className="text-xs font-mono space-y-0.5 text-left">
                  <span className="font-bold text-[#f84525] uppercase tracking-wider block">⚠️ EXECUTION / SYSTEM ERROR</span>
                  <p className="text-[#dddddd] text-xs font-sans">{errorToast}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => router.push('/settings')}
                  className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[#f84525]/20 text-[#f84525] border border-[#f84525]/40 rounded hover:bg-[#f84525]/30 font-bold transition-colors"
                >
                  Configure Keys ↗
                </button>
                <button
                  onClick={() => setErrorToast(null)}
                  className="p-1 text-[#6f6f6f] hover:text-white rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* New Chat Knowledge Base Selection Modal */}
          <Modal
            isOpen={isNewChatModalOpen}
            onClose={() => setIsNewChatModalOpen(false)}
            title="START NEW CHAT // SELECT KNOWLEDGE BASE"
          >
            <div className="space-y-4 font-sans text-left">
              <p className="text-xs text-[#9c9c9c] leading-relaxed">
                Choose the Knowledge Base and document repository to query for this new chat session:
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {knowledgeBases.map((kb) => {
                  const isSel = kb.id === selectedKbId;
                  return (
                    <div
                      key={kb.id}
                      onClick={() => confirmStartNewChat(kb.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSel
                          ? 'bg-[#161616] border-[#f84525] font-bold text-white'
                          : 'bg-[#121212] border-[#262626] hover:border-[#f84525]/50 text-[#9c9c9c] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-[#f84525] shrink-0" />
                        <div>
                          <div className="text-xs font-bold font-mono text-white">{kb.name}</div>
                          <div className="text-[10px] text-[#6f6f6f]">{kb.description || 'No description'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                          {kb.document_count || 0} Docs
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#6f6f6f]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Modal>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {isLoadingConv ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-[#f84525] border-t-transparent animate-spin" />
                <span className="text-xs font-mono text-[#9c9c9c] uppercase tracking-widest animate-pulse">
                  Loading Chat Session...
                </span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#f84525] shadow-2xl">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <div className="section-tag justify-center mb-2">02 // MULTI-AGENT CHAT</div>
                  <h2 className="text-2xl font-extrabold uppercase font-display text-white tracking-tight">
                    GROUNDED KNOWLEDGE RETRIEVAL
                  </h2>
                  <p className="text-xs text-[#9c9c9c] max-w-md mx-auto mt-2 leading-relaxed">
                    Ask any question regarding documents indexed inside <strong className="text-white font-mono">{selectedKb?.name || 'your Knowledge Base'}</strong>.
                  </p>
                </div>

                {kbDocuments.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] max-w-md w-full text-left space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#f84525] uppercase tracking-wider block">
                      ACTIVE DOCUMENT CONTEXT ({kbDocuments.length} FILES INDEXED):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {kbDocuments.map((doc) => (
                        <span key={doc.id} className="text-[10px] font-mono bg-[#1c1c1c] text-[#cccccc] px-2 py-1 rounded border border-[#2a2a2a]">
                          📄 {doc.filename}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full pt-2">
                  <button
                    onClick={() => handleSend('Summarize the main refund guidelines and eligibility criteria.')}
                    className="p-4 rounded-xl bg-[#161616] border border-[#262626] hover:border-[#f84525]/50 text-left text-xs text-[#9c9c9c] hover:text-white transition-all group"
                  >
                    <span className="font-mono text-[10px] text-[#f84525] block mb-1">PROMPT 01 //</span>
                    "Summarize refund guidelines and eligibility criteria."
                  </button>
                  <button
                    onClick={() => handleSend('Compare Plan A and Plan B refund policy after 15 days.')}
                    className="p-4 rounded-xl bg-[#161616] border border-[#262626] hover:border-[#f84525]/50 text-left text-xs text-[#9c9c9c] hover:text-white transition-all group"
                  >
                    <span className="font-mono text-[10px] text-[#f84525] block mb-1">PROMPT 02 //</span>
                    "Compare Plan A and Plan B refund policy after 15 days."
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => <ChatMessage key={m.id} message={m} />)
            )}

            {/* Real-time Agent Pipeline Progress */}
            {isGenerating && <AgentProgress steps={progressSteps} />}

            {/* Suggested Followup chips */}
            {!isGenerating && suggestedFollowups.length > 0 && (
              <SuggestedFollowups questions={suggestedFollowups} onSelect={(q) => handleSend(q)} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Bar */}
          <div className="p-4 border-t border-[#262626] bg-[#0d0d0d]/90 backdrop-blur-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3 bg-[#161616] border border-[#262626] focus-within:border-[#f84525] rounded-xl p-2 shadow-2xl transition-colors"
            >
              <textarea
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask about documents in ${selectedKb?.name || 'Knowledge Base'}...`}
                className="flex-1 bg-transparent px-3 py-2 text-base text-white focus:outline-none resize-none max-h-32 font-sans"
              />
              <Button type="submit" size="md" disabled={!inputMessage.trim() || isGenerating} isLoading={isGenerating}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
