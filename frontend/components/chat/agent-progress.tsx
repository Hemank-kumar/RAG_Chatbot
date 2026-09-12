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
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 my-3 text-xs space-y-2 animate-fade-in shadow-inner">
      <div className="font-semibold text-slate-300 text-xs flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
        <span className="flex items-center gap-2 text-blue-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Multi-Agent Pipeline Executing
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {steps.map((step) => {
          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
                step.status === 'completed'
                  ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                  : step.status === 'active'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 animate-pulse'
                  : 'bg-slate-950/40 text-slate-500 border-slate-800'
              }`}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : step.status === 'active' ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
