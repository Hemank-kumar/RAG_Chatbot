'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { DocumentUploader } from '@/components/documents/document-uploader';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentPreviewModal } from '@/components/documents/document-preview-modal';
import { api, getAuthToken, removeAuthToken } from '@/lib/api';
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
      console.error('Authentication/initialization error:', err);
      removeAuthToken();
      router.push('/login');
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
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans">
      <Navbar
        user={user}
        knowledgeBases={knowledgeBases}
        selectedKbId={selectedKbId}
        onSelectKb={(id) => setSelectedKbId(id)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10 animate-fade-in">
        <section aria-labelledby="documents-heading" className="space-y-2 border-b border-[#262626] pb-6">
          <div className="section-tag">
            01 // DOCUMENT STORAGE
          </div>
          <h1 id="documents-heading" className="text-3xl font-extrabold uppercase font-display text-white tracking-tight">
            DOCUMENT MANAGEMENT
          </h1>
          <p className="text-xs text-[#9c9c9c] max-w-xl font-normal leading-relaxed">
            Upload, chunk, embed into pgvector vector storage, re-index, and manage enterprise knowledge base assets.
          </p>
        </section>

        {/* Uploader Section */}
        <DocumentUploader
          knowledgeBaseId={selectedKbId}
          onSuccess={() => selectedKbId && fetchDocuments(selectedKbId)}
        />

        {/* Document Table */}
        <section aria-labelledby="indexed-docs-heading" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h2 id="indexed-docs-heading" className="text-base font-display font-bold uppercase tracking-wider text-white">
              INDEXED DOCUMENTS ({documents.length})
            </h2>
          </div>
          <DocumentList
            documents={documents}
            onRefresh={() => selectedKbId && fetchDocuments(selectedKbId)}
            onPreview={(doc) => setPreviewDoc(doc)}
          />
        </section>
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
