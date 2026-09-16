'use client';

import React, { useState, useEffect } from 'react';
import { Key, Save, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: string;
  onSaveKeys: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  activeProvider,
  onSaveKeys,
}) => {
  const [keys, setKeys] = useState<{ [provider: string]: string }>({
    gemini: '',
    openai: '',
    anthropic: '',
    groq: '',
    deepseek: '',
    mistral: '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('user_custom_api_keys');
      if (stored) {
        try {
          setKeys(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('user_custom_api_keys', JSON.stringify(keys));
    setSavedSuccess(true);
    onSaveKeys();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleClear = (provider: string) => {
    const updated = { ...keys, [provider]: '' };
    setKeys(updated);
    localStorage.setItem('user_custom_api_keys', JSON.stringify(updated));
    onSaveKeys();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="USER API KEYS // CONFIGURATION">
      <div className="space-y-5 text-left font-sans">
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#f84525] shrink-0 mt-0.5" />
          <p className="text-xs text-[#9c9c9c] leading-relaxed">
            Your API keys are stored locally in your browser's <code className="text-white font-mono font-bold">localStorage</code> and transmitted directly to the execution pipeline. They are never logged or stored permanently on the server.
          </p>
        </div>

        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {[
            { id: 'gemini', label: 'Google Gemini API Key', placeholder: 'AIzaSy...' },
            { id: 'openai', label: 'OpenAI API Key', placeholder: 'sk-proj-...' },
            { id: 'anthropic', label: 'Anthropic Claude API Key', placeholder: 'sk-ant-api03-...' },
            { id: 'groq', label: 'Groq API Key', placeholder: 'gsk_...' },
            { id: 'deepseek', label: 'DeepSeek API Key', placeholder: 'sk-...' },
            { id: 'mistral', label: 'Mistral API Key', placeholder: '...' },
          ].map((item) => {
            const isCurrent = item.id === activeProvider;
            const hasVal = Boolean(keys[item.id]?.trim());

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-colors ${
                  isCurrent ? 'bg-[#161616] border-[#f84525]/50' : 'bg-[#121212] border-[#262626]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-[#f84525]" />
                    {item.label}
                    {isCurrent && (
                      <span className="text-[9px] font-mono bg-[#f84525]/20 text-[#f84525] uppercase px-1.5 py-0.5 rounded font-bold">
                        ACTIVE FOR SELECTED MODEL
                      </span>
                    )}
                  </label>
                  {hasVal && (
                    <button
                      onClick={() => handleClear(item.id)}
                      className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Key
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={keys[item.id] || ''}
                  onChange={(e) => setKeys({ ...keys, [item.id]: e.target.value })}
                  placeholder={item.placeholder}
                  className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-[#f84525] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none transition-colors"
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#262626] pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="flex items-center gap-2">
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
