'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, setAuthToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.register({ email, password, full_name: fullName });
      const loginRes = await api.login({ email, password });
      setAuthToken(loginRes.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#f84525]/10 rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-md w-full bg-[#141414] border border-[#262626] rounded-2xl p-8 md:p-10 shadow-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#161616] border border-[#262626] text-[#f84525] mb-2 shadow-[0_0_15px_rgba(248,69,37,0.3)]">
            <span className="w-3 h-3 rounded-full bg-[#f84525]" />
          </div>
          <div className="section-tag justify-center">01 // REGISTRATION</div>
          <h1 className="text-2xl font-extrabold uppercase font-display tracking-tight text-white">
            CREATE ACCOUNT
          </h1>
          <p className="text-xs text-[#9c9c9c]">Get started with production Multi-Agent RAG</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#6f6f6f] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-[#161616] border border-[#262626] rounded-md pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#f84525] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6f6f6f] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#161616] border border-[#262626] rounded-md pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#f84525] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9c9c9c] mb-2">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6f6f6f] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#161616] border border-[#262626] rounded-md pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#f84525] transition-colors"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#262626] text-center text-xs font-mono text-[#6f6f6f] uppercase">
          Already have an account?{' '}
          <Link href="/login" className="text-[#f84525] hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
