'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, Plus, MessageSquare, Trash2, Bot, Sparkles, Terminal } from 'lucide-react';
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

    setMessages((prev) => [...prev, userMsg]);

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
    <div className="h-screen bg-[#0d0d0d] text-white flex flex-col overflow-hidden font-sans">
      <Navbar
        user={user}
        knowledgeBases={knowledgeBases}
        selectedKbId={selectedKbId}
        onSelectKb={(id) => setSelectedKbId(id)}
      />

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Conversations Sidebar */}
        <aside className="w-72 bg-[#0d0d0d] border-r border-[#262626] hidden md:flex flex-col p-4 space-y-4">
          <Button onClick={handleStartNewChat} className="w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> New Session
          </Button>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <span className="text-[10px] font-mono font-bold text-[#6f6f6f] uppercase tracking-widest block px-2 mb-3">
              RECENT SESSIONS
            </span>
            {conversations.length === 0 ? (
              <div className="text-xs font-mono text-[#6f6f6f] px-2 py-4 text-center">No past sessions</div>
            ) : (
              conversations.map((conv) => {
                const isActive = currentConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/chat/${conv.id}`)}
                    className={`flex items-center justify-between p-3 rounded-lg text-xs font-medium cursor-pointer transition-all group ${
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
        </aside>

        {/* Main Chat Interface */}
        <main className="flex-1 flex flex-col bg-[#121212] overflow-hidden relative">
          {/* Header Controls */}
          <div className="p-4 border-b border-[#262626] bg-[#0d0d0d]/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#f84525]" />
              <span className="font-display font-bold uppercase tracking-wider text-xs text-white">
                {currentConversation ? currentConversation.title : 'SESSION // MULTI-AGENT SWARM'}
              </span>
            </div>

            <ResponseModeSelector value={responseMode} onChange={(m) => setResponseMode(m)} />
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#f84525] shadow-2xl">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <div className="section-tag justify-center mb-2">02 // MULTI-AGENT CHAT</div>
                  <h2 className="text-2xl font-extrabold uppercase font-display text-white tracking-tight">
                    INTELLIGENT KNOWLEDGE RETRIEVAL
                  </h2>
                  <p className="text-xs text-[#9c9c9c] max-w-md mx-auto mt-2 leading-relaxed">
                    Ask any detailed question regarding your uploaded knowledge base. The Gemini multi-agent swarm will query vector indexes, rerank facts, and generate grounded answers.
                  </p>
                </div>

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
                placeholder="Inquire about indexed documents (e.g. Compare policy rules...)..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none resize-none max-h-32 font-sans"
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
