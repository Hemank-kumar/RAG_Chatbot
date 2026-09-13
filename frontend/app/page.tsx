'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] text-white font-display">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-3 h-3 rounded-full bg-[#f84525] animate-ping" />
        <span className="font-extrabold text-xl uppercase tracking-widest">
          AGENT<span className="text-[#f84525]">RAG</span> AI
        </span>
      </div>
      <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-widest animate-pulse">
        Initializing Multi-Agent Knowledge Engine...
      </p>
    </div>
  );
}
