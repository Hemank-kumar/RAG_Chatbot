'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { DocumentUploader } from '@/components/documents/document-uploader';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentPreviewModal } from '@/components/documents/document-preview-modal';
import { api, getAuthToken } from '@/lib/api';
import { KnowledgeBase, DocumentItem } from '@/types';

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      fetchDocuments(selectedKbId);
    }
  }, [selectedKbId]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async (kbId: string) => {
    try {
      const docs = await api.getDocuments(kbId);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        user={user}
        knowledgeBases={knowledgeBases}
        selectedKbId={selectedKbId}
        onSelectKb={(id) => setSelectedKbId(id)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Document Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload, chunk, embed into pgvector, re-index, and manage your knowledge base documents.
          </p>
        </div>

        {/* Uploader Section */}
        <DocumentUploader
          knowledgeBaseId={selectedKbId}
          onSuccess={() => selectedKbId && fetchDocuments(selectedKbId)}
        />

        {/* Document Table */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">Indexed Documents ({documents.length})</h2>
          <DocumentList
            documents={documents}
            onRefresh={() => selectedKbId && fetchDocuments(selectedKbId)}
            onPreview={(doc) => setPreviewDoc(doc)}
          />
        </div>
      </main>

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
