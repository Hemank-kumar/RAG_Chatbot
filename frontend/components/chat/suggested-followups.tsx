'use client';

import React from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

interface SuggestedFollowupsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export const SuggestedFollowups: React.FC<SuggestedFollowupsProps> = ({ questions, onSelect }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-[#262626] animate-fade-in">
      <div className="flex items-center gap-1.5 text-xs text-[#f84525] font-mono uppercase tracking-wider mb-2 font-bold">
        <HelpCircle className="w-3.5 h-3.5" />
        SUGGESTED FOLLOW-UP INQUIRIES
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-[#161616] hover:bg-[#202020] text-[#9c9c9c] hover:text-white border border-[#262626] hover:border-[#f84525]/40 transition-all text-left group"
          >
            <span>{q}</span>
            <ArrowRight className="w-3 h-3 text-[#6f6f6f] group-hover:text-[#f84525] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
