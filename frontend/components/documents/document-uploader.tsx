'use client';

import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Files } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';
import { api } from '@/lib/api';

interface DocumentUploaderProps {
  knowledgeBaseId: string;
  onSuccess: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ knowledgeBaseId, onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const newFiles = selected.filter((f) => !existingNames.has(f.name));
        return [...prev, ...newFiles];
      });
      setError(null);
      setSuccessCount(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!knowledgeBaseId) {
      setError('Please select a Knowledge Base first.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (files.length === 1) {
        await api.uploadDocument(files[0], knowledgeBaseId);
      } else {
        await api.uploadMultipleDocuments(files, knowledgeBaseId);
      }
      setSuccessCount(files.length);
      setFiles([]);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Batch document upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 shadow-xl">
      <div className="section-tag mb-4">
        02 // MULTI-DOCUMENT INGESTION
      </div>
      <h3 className="text-base font-display font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
        <Upload className="w-4 h-4 text-[#f84525]" />
        BATCH UPLOAD & VECTOR EMBED DOCUMENTS
      </h3>

      <div className="border-2 border-dashed border-[#262626] hover:border-[#f84525]/60 rounded-xl p-8 text-center transition-all bg-[#0d0d0d]">
        <input
          type="file"
          id="file-input"
          multiple
          accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#161616] border border-[#262626] flex items-center justify-center text-[#f84525]">
            <Files className="w-6 h-6" />
          </div>
          <div>
            <span className="font-display font-semibold text-white uppercase tracking-wider text-xs">
              Click to select multiple files or drag & drop documents
            </span>
            <p className="text-[11px] font-mono text-[#6f6f6f] mt-1 uppercase">
              Supported Formats: PDF, DOCX, TXT, MD, HTML (Select multiple files at once)
            </p>
          </div>
        </label>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#6f6f6f] font-bold">
            SELECTED DOCUMENTS FOR THIS KNOWLEDGE BASE ({files.length}):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between bg-[#161616] border border-[#262626] px-3 py-2 rounded-md text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-3.5 h-3.5 text-[#f84525] shrink-0" />
                  <span className="truncate font-mono text-[11px] text-white" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#6f6f6f]">
                    ({formatBytes(file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="text-[#6f6f6f] hover:text-rose-400 p-1 rounded hover:bg-[#202020] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {successCount !== null && (
        <div className="mt-4 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Successfully chunked & embedded {successCount} document{successCount > 1 ? 's' : ''} into pgvector!
        </div>
      )}

      <div className="mt-5 flex justify-end gap-3">
        {files.length > 0 && (
          <Button type="button" variant="ghost" onClick={() => setFiles([])} disabled={isUploading}>
            Clear Selection
          </Button>
        )}
        <Button onClick={handleUpload} disabled={files.length === 0 || isUploading} isLoading={isUploading}>
          {files.length > 1 ? `Upload & Index ${files.length} Documents` : 'Upload & Index Document'}
        </Button>
      </div>
    </div>
  );
};
