'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown, Info, ShieldCheck } from 'lucide-react';
import { Message, Citation } from '@/types';
import { CitationPopover } from './citation-popover';
import { api } from '@/lib/api';

interface ChatMessageProps {
  message: Message;
  onFollowUpClick?: (question: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onFollowUpClick }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<number | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating: number) => {
    try {
      setFeedback(rating);
      await api.sendFeedback(message.id, rating);
    } catch (e) {
      console.error('Feedback error', e);
    }
  };

  // Build a lookup map for citations by label e.g. "[S1]"
  const citationMap: Record<string, Citation> = {};
  if (message.citations) {
    message.citations.forEach((c) => {
      citationMap[c.citation_label] = c;
    });
  }

  // Parse custom citation tags in text and replace with CitationPopover React elements
  const renderContentWithCitations = (content: string) => {
    const parts = content.split(/(\[S\d+\])/g);
    return parts.map((part, index) => {
      if (citationMap[part]) {
        return <CitationPopover key={index} citation={citationMap[part]} />;
      }
      return <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>{part}</ReactMarkdown>;
    });
  };

  return (
    <div className={`flex gap-4 p-5 rounded-2xl transition-all ${isUser ? 'bg-slate-900/60 border border-slate-800/80 ml-auto max-w-3xl' : 'bg-slate-950/80 border border-slate-800 shadow-xl'}`}>
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/20'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-200">{isUser ? 'You' : 'Agentic RAG Assistant'}</span>
            {!isUser && message.confidence_score !== undefined && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <ShieldCheck className="w-3 h-3" />
                {Math.round((message.confidence_score || 0.9) * 100)}% Verified
              </span>
            )}
          </div>

          {/* Action buttons */}
          {!isUser && (
            <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowTrace(!showTrace)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${showTrace ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                title="View agent execution trace"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-xs transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleFeedback(1)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${feedback === 1 ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback(-1)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${feedback === -1 ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                title="Unhelpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Message Text */}
        <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div>{renderContentWithCitations(message.content)}</div>
          )}
        </div>

        {/* Agent Trace Drawer */}
        {!isUser && showTrace && message.agent_trace && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-2 text-slate-400 font-mono animate-fade-in">
            <div className="font-semibold text-slate-300 border-b border-slate-800 pb-1 mb-1">Agent Step Diagnostics:</div>
            {message.agent_trace.steps?.map((step: any, i: number) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-blue-400 font-medium">• {step.step}</span>
                <span className="text-[11px] text-slate-500 pl-3">{JSON.stringify(step.details)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Citations List Footer */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Supporting Evidence ({message.citations.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c) => (
                <CitationPopover key={c.id || c.citation_label} citation={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
