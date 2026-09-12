'use client';

import React, { useState } from 'react';
import { FileText, ExternalLink, X } from 'lucide-react';
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
        className="inline-flex items-center gap-1 px-1.5 py-0.5 ml-1 text-xs font-semibold rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
        title={`View evidence source: ${citation.document_name}`}
      >
        {citation.citation_label}
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold truncate">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{citation.document_name}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-slate-300">
            {(citation.page_number || citation.section) && (
              <div className="flex items-center gap-3 text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
                {citation.page_number && <span>Page: {citation.page_number}</span>}
                {citation.section && <span className="truncate">Section: {citation.section}</span>}
              </div>
            )}

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
              <p className="italic text-slate-300 font-mono text-[11px]">"{citation.excerpt}"</p>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};
