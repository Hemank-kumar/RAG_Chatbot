'use client';

import React, { useState } from 'react';
import { FileText, Trash2, RefreshCw, Eye } from 'lucide-react';
import { DocumentItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { api } from '@/lib/api';

interface DocumentListProps {
  documents: DocumentItem[];
  onRefresh: () => void;
  onPreview: (doc: DocumentItem) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onRefresh, onPreview }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document and its embeddings?')) return;
    setLoadingId(id);
    try {
      await api.deleteDocument(id);
      onRefresh();
    } catch (err) {
      alert('Failed to delete document.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReindex = async (id: string) => {
    setLoadingId(id);
    try {
      await api.reindexDocument(id);
      onRefresh();
    } catch (err) {
      alert('Failed to re-index document.');
    } finally {
      setLoadingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-14 bg-[#141414] border border-[#262626] rounded-xl p-6">
        <FileText className="w-10 h-10 text-[#6f6f6f] mx-auto mb-3" />
        <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[#9c9c9c]">
          NO DOCUMENTS INDEXED YET
        </h4>
        <p className="text-[11px] font-mono text-[#6f6f6f] mt-1 uppercase">
          Upload PDF, DOCX, TXT, MD or HTML files to populate vector store.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#e0e0e0]">
          <thead className="bg-[#0d0d0d] text-[#6f6f6f] font-mono text-[10px] border-b border-[#262626] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">DOCUMENT NAME</th>
              <th className="px-6 py-4">TYPE</th>
              <th className="px-6 py-4">SIZE</th>
              <th className="px-6 py-4">PAGES</th>
              <th className="px-6 py-4">CHUNKS</th>
              <th className="px-6 py-4">STATUS</th>
              <th className="px-6 py-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-[#161616] transition-colors">
                <td className="px-6 py-4 font-semibold text-white flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-[#161616] border border-[#262626] flex items-center justify-center text-[#f84525] shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate max-w-xs font-display uppercase tracking-wider text-xs" title={doc.filename}>
                    {doc.filename}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono uppercase text-[#6f6f6f] text-[11px]">{doc.file_type}</td>
                <td className="px-6 py-4 font-mono text-[11px]">{formatBytes(doc.file_size)}</td>
                <td className="px-6 py-4 font-mono text-[11px]">{doc.page_count}</td>
                <td className="px-6 py-4 font-mono font-bold text-[#f84525] text-[11px]">{doc.chunk_count}</td>
                <td className="px-6 py-4">
                  {doc.status === 'indexed' ? (
                    <Badge variant="flame">INDEXED</Badge>
                  ) : doc.status === 'processing' ? (
                    <Badge variant="warning">PROCESSING</Badge>
                  ) : (
                    <Badge variant="error">ERROR</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onPreview(doc)}
                      className="p-1.5 rounded text-[#6f6f6f] hover:text-white hover:bg-[#202020] transition-colors"
                      title="Inspect vector chunks"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReindex(doc.id)}
                      disabled={loadingId === doc.id}
                      className="p-1.5 rounded text-[#6f6f6f] hover:text-[#f84525] hover:bg-[#202020] transition-colors"
                      title="Re-index document"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingId === doc.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={loadingId === doc.id}
                      className="p-1.5 rounded text-[#6f6f6f] hover:text-rose-400 hover:bg-[#202020] transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
