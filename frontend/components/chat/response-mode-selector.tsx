'use client';

import React from 'react';
import { Sliders } from 'lucide-react';
import { ResponseMode } from '@/types';

interface ResponseModeSelectorProps {
  value: ResponseMode;
  onChange: (mode: ResponseMode) => void;
}

const MODES: { value: ResponseMode; label: string; desc: string }[] = [
  { value: 'Detailed', label: 'Detailed', desc: 'Thorough, balanced evidence explanation' },
  { value: 'Brief', label: 'Brief', desc: 'Concise summary focused on core facts' },
  { value: 'Technical', label: 'Technical', desc: 'Deep technical breakdown with exact terminology' },
  { value: 'Beginner', label: 'Beginner', desc: 'Simple, jargon-free explanations' },
  { value: 'Explain with example', label: 'Explain with example', desc: 'Includes practical scenario/worked example' },
];

export const ResponseModeSelector: React.FC<ResponseModeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2 bg-[#161616] border border-[#262626] px-3 py-1.5 rounded-md text-xs font-mono">
      <Sliders className="w-3.5 h-3.5 text-[#f84525]" />
      <span className="text-[#6f6f6f] uppercase tracking-wider text-[10px]">MODE:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ResponseMode)}
        className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value} className="bg-[#161616] text-white">
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
};
