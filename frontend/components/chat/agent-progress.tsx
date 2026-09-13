'use client';

import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface AgentProgressProps {
  steps: ProgressStep[];
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 my-3 text-xs space-y-3 animate-fade-in shadow-xl">
      <div className="font-mono text-[11px] uppercase tracking-wider flex items-center justify-between border-b border-[#262626] pb-2">
        <span className="flex items-center gap-2 text-[#f84525] font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f84525] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f84525]"></span>
          </span>
          03 // MULTI-AGENT SWARM EXECUTING
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[11px]">
        {steps.map((step) => {
          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                step.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : step.status === 'active'
                  ? 'bg-[#f84525]/10 text-[#f84525] border-[#f84525]/40 animate-pulse'
                  : 'bg-[#0d0d0d] text-[#6f6f6f] border-[#262626]'
              }`}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : step.status === 'active' ? (
                <Loader2 className="w-3.5 h-3.5 text-[#f84525] animate-spin shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-[#6f6f6f] shrink-0" />
              )}
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
