'use client';

import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { Citation } from '@/types';

interface CitationPopoverProps {
  citation: Citation;
}

export const CitationPopover: React.FC<CitationPopoverProps> = ({ citation }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="inline-block relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-2 py-0.5 ml-1 text-[11px] font-mono font-bold rounded bg-[#f84525]/10 text-[#f84525] hover:bg-[#f84525]/20 border border-[#f84525]/30 transition-all cursor-pointer"
        title={`View evidence source: ${citation.document_name}`}
      >
        {citation.citation_label}
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 sm:w-96 bg-[#0d0d0d] border border-[#262626] rounded-xl p-4 shadow-2xl animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-2">
            <div className="flex items-center gap-2 text-[#f84525] font-bold font-display uppercase tracking-wider truncate">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{citation.document_name}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#6f6f6f] hover:text-white p-0.5 rounded hover:bg-[#161616]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-[#9c9c9c]">
            {(citation.page_number || citation.section) && (
              <div className="flex items-center gap-3 text-[11px] font-mono text-[#6f6f6f] bg-[#161616] px-2.5 py-1 rounded border border-[#262626]">
                {citation.page_number && <span>PAGE: {citation.page_number}</span>}
                {citation.section && <span className="truncate">SECTION: {citation.section}</span>}
              </div>
            )}

            <div className="bg-[#161616] p-3 rounded border border-[#262626] text-white leading-relaxed max-h-48 overflow-y-auto">
              <p className="italic font-mono text-[11px] text-[#e0e0e0]">"{citation.excerpt}"</p>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};
