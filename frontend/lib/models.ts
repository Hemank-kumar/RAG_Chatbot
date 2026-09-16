export interface ModelOption {
  id: string;
  provider: string;
  providerName: string;
  name: string;
  displayName: string;
  tag: string;
  description: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  docs: string;
  placeholder: string;
  recommended?: boolean;
  models: ModelOption[];
}

export const PROVIDERS_REGISTRY: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    docs: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy...',
    recommended: true,
    models: [
      {
        id: 'gemini-2.0-flash',
        provider: 'gemini',
        providerName: 'Google Gemini',
        name: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        tag: 'Fast',
        description: 'Next-gen high speed multimodal model',
      },
      {
        id: 'gemini-1.5-pro',
        provider: 'gemini',
        providerName: 'Google Gemini',
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        tag: 'High Reasoning',
        description: 'Complex reasoning with 1M+ token context window',
      },
      {
        id: 'gemini-1.5-flash',
        provider: 'gemini',
        providerName: 'Google Gemini',
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        tag: 'Balanced',
        description: 'Efficient balanced model for general tasks',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    docs: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-...',
    models: [
      {
        id: 'gpt-4o',
        provider: 'openai',
        providerName: 'OpenAI',
        name: 'gpt-4o',
        displayName: 'OpenAI GPT-4o',
        tag: 'Pro',
        description: 'Flagship high-intelligence model',
      },
      {
        id: 'gpt-4o-mini',
        provider: 'openai',
        providerName: 'OpenAI',
        name: 'gpt-4o-mini',
        displayName: 'OpenAI GPT-4o Mini',
        tag: 'Fast',
        description: 'Lightweight & affordable intelligence',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    docs: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-api03-...',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        providerName: 'Anthropic',
        name: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        tag: 'Advanced',
        description: 'Industry-leading coding & nuanced analysis',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        provider: 'anthropic',
        providerName: 'Anthropic',
        name: 'claude-3-5-haiku-20241022',
        displayName: 'Claude 3.5 Haiku',
        tag: 'Ultra Fast',
        description: 'Lightning fast response generation',
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    docs: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        provider: 'groq',
        providerName: 'Groq',
        name: 'llama-3.3-70b-versatile',
        displayName: 'Groq Llama 3.3 70B',
        tag: 'Ultra Fast',
        description: 'Sub-second LPU accelerated open weights',
      },
      {
        id: 'mixtral-8x7b-32768',
        provider: 'groq',
        providerName: 'Groq',
        name: 'mixtral-8x7b-32768',
        displayName: 'Groq Mixtral 8x7B',
        tag: 'MoE Fast',
        description: 'High speed Mixture of Experts architecture',
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    docs: 'https://platform.deepseek.com/',
    placeholder: 'sk-...',
    models: [
      {
        id: 'deepseek-chat',
        provider: 'deepseek',
        providerName: 'DeepSeek AI',
        name: 'deepseek-chat',
        displayName: 'DeepSeek V3',
        tag: 'Reasoning',
        description: 'Strong technical synthesis & open intelligence',
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    docs: 'https://console.mistral.ai/',
    placeholder: '...',
    models: [
      {
        id: 'mistral-large-latest',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'mistral-large-latest',
        displayName: 'Mistral Large Latest',
        tag: 'Multilingual',
        description: 'Top-tier reasoning & multilingual fluency',
      },
      {
        id: 'mistral-small-latest',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'mistral-small-latest',
        displayName: 'Mistral Small Latest',
        tag: 'Fast',
        description: 'Cost-effective high speed task completion',
      },
      {
        id: 'codestral-2508',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'codestral-2508',
        displayName: 'Codestral 25.08',
        tag: 'Code Generation',
        description: 'Mistral code intelligence & synthesis model (625k TPM)',
      },
      {
        id: 'codestral-embed',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'codestral-embed',
        displayName: 'Codestral Embed',
        tag: 'Embedding',
        description: 'Mistral code embedding & vector model (50k TPM)',
      },
      {
        id: 'glm-5-2',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'glm-5-2',
        displayName: 'GLM 5.2',
        tag: 'General Reasoning',
        description: 'General language & reasoning model (20k TPM)',
      },
      {
        id: 'labs-leanstral-1-5-1',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'labs-leanstral-1-5-1',
        displayName: 'Leanstral 1.5.1',
        tag: 'Ultra High Throughput',
        description: 'Mistral Labs high-speed model (5M TPM)',
      },
      {
        id: 'ministral-14b-2512',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'ministral-14b-2512',
        displayName: 'Ministral 14B (25.12)',
        tag: 'On-Device High Capability',
        description: 'Sub-15B parameter high capability model (937.5k TPM)',
      },
      {
        id: 'ministral-3b-2512',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'ministral-3b-2512',
        displayName: 'Ministral 3B (25.12)',
        tag: 'Lightweight & Fast',
        description: 'Ultra fast 3B edge model (1.3M TPM, 12.5 RPS)',
      },
      {
        id: 'ministral-8b-2512',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'ministral-8b-2512',
        displayName: 'Ministral 8B (25.12)',
        tag: 'Balanced Edge',
        description: 'Balanced 8B parameter model (625k TPM)',
      },
      {
        id: 'mistral-embed-2312',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'mistral-embed-2312',
        displayName: 'Mistral Embed (23.12)',
        tag: 'Text Embeddings',
        description: 'High-throughput text embedding model (20M TPM)',
      },
      {
        id: 'mistral-large-2512',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'mistral-large-2512',
        displayName: 'Mistral Large (25.12)',
        tag: 'Enterprise Flagship',
        description: 'Flagship reasoning & complex document analysis (250k TPM)',
      },
      {
        id: 'mistral-medium-latest',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'mistral-medium-latest',
        displayName: 'Mistral Medium Latest',
        tag: 'Balanced Reasoning',
        description: 'Versatile mid-range reasoning model (20k TPM)',
      },
      {
        id: 'mistral-moderation-2603',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'mistral-moderation-2603',
        displayName: 'Mistral Moderation (26.03)',
        tag: 'Safety Guardrail',
        description: 'Content safety & moderation guardrail model (50k TPM)',
      },
      {
        id: 'mistral-small-2603',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'mistral-small-2603',
        displayName: 'Mistral Small (26.03)',
        tag: 'Efficient Small',
        description: 'High efficiency small model version 26.03 (20k TPM)',
      },
      {
        id: 'voxtral-mini-2602',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'voxtral-mini-2602',
        displayName: 'Voxtral Mini (26.02)',
        tag: 'Audio Multimodal',
        description: 'Compact audio & speech model (50k TPM)',
      },
      {
        id: 'voxtral-mini-transcribe-realtime-2602',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'voxtral-mini-transcribe-realtime-2602',
        displayName: 'Voxtral Mini Realtime Transcribe',
        tag: 'Realtime STT',
        description: 'Real-time audio transcription model (50k TPM)',
      },
      {
        id: 'voxtral-mini-tts-2603',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'voxtral-mini-tts-2603',
        displayName: 'Voxtral Mini TTS',
        tag: 'Text-to-Speech',
        description: 'High quality speech synthesis model (50k TPM)',
      },
      {
        id: 'voxtral-small-2507',
        provider: 'mistral',
        providerName: 'Mistral AI',
        name: 'voxtral-small-2507',
        displayName: 'Voxtral Small (25.07)',
        tag: 'Audio Intelligence',
        description: 'Enhanced voice & audio processing model (50k TPM)',
      },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi / Moonshot AI',
    docs: 'https://platform.moonshot.cn/',
    placeholder: 'sk-moonshot-...',
    models: [
      {
        id: 'moonshot-v1-8k',
        provider: 'kimi',
        providerName: 'Kimi / Moonshot AI',
        name: 'moonshot-v1-8k',
        displayName: 'Kimi Moonshot 8k',
        tag: 'Long Context',
        description: 'High fidelity long-document synthesis',
      },
    ],
  },
];

export const ALL_MODEL_OPTIONS: ModelOption[] = PROVIDERS_REGISTRY.flatMap((p) => p.models);

export const getModelById = (id: string): ModelOption => {
  return ALL_MODEL_OPTIONS.find((m) => m.id === id) || ALL_MODEL_OPTIONS[0];
};
