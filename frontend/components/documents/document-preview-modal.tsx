'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { DocumentItem, DocumentChunk } from '@/types';
import { api } from '@/lib/api';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document, isOpen, onClose }) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (document && isOpen) {
      setIsLoading(true);
      api
        .getDocumentChunks(document.id)
        .then((data) => setChunks(data))
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [document, isOpen]);

  if (!document) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Inspect Chunks: ${document.filename}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span>Type: <strong className="text-white font-mono">{document.file_type.toUpperCase()}</strong></span>
          <span>Pages: <strong className="text-white">{document.page_count}</strong></span>
          <span>Total Chunks: <strong className="text-blue-400 font-semibold">{document.chunk_count}</strong></span>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-400 text-xs">Loading chunk vectors...</div>
        ) : chunks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No chunk embeddings found.</div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-blue-400 font-mono">Chunk #{chunk.chunk_index}</span>
                  <span className="text-[11px] text-slate-400">
                    Page {chunk.metadata_json?.page_number || 1} • {chunk.metadata_json?.section || 'General'}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
