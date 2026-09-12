'use client';

import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface DocumentUploaderProps {
  knowledgeBaseId: string;
  onSuccess: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ knowledgeBaseId, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!knowledgeBaseId) {
      setError('Please select a Knowledge Base first.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await api.uploadDocument(file, knowledgeBaseId);
      setSuccess(true);
      setFile(null);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-400" />
        Upload & Index Document
      </h3>

      <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-8 text-center transition-all bg-slate-950/50">
        <input
          type="file"
          id="file-input"
          accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="font-semibold text-slate-200">
              {file ? file.name : 'Click to upload or drag & drop'}
            </span>
            <p className="text-xs text-slate-400 mt-1">Supported formats: PDF, DOCX, TXT, Markdown, HTML (Max 25MB)</p>
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Document indexed & embedded into pgvector successfully!
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button onClick={handleUpload} disabled={!file || isUploading} isLoading={isUploading}>
          Upload & Process
        </Button>
      </div>
    </div>
  );
};
