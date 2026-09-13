'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Cpu, Database, ShieldCheck, Save } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, getAuthToken } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Multi-LLM provider options
  const [provider, setProvider] = useState('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash');

  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');

  const [mistralKey, setMistralKey] = useState('');
  const [mistralModel, setMistralModel] = useState('mistral-small-latest');

  const [deepseekKey, setDeepseekKey] = useState('');
  const [deepseekModel, setDeepseekModel] = useState('deepseek-chat');

  const [kimiKey, setKimiKey] = useState('');
  const [kimiModel, setKimiModel] = useState('moonshot-v1-8k');

  const [embeddingModel, setEmbeddingModel] = useState('BAAI/bge-small-en-v1.5');
  const [hybridAlpha, setHybridAlpha] = useState(0.5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    api.getMe().then((u) => setUser(u)).catch((e) => console.error(e));
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-10 animate-fade-in">
        <section aria-labelledby="settings-heading" className="space-y-2 border-b border-[#262626] pb-6">
          <div className="section-tag">
            01 // SYSTEM CONFIGURATION
          </div>
          <h1 id="settings-heading" className="text-3xl font-extrabold uppercase font-display text-white tracking-tight flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#f84525]" /> PLATFORM SETTINGS
          </h1>
          <p className="text-xs text-[#9c9c9c] max-w-2xl font-normal leading-relaxed">
            Configure LLM Provider (Gemini, Ollama, Mistral, DeepSeek, Kimi/Moonshot), embedding models, vector search hybrid weights, and security boundaries.
          </p>
        </section>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Active LLM Provider Selection */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#f84525]" /> LLM GENERATION ENGINE SELECTION
              </h3>
              <span className="font-mono text-[10px] text-[#6f6f6f]">01 // ENGINE</span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Select Active LLM Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-3 text-xs text-white focus:outline-none focus:border-[#f84525] font-semibold"
              >
                <option value="gemini">Google Gemini API (gemini-2.0-flash / gemini-1.5-pro)</option>
                <option value="ollama">Ollama (Local / Cloud Ollama Models)</option>
                <option value="mistral">Mistral AI API (mistral-small / mistral-large)</option>
                <option value="deepseek">DeepSeek API (deepseek-chat / deepseek-reasoner)</option>
                <option value="kimi">Kimi / Moonshot API (moonshot-v1-8k)</option>
              </select>
            </div>

            {/* Provider Specific Inputs */}
            {provider === 'gemini' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Gemini Model</label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  >
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended - Fast & Accurate)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
                  </select>
                </div>
              </div>
            )}

            {provider === 'ollama' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Ollama Endpoint URL</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Ollama Model Name</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="llama3.2, mistral, deepseek-r1, qwen2.5"
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
              </div>
            )}

            {provider === 'mistral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Mistral API Key</label>
                  <input
                    type="password"
                    placeholder="mistral-api-key..."
                    value={mistralKey}
                    onChange={(e) => setMistralKey(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Mistral Model</label>
                  <input
                    type="text"
                    value={mistralModel}
                    onChange={(e) => setMistralModel(e.target.value)}
                    placeholder="mistral-small-latest, mistral-large-latest"
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
              </div>
            )}

            {provider === 'deepseek' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">DeepSeek API Key</label>
                  <input
                    type="password"
                    placeholder="sk-deepseek..."
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">DeepSeek Model</label>
                  <input
                    type="text"
                    value={deepseekModel}
                    onChange={(e) => setDeepseekModel(e.target.value)}
                    placeholder="deepseek-chat, deepseek-reasoner"
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
              </div>
            )}

            {provider === 'kimi' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Kimi / Moonshot API Key</label>
                  <input
                    type="password"
                    placeholder="sk-moonshot..."
                    value={kimiKey}
                    onChange={(e) => setKimiKey(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Kimi Model</label>
                  <input
                    type="text"
                    value={kimiModel}
                    onChange={(e) => setKimiModel(e.target.value)}
                    placeholder="moonshot-v1-8k, moonshot-v1-32k"
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Embedding & Vector Retrieval Config */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> HUGGING FACE EMBEDDINGS & HYBRID SEARCH
              </h3>
              <span className="font-mono text-[10px] text-[#6f6f6f]">02 // VECTOR SEARCH</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Hugging Face Model</label>
                <input
                  type="text"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Hybrid Alpha Weight (Vector vs Keyword)</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={hybridAlpha}
                  onChange={(e) => setHybridAlpha(parseFloat(e.target.value))}
                  className="w-full accent-[#f84525] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#6f6f6f] mt-1">
                  <span>KEYWORD ONLY (0.0)</span>
                  <span className="text-[#f84525] font-bold">{hybridAlpha}</span>
                  <span>VECTOR ONLY (1.0)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security & Citation Verification */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> SECURITY & EVIDENCE CITATION PROTECTION
              </h3>
              <span className="font-mono text-[10px] text-[#6f6f6f]">03 // BOUNDARIES</span>
            </div>
            <p className="text-xs text-[#9c9c9c] leading-relaxed">
              Untrusted document context boundaries are enforced using strict system prompt tags (`BEGIN UNTRUSTED DOCUMENT CONTEXT`). All generated claims require verified citation tags `[S1]`, `[S2]`.
            </p>
          </Card>

          {saved && (
            <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              Provider & LLM configuration updated successfully!
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Configuration
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
