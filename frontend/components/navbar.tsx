'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Folder, FileText, Settings, LogOut, LayoutDashboard, MessageSquare, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, number: '01' },
    { name: 'Chat', href: '/chat', icon: MessageSquare, number: '02' },
    { name: 'Documents', href: '/documents', icon: FileText, number: '03' },
    { name: 'Settings', href: '/settings', icon: Settings, number: '04' },
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

        {/* Right Section: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8">
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

          {/* Logout Action Button */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-[#6f6f6f] hover:text-[#f84525] transition-colors border-l border-[#262626] pl-6 py-2"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Logout</span>
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

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center justify-between py-3 text-sm font-display uppercase tracking-widest text-[#f84525] pt-4"
          >
            <span>Logout</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
