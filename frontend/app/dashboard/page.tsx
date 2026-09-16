'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus, FileText, Database, MessageSquare, Plus, ArrowRight, Bot, ShieldCheck, Layers, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { api, getAuthToken, removeAuthToken } from '@/lib/api';
import { Workspace, KnowledgeBase } from '@/types';

import { ThreeDModel } from '@/components/ui/three-model';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // New KB Modal state
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');
  const [isCreatingKb, setIsCreatingKb] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    fetchInitialData();
  }, [router]);

  const fetchInitialData = async () => {
    try {
      const u = await api.getMe();
      setUser(u);

      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaces[0]) return;

    setIsCreatingKb(true);
    try {
      const newKb = await api.createKnowledgeBase({
        name: newKbName,
        description: newKbDesc,
        workspace_id: workspaces[0].id,
      });
      setKnowledgeBases([...knowledgeBases, newKb]);
      setSelectedKbId(newKb.id);
      setIsKbModalOpen(false);
      setNewKbName('');
      setNewKbDesc('');
    } catch (err) {
      alert('Failed to create Knowledge Base');
    } finally {
      setIsCreatingKb(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-[#9c9c9c] font-mono text-xs uppercase tracking-widest">
        <span className="w-2 h-2 bg-[#f84525] rounded-full animate-ping mr-3" />
        Loading AgentRAG Workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white flex flex-col font-sans">
      <Navbar
        user={user}
        knowledgeBases={knowledgeBases}
        selectedKbId={selectedKbId}
        onSelectKb={(id) => setSelectedKbId(id)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12 animate-fade-in">
        {/* Davide Cattaneo Inspired 3D Interactive Hero Section */}
        <section aria-labelledby="overview-heading" className="bg-[#12141c]/70 backdrop-blur-xl border border-[#232838] p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f84525]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#00f0ff]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Text & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="section-tag font-mono text-xs tracking-[0.25em] text-[#f84525] uppercase font-extrabold flex items-center gap-2">
                01 // CREATIVE DATA & MULTI-AGENT ENGINE
              </div>

              <div className="space-y-3">
                <h1 id="overview-heading" className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-white font-display leading-tight">
                  WELCOME, <span className="text-[#f84525]">{user?.full_name || user?.email?.split('@')[0]}</span>
                </h1>
                <p className="text-sm md:text-base text-[#9c9c9c] font-normal leading-relaxed max-w-xl">
                  Transforming complex document repositories into evidence-grounded AI intelligence. Powered by 3D WebGL vector space visualization, Hugging Face embeddings, pgvector HNSW indexing, and multi-agent synthesis.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button onClick={() => setIsKbModalOpen(true)} size="lg" className="flex items-center gap-2 shadow-[0_4px_20px_rgba(248,69,37,0.3)]">
                  <Plus className="w-4 h-4" /> New Knowledge Base
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/chat')}
                  className="flex items-center gap-2 border-[#262626] hover:border-[#f84525]"
                >
                  <MessageSquare className="w-4 h-4 text-[#f84525]" /> Launch Chat Engine
                </Button>
              </div>
            </div>

            {/* Interactive 3D Model Sphere */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full bg-[#08090d]/80 border border-[#232838] rounded-2xl p-4 shadow-2xl relative">
                <div className="text-[10px] font-mono text-[#f84525] uppercase tracking-widest font-bold mb-2 flex items-center justify-between border-b border-[#1c2130] pb-2">
                  <span>02 // 3D VECTOR SPACE CORE</span>
                  <span className="animate-pulse">● LIVE WEBGL</span>
                </div>
                <ThreeDModel height="h-64 sm:h-72" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid Section */}
        <section aria-label="System Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-[#0d0d0d] border border-[#262626] flex items-center justify-center text-[#f84525]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#6f6f6f]">Knowledge Bases</span>
              <span className="block text-2xl font-bold text-white font-display mt-0.5">{knowledgeBases.length}</span>
            </div>
          </Card>

          <Card className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-[#0d0d0d] border border-[#262626] flex items-center justify-center text-[#f84525]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#6f6f6f]">Active Documents</span>
              <span className="block text-2xl font-bold text-white font-display mt-0.5">
                {knowledgeBases.reduce((acc, kb) => acc + (kb.document_count || 0), 0)}
              </span>
            </div>
          </Card>

          <Card className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-[#0d0d0d] border border-[#262626] flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#6f6f6f]">Vector Index</span>
              <span className="block text-xl font-bold text-emerald-400 font-display mt-0.5">pgvector HNSW</span>
            </div>
          </Card>

          <Card className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-[#0d0d0d] border border-[#262626] flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#6f6f6f]">Agent Swarm</span>
              <span className="block text-xl font-bold text-indigo-400 font-display mt-0.5">Gemini 2.5 Multi-Agent</span>
            </div>
          </Card>
        </section>

        {/* Knowledge Bases List Section */}
        <section aria-labelledby="kb-heading" className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4">
            <div>
              <div className="section-tag">
                02 // KNOWLEDGE ENGINE
              </div>
              <h2 id="kb-heading" className="text-xl font-extrabold uppercase text-white font-display tracking-tight mt-1">
                ACTIVE KNOWLEDGE BASES
              </h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsKbModalOpen(true)}>
              + Add KB
            </Button>
          </div>

          {knowledgeBases.length === 0 ? (
            <div className="text-center py-16 bg-[#141414] border border-[#262626] rounded-2xl p-8">
              <FolderPlus className="w-12 h-12 text-[#6f6f6f] mx-auto mb-4" />
              <h3 className="text-base font-display font-bold uppercase tracking-wider text-white">No Knowledge Bases Configured</h3>
              <p className="text-xs text-[#9c9c9c] mt-2 max-w-md mx-auto">
                Create a knowledge base to index enterprise documents, policy handbooks, API specs, and research logs for multi-agent querying.
              </p>
              <Button onClick={() => setIsKbModalOpen(true)} className="mt-6">
                Create First Knowledge Base
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {knowledgeBases.map((kb, index) => (
                <div
                  key={kb.id}
                  className="bg-[#141414] border border-[#262626] rounded-xl p-6 hover:border-[#f84525]/60 transition-all flex flex-col justify-between group shadow-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#6f6f6f] font-bold">
                        {String(index + 1).padStart(2, '0')} // KB
                      </span>
                      <Badge variant="flame">
                        {kb.document_count || 0} DOCS
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-white text-base uppercase tracking-wider group-hover:text-[#f84525] transition-colors">
                        {kb.name}
                      </h3>
                      <p className="text-xs text-[#9c9c9c] mt-2 line-clamp-2 leading-relaxed">
                        {kb.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#262626] flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedKbId(kb.id);
                        router.push('/chat');
                      }}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <span>Query KB</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedKbId(kb.id);
                        router.push('/documents');
                      }}
                      className="w-full"
                    >
                      Docs
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* New KB Modal */}
      <Modal isOpen={isKbModalOpen} onClose={() => setIsKbModalOpen(false)} title="Create Knowledge Base">
        <form onSubmit={handleCreateKb} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Knowledge Base Name</label>
            <input
              type="text"
              required
              value={newKbName}
              onChange={(e) => setNewKbName(e.target.value)}
              placeholder="e.g. Enterprise Security Policies 2026"
              className="w-full bg-[#161616] border border-[#262626] rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f84525] transition-colors font-sans"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Description (Optional)</label>
            <textarea
              rows={3}
              value={newKbDesc}
              onChange={(e) => setNewKbDesc(e.target.value)}
              placeholder="Internal compliance rules, SOC2 documentation, and API key policies..."
              className="w-full bg-[#161616] border border-[#262626] rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f84525] transition-colors font-sans"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
            <Button type="button" variant="ghost" onClick={() => setIsKbModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreatingKb}>
              Create Knowledge Base
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
