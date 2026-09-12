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
    <div className="mt-4 pt-3 border-t border-slate-800/60 animate-fade-in">
      <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium mb-2">
        <HelpCircle className="w-3.5 h-3.5" />
        Suggested Follow-up Questions
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-900/80 hover:bg-blue-600/10 text-slate-300 hover:text-blue-300 border border-slate-800 hover:border-blue-500/30 transition-all text-left group"
          >
            <span>{q}</span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
