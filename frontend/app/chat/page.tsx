'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, Plus, MessageSquare, Trash2, Bot, Sliders, ShieldCheck, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/chat/chat-message';
import { AgentProgress, ProgressStep } from '@/components/chat/agent-progress';
import { ResponseModeSelector } from '@/components/chat/response-mode-selector';
import { SuggestedFollowups } from '@/components/chat/suggested-followups';
import { api, getAuthToken } from '@/lib/api';
import { KnowledgeBase, Conversation, Message, ResponseMode } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const activeConvId = params?.conversationId as string | undefined;

  const [user, setUser] = useState<any>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [responseMode, setResponseMode] = useState<ResponseMode>('Detailed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    }
  }, [selectedKbId]);

  useEffect(() => {
    if (activeConvId) {
      fetchConversationDetail(activeConvId);
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [activeConvId]);

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
      console.error(err);
    }
  };

  const fetchConversations = async (kbId: string) => {
    try {
      const convs = await api.getConversations(kbId);
      setConversations(convs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConversationDetail = async (convId: string) => {
    try {
      const conv = await api.getConversation(convId);
      setCurrentConversation(conv);
      setMessages(conv.messages || []);
      setResponseMode((conv.response_mode as ResponseMode) || 'Detailed');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNewChat = () => {
    setCurrentConversation(null);
    setMessages([]);
    setSuggestedFollowups([]);
    router.push('/chat');
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      setConversations(conversations.filter((c) => c.id !== convId));
      if (currentConversation?.id === convId) {
        handleStartNewChat();
      }
    } catch (err) {
      alert('Failed to delete conversation');
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputMessage;
    if (!textToSend.trim() || isGenerating) return;
    if (!selectedKbId) {
      alert('Please select a Knowledge Base to query.');
      return;
    }

    setInputMessage('');
    setIsGenerating(true);
    setSuggestedFollowups([]);

    // Initialize progress tracker steps
    const initialSteps: ProgressStep[] = [
      { id: 'query_analysis', label: 'Analyzing question', status: 'pending' },
      { id: 'retrieval', label: 'Hybrid search (Vector + Keyword)', status: 'pending' },
      { id: 'reranking', label: 'Reranking candidates', status: 'pending' },
      { id: 'compression', label: 'Formatting context & citations', status: 'pending' },
      { id: 'answer', label: 'Generating evidence-grounded answer', status: 'pending' },
      { id: 'verification', label: 'Verifying answer correctness', status: 'pending' },
    ];
    setProgressSteps(initialSteps);

    // Optimistically add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Assistant placeholder
    const assistantMsgId = `asst-${Date.now()}`;
    let accumulatedContent = '';
    let citations: any[] = [];
    let confidenceScore = 1.0;
    let agentTrace: any[] = [];

    const placeholderAsstMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, placeholderAsstMsg]);

    await api.streamChat(
      {
        message: textToSend,
        knowledge_base_id: selectedKbId,
        conversation_id: currentConversation?.id,
        response_mode: responseMode,
      },
      (event) => {
        if (event.type === 'init') {
          if (!currentConversation) {
            router.push(`/chat/${event.conversation_id}`);
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
          if (selectedKbId) fetchConversations(selectedKbId);
        }
      },
      (err) => {
        console.error(err);
        setIsGenerating(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    'Sorry, an error occurred while processing your request. Please ensure your backend and database are active.',
                }
              : m
          )
        );
      }
    );
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Navbar
        user={user}
        knowledgeBases={knowledgeBases}
        selectedKbId={selectedKbId}
        onSelectKb={(id) => setSelectedKbId(id)}
      />

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Conversations Sidebar */}
        <aside className="w-72 bg-slate-950 border-r border-slate-800/80 hidden md:flex flex-col p-4 space-y-4">
          <Button onClick={handleStartNewChat} className="w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> New Chat
          </Button>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block px-2 mb-2">
              Recent Conversations
            </span>
            {conversations.length === 0 ? (
              <div className="text-xs text-slate-500 px-2 py-4 text-center">No history yet</div>
            ) : (
              conversations.map((conv) => {
                const isActive = currentConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/chat/${conv.id}`)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all group ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      <span className="truncate">{conv.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Chat Interface */}
        <main className="flex-1 flex flex-col bg-slate-900/30 overflow-hidden relative">
          {/* Header Controls */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-sm text-white">
                {currentConversation ? currentConversation.title : 'New RAG Session'}
              </span>
            </div>

            <ResponseModeSelector value={responseMode} onChange={(m) => setResponseMode(m)} />
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">How can I help you today?</h2>
                <p className="text-xs text-slate-400 max-w-md">
                  Ask any question regarding your indexed documents. The multi-agent pipeline will analyze, search, rerank, and verify evidence-grounded answers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full pt-4">
                  <button
                    onClick={() => handleSend('Summarize the main refund guidelines and eligibility criteria.')}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-left text-xs text-slate-300 transition-all hover:scale-[1.02]"
                  >
                    "Summarize refund guidelines and eligibility criteria."
                  </button>
                  <button
                    onClick={() => handleSend('Compare Plan A and Plan B refund policy after 15 days.')}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-left text-xs text-slate-300 transition-all hover:scale-[1.02]"
                  >
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
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3 bg-slate-900 border border-slate-800 focus-within:border-blue-500 rounded-2xl p-2 shadow-2xl transition-colors"
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
                placeholder="Ask questions about your documents (e.g. Compare policy rules...)..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none resize-none max-h-32"
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
