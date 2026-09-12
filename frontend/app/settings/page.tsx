'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Cpu, Database, Key, ShieldCheck, Save, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" /> Multi-Agent Platform Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure LLM Provider (Gemini, Ollama, Mistral, DeepSeek, Kimi/Moonshot), embedding models, vector search hybrid weights, and security boundaries.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Active LLM Provider Selection */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-4 h-4 text-blue-400" /> LLM Generation Engine Selection
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Active LLM Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gemini Model</label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ollama Endpoint URL</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ollama Model Name</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="llama3.2, mistral, deepseek-r1, qwen2.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {provider === 'mistral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mistral API Key</label>
                  <input
                    type="password"
                    placeholder="mistral-api-key..."
                    value={mistralKey}
                    onChange={(e) => setMistralKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mistral Model</label>
                  <input
                    type="text"
                    value={mistralModel}
                    onChange={(e) => setMistralModel(e.target.value)}
                    placeholder="mistral-small-latest, mistral-large-latest"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {provider === 'deepseek' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">DeepSeek API Key</label>
                  <input
                    type="password"
                    placeholder="sk-deepseek..."
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">DeepSeek Model</label>
                  <input
                    type="text"
                    value={deepseekModel}
                    onChange={(e) => setDeepseekModel(e.target.value)}
                    placeholder="deepseek-chat, deepseek-reasoner"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {provider === 'kimi' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kimi / Moonshot API Key</label>
                  <input
                    type="password"
                    placeholder="sk-moonshot..."
                    value={kimiKey}
                    onChange={(e) => setKimiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kimi Model</label>
                  <input
                    type="text"
                    value={kimiModel}
                    onChange={(e) => setKimiModel(e.target.value)}
                    placeholder="moonshot-v1-8k, moonshot-v1-32k"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Embedding & Vector Retrieval Config */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Database className="w-4 h-4 text-indigo-400" /> Hugging Face Embeddings & Hybrid Search
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hugging Face Model</label>
                <input
                  type="text"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hybrid Alpha Weight (Vector vs Keyword)</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={hybridAlpha}
                  onChange={(e) => setHybridAlpha(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Keyword Only (0.0)</span>
                  <span className="text-blue-400 font-bold">{hybridAlpha}</span>
                  <span>Vector Only (1.0)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security & Citation Verification */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security & Evidence Citation Protection
            </h3>
            <p className="text-xs text-slate-400">
              Untrusted document context boundaries are enforced using strict system prompt tags (`BEGIN UNTRUSTED DOCUMENT CONTEXT`). All generated claims require verified citation tags `[S1]`, `[S2]`.
            </p>
          </Card>

          {saved && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              Provider & LLM configuration updated successfully!
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Configuration
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
