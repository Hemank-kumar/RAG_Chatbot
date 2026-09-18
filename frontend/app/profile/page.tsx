'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Mail, UserRound } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { api, getAuthToken, removeAuthToken } from '@/lib/api';
import { User } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace('/login');
      return;
    }

    api.getMe().then(setUser).catch(() => {
      removeAuthToken();
      router.replace('/login');
    });
  }, [router]);

  const name = user?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = useMemo(() => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U', [name]);
  const joinedOn = user?.created_at ? new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(user.created_at)) : null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans">
      <Navbar user={user} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full animate-fade-in">
        <div className="section-tag">PROFILE // ACCOUNT</div>
        <section className="mt-4 rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden shadow-2xl">
          <div className="h-28 bg-gradient-to-r from-[#f84525]/30 via-[#f84525]/10 to-transparent" />
          <div className="px-6 pb-7 sm:px-8">
            <div className="-mt-12 w-24 h-24 rounded-2xl bg-[#f84525]/20 border-4 border-[#141414] text-[#f84525] flex items-center justify-center font-mono text-2xl font-bold shadow-lg">
              {initials}
            </div>
            <h1 className="mt-4 text-2xl font-extrabold font-display uppercase tracking-tight">{name}</h1>
            <p className="mt-1 text-xs font-mono text-[#9c9c9c]">YOUR AGENTRAG PROFILE</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-4 flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#f84525]" />
                <div className="min-w-0"><p className="text-[10px] font-mono text-[#6f6f6f] uppercase">Email</p><p className="truncate text-sm text-white">{user?.email || 'Loading...'}</p></div>
              </div>
              <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-4 flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-[#f84525]" />
                <div><p className="text-[10px] font-mono text-[#6f6f6f] uppercase">Member since</p><p className="text-sm text-white">{joinedOn || '—'}</p></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
