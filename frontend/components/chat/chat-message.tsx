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

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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

  const citationMap: Record<string, Citation> = {};
  if (message.citations) {
    message.citations.forEach((c) => {
      citationMap[c.citation_label] = c;
    });
  }

  const renderContentWithCitations = (content: string) => {
    const parts = content.split(/(\[S\d+\])/g);
    return parts.map((part, index) => {
      if (citationMap[part]) {
        return <CitationPopover key={index} citation={citationMap[part]} />;
      }
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          components={{
            p: 'span',
            pre: ({ node, ...props }) => (
              <pre className="overflow-x-auto bg-[#0d0d0d] p-3 rounded-md border border-[#262626] max-w-full text-xs font-mono my-2 break-all whitespace-pre-wrap" {...props} />
            ),
            code: ({ node, inline, ...props }: any) =>
              inline ? (
                <code className="bg-[#0d0d0d] px-1.5 py-0.5 rounded border border-[#262626] font-mono text-xs text-[#f84525] break-all" {...props} />
              ) : (
                <code className="block overflow-x-auto font-mono text-xs text-[#e0e0e0] break-all whitespace-pre-wrap" {...props} />
              ),
            a: ({ node, ...props }) => (
              <a className="text-[#f84525] hover:underline break-all" target="_blank" rel="noopener noreferrer" {...props} />
            ),
          }}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div
      className={`flex gap-4 p-5 rounded-xl transition-all max-w-full overflow-hidden break-words [word-break:break-word] ${
        isUser
          ? 'bg-[#141414] border border-[#262626] ml-auto max-w-3xl'
          : 'bg-[#161616] border border-[#262626] shadow-xl'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 shadow-md font-mono text-xs font-bold ${
          isUser
            ? 'bg-[#262626] text-white border border-[#383838]'
            : 'bg-[#f84525] text-white shadow-[#f84525]/20'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0 max-w-full space-y-3 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#262626] pb-2">
          <div className="flex items-center gap-2 truncate">
            <span className="font-display font-bold uppercase tracking-wider text-xs text-white">
              {isUser ? 'USER' : 'AGENTIC RAG ASSISTANT'}
            </span>
            {!isUser && message.confidence_score !== undefined && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f84525]/10 text-[#f84525] border border-[#f84525]/30 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                {Math.round((message.confidence_score || 0.9) * 100)}% VERIFIED
              </span>
            )}
          </div>

          {/* Action buttons */}
          {!isUser && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowTrace(!showTrace)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  showTrace ? 'bg-[#f84525]/20 text-[#f84525]' : 'text-[#6f6f6f] hover:bg-[#202020] hover:text-white'
                }`}
                title="View agent execution trace"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded text-[#6f6f6f] hover:bg-[#202020] hover:text-white text-xs transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleFeedback(1)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  feedback === 1 ? 'text-emerald-400 bg-emerald-500/10' : 'text-[#6f6f6f] hover:bg-[#202020] hover:text-white'
                }`}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback(-1)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  feedback === -1 ? 'text-rose-400 bg-rose-500/10' : 'text-[#6f6f6f] hover:bg-[#202020] hover:text-white'
                }`}
                title="Unhelpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Message Text */}
        <div className="prose prose-invert prose-sm max-w-none text-[#e0e0e0] leading-relaxed font-sans overflow-x-auto break-words [word-break:break-word]">
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="break-words">{renderContentWithCitations(message.content)}</div>
          )}
        </div>

        {/* Agent Trace Drawer */}
        {!isUser && showTrace && message.agent_trace && (
          <div className="bg-[#0d0d0d] border border-[#262626] rounded-md p-3 text-xs space-y-2 text-[#9c9c9c] font-mono animate-fade-in overflow-x-auto break-all">
            <div className="font-bold text-[#f84525] border-b border-[#262626] pb-1 mb-1 uppercase tracking-wider text-[10px]">
              03 // AGENT STEP DIAGNOSTICS:
            </div>
            {message.agent_trace.steps?.map((step: any, i: number) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-white font-medium">• {step.step}</span>
                <span className="text-[11px] text-[#6f6f6f] pl-3 break-all">{JSON.stringify(step.details)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Citations List Footer */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="pt-3 border-t border-[#262626]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6f6f6f] block mb-2 font-bold">
              SUPPORTING EVIDENCE ({message.citations.length}):
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
