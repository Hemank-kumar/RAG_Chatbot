'use client';

import React, { useState } from 'react';
import { FileText, Trash2, RefreshCw, Eye, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { DocumentItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatBytes, formatDate } from '@/lib/utils';
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
      <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">No documents indexed yet</h4>
        <p className="text-xs text-slate-500 mt-1">Upload PDF, DOCX, TXT, MD or HTML files to start querying.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 font-medium border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Document Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Pages</th>
              <th className="px-6 py-4">Chunks</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 font-semibold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="truncate max-w-xs" title={doc.filename}>{doc.filename}</span>
                </td>
                <td className="px-6 py-4 font-mono uppercase text-slate-400">{doc.file_type}</td>
                <td className="px-6 py-4">{formatBytes(doc.file_size)}</td>
                <td className="px-6 py-4">{doc.page_count}</td>
                <td className="px-6 py-4 font-semibold text-blue-400">{doc.chunk_count}</td>
                <td className="px-6 py-4">
                  {doc.status === 'indexed' ? (
                    <Badge variant="success">Indexed</Badge>
                  ) : doc.status === 'processing' ? (
                    <Badge variant="info">Processing</Badge>
                  ) : (
                    <Badge variant="error">Error</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onPreview(doc)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Inspect chunks"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReindex(doc.id)}
                      disabled={loadingId === doc.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                      title="Re-index document"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingId === doc.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={loadingId === doc.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
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
