'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Cpu, Database, ShieldCheck, Save, Key, AlertTriangle, CheckCircle2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, getAuthToken, removeAuthToken } from '@/lib/api';
import { PROVIDERS_REGISTRY, ALL_MODEL_OPTIONS } from '@/lib/models';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // API Keys dictionary stored in localStorage
  const [apiKeys, setApiKeys] = useState<{ [provider: string]: string }>({
    gemini: '',
    openai: '',
    anthropic: '',
    groq: '',
    deepseek: '',
    mistral: '',
    kimi: '',
  });

  const [showKeys, setShowKeys] = useState<{ [provider: string]: boolean }>({});
  const [selectedActiveModelId, setSelectedActiveModelId] = useState('gemini-2.0-flash');
  const [embeddingModel, setEmbeddingModel] = useState('BAAI/bge-small-en-v1.5');
  const [hybridAlpha, setHybridAlpha] = useState(0.5);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .getMe()
      .then((u) => setUser(u))
      .catch((e) => {
        console.error('Settings auth error:', e);
        removeAuthToken();
        router.push('/login');
      });

    // Load stored API keys and active model from localStorage
    const stored = localStorage.getItem('user_custom_api_keys');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setApiKeys((prev) => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error('Failed to parse API keys:', err);
      }
    }

    const storedModel = localStorage.getItem('user_selected_model_id');
    if (storedModel) {
      setSelectedActiveModelId(storedModel);
    }
  }, [router]);

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleClearKey = (provider: string) => {
    const updated = { ...apiKeys, [provider]: '' };
    setApiKeys(updated);
    localStorage.setItem('user_custom_api_keys', JSON.stringify(updated));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_custom_api_keys', JSON.stringify(apiKeys));
    localStorage.setItem('user_selected_model_id', selectedActiveModelId);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const configuredProviders = Object.entries(apiKeys).filter(([_, val]) => val.trim().length > 0);
  const hasAnyApiKey = configuredProviders.length > 0;

  const providersList = [
    { id: 'gemini', name: 'Google Gemini', placeholder: 'AIzaSy...', docs: 'https://aistudio.google.com/app/apikey', recommended: true },
    { id: 'openai', name: 'OpenAI (GPT-4o)', placeholder: 'sk-proj-...', docs: 'https://platform.openai.com/api-keys' },
    { id: 'anthropic', name: 'Anthropic (Claude 3.5)', placeholder: 'sk-ant-api03-...', docs: 'https://console.anthropic.com/settings/keys' },
    { id: 'groq', name: 'Groq (Llama 3.3)', placeholder: 'gsk_...', docs: 'https://console.groq.com/keys' },
    { id: 'deepseek', name: 'DeepSeek AI', placeholder: 'sk-...', docs: 'https://platform.deepseek.com/' },
    { id: 'mistral', name: 'Mistral AI', placeholder: '...', docs: 'https://console.mistral.ai/' },
    { id: 'kimi', name: 'Kimi / Moonshot AI', placeholder: 'sk-moonshot-...', docs: 'https://platform.moonshot.cn/' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-10 animate-fade-in">
        <section aria-labelledby="settings-heading" className="space-y-2 border-b border-[#262626] pb-6">
          <div className="section-tag">01 // SYSTEM CONFIGURATION</div>
          <h1 id="settings-heading" className="text-3xl font-extrabold uppercase font-display text-white tracking-tight flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#f84525]" /> PLATFORM & MODEL API KEYS
          </h1>
          <p className="text-xs text-[#9c9c9c] max-w-2xl font-normal leading-relaxed">
            Configure model API keys (Google Gemini, OpenAI, Claude, Groq, DeepSeek, Mistral, Kimi) to enable AI chat generation and multi-agent synthesis.
          </p>
        </section>

        {/* API Key Requirement Alert Box */}
        <div className={`p-4 rounded-xl border flex items-start gap-4 transition-colors ${
          hasAnyApiKey 
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
            : 'bg-[#f84525]/10 border-[#f84525]/40 text-white'
        }`}>
          {hasAnyApiKey ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[#f84525] shrink-0 mt-0.5 animate-pulse" />
          )}
          <div className="space-y-1 text-xs">
            <div className="font-mono font-bold uppercase tracking-wider">
              {hasAnyApiKey 
                ? `✓ ACTIVE API KEY CONFIGURED (${configuredProviders.length} PROVIDER(S) READY)`
                : '⚠️ ACTION REQUIRED: SET AT LEAST ONE MODEL API KEY'}
            </div>
            <p className="text-[#9c9c9c] leading-relaxed">
              {hasAnyApiKey 
                ? `Ready for AI synthesis. Active providers: ${configuredProviders.map(([p]) => p.toUpperCase()).join(', ')}.`
                : 'Please enter and save an API key for at least one model provider below (e.g., Google Gemini, OpenAI, Anthropic, or Groq) so the multi-agent chat engine can generate answers.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Active Model Selection Card */}
          <Card className="space-y-5 border-[#f84525]/40 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#f84525]" /> ACTIVE AI MODEL SELECTION
              </h3>
              <span className="font-mono text-[10px] text-[#f84525] font-bold">00 // ACTIVE MODEL</span>
            </div>

            <p className="text-xs text-[#9c9c9c]">
              Select the primary AI Model Engine to handle query reasoning and multi-agent synthesis in Chat:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_MODEL_OPTIONS.map((m) => {
                const isSelected = m.id === selectedActiveModelId;
                const hasKey = Boolean(apiKeys[m.provider]?.trim());

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedActiveModelId(m.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-[#1c1c1c] border-[#f84525] shadow-lg text-white font-bold'
                        : 'bg-[#121212] border-[#262626] hover:border-[#f84525]/50 text-[#9c9c9c] hover:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <span className="font-mono text-xs font-bold text-white block truncate">{m.displayName}</span>
                        <span className="text-[10px] font-mono text-[#6f6f6f] block">{m.providerName}</span>
                      </div>
                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        isSelected ? 'bg-[#f84525] text-white' : 'bg-[#202020] text-[#888]'
                      }`}>
                        {m.tag}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#888888] line-clamp-2 leading-relaxed">{m.description}</p>

                    <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[9px] font-mono">
                      {hasKey ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> API Key Ready
                        </span>
                      ) : (
                        <span className="text-[#6f6f6f]">Key Needed</span>
                      )}
                      {isSelected && (
                        <span className="text-[#f84525] font-bold uppercase tracking-wider">ACTIVE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Provider API Keys Card */}
          <Card className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[#f84525]" /> MODEL PROVIDER API KEYS & DYNAMIC SELECTION
              </h3>
              <span className="font-mono text-[10px] text-[#6f6f6f]">01 // PROVIDERS & MODELS</span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {PROVIDERS_REGISTRY.map((p) => {
                const keyVal = apiKeys[p.id] || '';
                const isConfigured = keyVal.trim().length > 0;
                const isVisible = showKeys[p.id];

                return (
                  <div
                    key={p.id}
                    className={`p-4.5 rounded-xl border transition-all space-y-3 ${
                      isConfigured ? 'bg-[#141414] border-emerald-500/30' : 'bg-[#121212] border-[#262626]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{p.name}</span>
                        {p.recommended && (
                          <span className="text-[9px] font-mono uppercase bg-[#f84525]/20 text-[#f84525] px-1.5 py-0.5 rounded font-bold">
                            RECOMMENDED
                          </span>
                        )}
                        {isConfigured ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> CONFIGURED
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase bg-[#202020] text-[#888] px-1.5 py-0.5 rounded font-bold">
                            NOT SET
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={p.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#6f6f6f] hover:text-[#f84525] font-mono underline"
                        >
                          Get Key ↗
                        </a>
                        {isConfigured && (
                          <button
                            type="button"
                            onClick={() => handleClearKey(p.id)}
                            className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={keyVal}
                        onChange={(e) => handleKeyChange(p.id, e.target.value)}
                        placeholder={p.placeholder}
                        className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-[#f84525] rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono text-white focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(p.id)}
                        className="absolute right-3 text-[#6f6f6f] hover:text-white transition-colors"
                        title={isVisible ? 'Hide key' : 'Show key'}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Supported Models List for this Provider */}
                    <div className="pt-2 border-t border-[#222222] space-y-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#6f6f6f] block font-bold">
                        SUPPORTED MODELS ({p.models.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {p.models.map((m) => (
                          <div
                            key={m.id}
                            className="p-2 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between text-xs"
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono text-[11px] font-medium text-white block truncate">{m.displayName}</span>
                              <span className="text-[9px] text-[#6f6f6f] block truncate">{m.description}</span>
                            </div>
                            <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#1c1c1c] text-[#f84525] font-bold shrink-0">
                              {m.tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Vector Search Configuration */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> EMBEDDING MODEL & HYBRID RETRIEVAL
              </h3>
              <span className="font-mono text-[10px] text-[#6f6f6f]">02 // RETRIEVAL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Embedding Model</label>
                <input
                  type="text"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#f84525]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Hybrid Search Weight (Vector vs Keyword)</label>
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
                  <span>KEYWORD (0.0)</span>
                  <span className="text-[#f84525] font-bold">{hybridAlpha}</span>
                  <span>VECTOR (1.0)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security & System Boundaries */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> PRIVACY & LOCAL PERSISTENCE
              </h3>
              <span className="font-mono text-[10px] text-[#6f6f6f]">03 // PRIVACY</span>
            </div>
            <p className="text-xs text-[#9c9c9c] leading-relaxed">
              Your API keys are stored exclusively inside your browser's local storage (<code className="text-white font-mono">localStorage</code>) and sent directly in HTTP headers to the execution pipeline per request.
            </p>
          </Card>

          {savedSuccess && (
            <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> API keys & platform configurations saved successfully!
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
