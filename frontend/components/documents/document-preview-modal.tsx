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
    <Modal isOpen={isOpen} onClose={onClose} title={`INSPECT CHUNKS // ${document.filename}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-[#6f6f6f] bg-[#161616] p-3 rounded-md border border-[#262626]">
          <span>TYPE: <strong className="text-white">{document.file_type.toUpperCase()}</strong></span>
          <span>PAGES: <strong className="text-white">{document.page_count}</strong></span>
          <span>TOTAL CHUNKS: <strong className="text-[#f84525] font-bold">{document.chunk_count}</strong></span>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-[#6f6f6f] font-mono text-xs uppercase tracking-widest">
            Loading pgvector chunk embeddings...
          </div>
        ) : chunks.length === 0 ? (
          <div className="text-center py-8 text-[#6f6f6f] font-mono text-xs uppercase tracking-widest">
            No chunk embeddings found.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="bg-[#161616] border border-[#262626] rounded-md p-4 text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                  <span className="font-bold text-[#f84525]">CHUNK #{chunk.chunk_index}</span>
                  <span className="text-[10px] text-[#6f6f6f]">
                    PAGE {chunk.metadata_json?.page_number || 1} • {chunk.metadata_json?.section || 'GENERAL'}
                  </span>
                </div>
                <p className="text-[#e0e0e0] leading-relaxed text-[11px] whitespace-pre-wrap font-mono">
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
