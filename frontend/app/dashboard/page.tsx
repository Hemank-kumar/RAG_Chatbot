'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus, FileText, Database, MessageSquare, Plus, ArrowRight, Bot, ShieldCheck, Layers } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { api, getAuthToken } from '@/lib/api';
import { Workspace, KnowledgeBase } from '@/types';

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
      console.error(err);
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading AgentRAG Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        user={user}
        knowledgeBases={knowledgeBases}
        selectedKbId={selectedKbId}
        onSelectKb={(id) => setSelectedKbId(id)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Workspace Overview
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Hello, {user?.full_name || user?.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Welcome to your Multi-Agent RAG platform. Process documents with Hugging Face embeddings, pgvector storage, and Gemini API multi-agent query orchestration.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <Button onClick={() => setIsKbModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Knowledge Base
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/chat')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" /> Start Chat
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Knowledge Bases</span>
              <span className="block text-2xl font-bold text-white mt-0.5">{knowledgeBases.length}</span>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Active Documents</span>
              <span className="block text-2xl font-bold text-white mt-0.5">
                {knowledgeBases.reduce((acc, kb) => acc + (kb.document_count || 0), 0)}
              </span>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Vector Index</span>
              <span className="block text-2xl font-bold text-emerald-400 mt-0.5">pgvector HNSW</span>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Multi-Agent Engine</span>
              <span className="block text-2xl font-bold text-white mt-0.5">Gemini 2.5</span>
            </div>
          </Card>
        </div>

        {/* Knowledge Bases List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Knowledge Bases</h2>
          </div>

          {knowledgeBases.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-3xl">
              <FolderPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Knowledge Bases Created Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create a knowledge base to upload company policies, product documentation, personal notes, or research papers.
              </p>
              <Button onClick={() => setIsKbModalOpen(true)} className="mt-4">
                Create First Knowledge Base
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {knowledgeBases.map((kb) => (
                <div
                  key={kb.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <FolderPlus className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                        {kb.document_count || 0} Docs
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                        {kb.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {kb.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center gap-3">
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
                      Manage Docs
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New KB Modal */}
      <Modal isOpen={isKbModalOpen} onClose={() => setIsKbModalOpen(false)} title="Create Knowledge Base">
        <form onSubmit={handleCreateKb} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Knowledge Base Name</label>
            <input
              type="text"
              required
              value={newKbName}
              onChange={(e) => setNewKbName(e.target.value)}
              placeholder="e.g. HR Policies & Employee Handbook"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
            <textarea
              rows={3}
              value={newKbDesc}
              onChange={(e) => setNewKbDesc(e.target.value)}
              placeholder="Company guidelines, refund policy, and benefit details..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
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
