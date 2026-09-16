'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, Key, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { ALL_MODEL_OPTIONS, ModelOption, PROVIDERS_REGISTRY } from '@/lib/models';

export { ALL_MODEL_OPTIONS as MODEL_OPTIONS };
export type { ModelOption };

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (option: ModelOption) => void;
  hasCustomKey: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  hasCustomKey,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentModel = ALL_MODEL_OPTIONS.find((m) => m.id === selectedModelId) || ALL_MODEL_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 relative z-50">
      {/* Model Selection Dropdown Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 bg-[#161616] border rounded-lg px-3 py-1.5 text-xs font-mono transition-all ${
            isOpen ? 'border-[#f84525] text-white ring-1 ring-[#f84525]/30' : 'border-[#262626] text-[#cccccc] hover:border-[#f84525]/60 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#f84525] shrink-0" />
          <span className="font-semibold text-white font-mono">{currentModel.displayName}</span>
          <span className="bg-[#f84525]/15 text-[#f84525] text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold shrink-0">
            {currentModel.tag}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#6f6f6f] transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
        </button>

        {/* Floating Options Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-80 bg-[#141414] border border-[#262626] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.95)] p-2 z-[100] font-sans max-h-96 overflow-y-auto">
            <div className="text-[10px] font-mono font-bold text-[#6f6f6f] uppercase tracking-widest px-2 py-1.5 border-b border-[#262626] flex items-center justify-between">
              <span>SELECT LLM ENGINE</span>
              <span className="text-[#f84525]">{ALL_MODEL_OPTIONS.length} MODELS</span>
            </div>

            <div className="py-1 space-y-3 mt-1">
              {PROVIDERS_REGISTRY.map((provider) => (
                <div key={provider.id} className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-[#f84525] uppercase tracking-wider px-2 py-0.5 bg-[#1a1a1a] rounded flex items-center justify-between">
                    <span>{provider.name}</span>
                    <span className="text-[9px] text-[#6f6f6f] font-normal">{provider.models.length} models</span>
                  </div>

                  {provider.models.map((opt) => {
                    const isSelected = opt.id === currentModel.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(opt);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#1e1e1e] text-[#f84525] font-bold border border-[#f84525]/40'
                            : 'text-[#9c9c9c] hover:bg-[#181818] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-[#f84525] shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className={`block truncate ${isSelected ? 'text-white' : ''}`}>{opt.displayName}</span>
                            <span className="text-[10px] font-mono text-[#6f6f6f] block truncate">{opt.description}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#222222] text-[#888888] font-bold shrink-0">
                          {opt.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#262626] mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/settings');
                }}
                className="w-full text-center py-1.5 px-2 rounded bg-[#1c1c1c] hover:bg-[#252525] text-xs font-mono text-[#f84525] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Manage API Keys in Settings</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Direct Settings Link Button */}
      <button
        type="button"
        onClick={() => router.push('/settings')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
          hasCustomKey
            ? 'bg-[#f84525]/15 text-[#f84525] border-[#f84525]/50 hover:bg-[#f84525]/25'
            : 'bg-[#161616] text-[#9c9c9c] border-[#262626] hover:border-[#f84525] hover:text-white'
        }`}
        title="Configure Provider API Keys in Settings"
      >
        <Key className="w-3.5 h-3.5" />
        <span>{hasCustomKey ? 'API Key: Active ↗' : 'Configure Keys ↗'}</span>
      </button>
    </div>
  );
};
