'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, Folder, FileText, Settings, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';
import { removeAuthToken } from '@/lib/api';

interface NavbarProps {
  user?: any;
  knowledgeBases?: any[];
  selectedKbId?: string;
  onSelectKb?: (kbId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, knowledgeBases = [], selectedKbId, onSelectKb }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-blue-400">
                AgentRAG AI
              </span>
              <span className="block text-[10px] text-blue-400 font-medium tracking-wider uppercase">
                Multi-Agent Knowledge Platform
              </span>
            </div>
          </Link>

          {/* Knowledge Base Selector Dropdown */}
          {knowledgeBases.length > 0 && onSelectKb && (
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <Folder className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 font-medium">KB:</span>
              <select
                value={selectedKbId || ''}
                onChange={(e) => onSelectKb(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id} className="bg-slate-900 text-white">
                    {kb.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-2 px-3 py-2 ml-2 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
