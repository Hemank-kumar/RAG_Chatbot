'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Folder, FileText, LayoutDashboard, MessageSquare, Menu, X, Sun, Moon, Settings, LogOut } from 'lucide-react';
import { removeAuthToken } from '@/lib/api';
import { User } from '@/types';

interface NavbarProps {
  user?: User | null;
  knowledgeBases?: any[];
  selectedKbId?: string;
  onSelectKb?: (kbId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, knowledgeBases = [], selectedKbId, onSelectKb }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('app_theme') as 'dark' | 'light' | null;
    if (storedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };

  const userLabel = user?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetters = userLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'U';

  const handleLogout = () => {
    removeAuthToken();
    router.replace('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, number: '01' },
    { name: 'Chat', href: '/chat', icon: MessageSquare, number: '02' },
    { name: 'Documents', href: '/documents', icon: FileText, number: '03' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left Section: Brand Logo + Knowledge Base Selector */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#161616] border border-[#262626] group-hover:border-[#f84525] transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f84525] shadow-[0_0_12px_#f84525]" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-display font-extrabold text-lg uppercase tracking-wider text-white leading-none">
                Agent<span className="text-[#f84525]">RAG</span>
              </span>
              <span className="text-[9px] text-[#9c9c9c] font-mono tracking-widest uppercase mt-1">
                EST. 2026 // MULTI-AGENT AI
              </span>
            </div>
          </Link>

          {/* Knowledge Base Dropdown */}
          {knowledgeBases.length > 0 && onSelectKb && (
            <div className="hidden lg:flex items-center gap-2 bg-[#161616] border border-[#262626] px-3.5 py-1.5 rounded-md text-xs">
              <Folder className="w-3.5 h-3.5 text-[#f84525] shrink-0" />
              <span className="text-[#6f6f6f] font-mono text-[10px] uppercase tracking-wider shrink-0">KB:</span>
              <select
                value={selectedKbId || ''}
                onChange={(e) => onSelectKb(e.target.value)}
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-1 truncate max-w-[160px]"
              >
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id} className="bg-[#161616] text-white">
                    {kb.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Section: Desktop Navigation Links + Account Controls */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-xs font-display uppercase tracking-widest transition-colors py-2 ${
                  isActive ? 'text-[#f84525] font-bold' : 'text-[#9c9c9c] hover:text-white baunfire-swipe-link'
                }`}
              >
                <span className="font-mono text-[10px] text-[#6f6f6f]">{item.number} /</span>
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[#161616] border border-[#262626] hover:border-[#f84525] text-[#9c9c9c] hover:text-white transition-all ml-2"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <Link
            href="/settings"
            className={`p-2 rounded-lg bg-[#161616] border transition-all ${
              pathname.startsWith('/settings') ? 'border-[#f84525] text-[#f84525]' : 'border-[#262626] text-[#9c9c9c] hover:border-[#f84525] hover:text-white'
            }`}
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-all ${
              pathname.startsWith('/profile') ? 'border-[#f84525] bg-[#f84525]/10' : 'border-[#262626] bg-[#161616] hover:border-[#f84525]'
            }`}
            title="Profile"
            aria-label="Open profile"
          >
            <span className="w-7 h-7 rounded-full bg-[#f84525]/20 text-[#f84525] border border-[#f84525]/40 flex items-center justify-center font-mono text-[10px] font-bold">
              {avatarLetters}
            </span>
            <span className="hidden xl:block max-w-24 truncate text-xs font-medium text-white">{userLabel}</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg bg-[#161616] border border-[#262626] text-[#9c9c9c] hover:border-rose-500 hover:text-rose-400 transition-all"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white hover:text-[#f84525] transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d0d0d] border-b border-[#262626] px-6 py-6 space-y-4 animate-fade-in">
          {knowledgeBases.length > 0 && onSelectKb && (
            <div className="flex items-center justify-between bg-[#161616] border border-[#262626] p-3 rounded-md mb-4">
              <span className="text-xs font-mono text-[#6f6f6f] uppercase">Select KB:</span>
              <select
                value={selectedKbId || ''}
                onChange={(e) => onSelectKb(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none"
              >
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id} className="bg-[#161616] text-white">
                    {kb.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between py-2.5 text-sm font-display uppercase tracking-widest border-b border-[#1a1a1a] ${
                  isActive ? 'text-[#f84525] font-bold' : 'text-[#9c9c9c]'
                }`}
              >
                <span>{item.name}</span>
                <span className="font-mono text-xs text-[#6f6f6f]">{item.number}</span>
              </Link>
            );
          })}

          <div className="pt-3 space-y-2">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg bg-[#161616] border border-[#262626] p-3"
            >
              <span className="w-8 h-8 rounded-full bg-[#f84525]/20 text-[#f84525] border border-[#f84525]/40 flex items-center justify-center font-mono text-xs font-bold">
                {avatarLetters}
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-semibold text-white">{userLabel}</span>
                <span className="block truncate text-[10px] font-mono text-[#6f6f6f]">{user?.email || 'Profile'}</span>
              </span>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-lg border border-[#262626] py-2.5 text-xs font-semibold text-[#9c9c9c] hover:text-white hover:border-[#f84525]">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-lg border border-[#262626] py-2.5 text-xs font-semibold text-[#9c9c9c] hover:text-rose-400 hover:border-rose-500">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
