import React, { useState } from 'react';
import { Search, User as UserIcon, Shield, PenTool, Sparkles, Sun, ChevronDown, Check, Flame, LogOut, LogIn } from 'lucide-react';
import { User, Role, Category } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCms: () => void;
  isCmsOpen: boolean;
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenCms,
  isCmsOpen,
  onHomeClick,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isGuest = !currentUser || currentUser.email === 'guest@raipursamvad.com' || currentUser.name === 'Guest Reader';

  return (
    <header className="z-45 sticky top-0 font-sans shadow-md border-b border-slate-200 max-w-full overflow-x-hidden">
      {/* 1. TOP UTILITY METADATA STRIP: Date, Ticker, and Weather */}
      <div className="bg-[#0f172a] text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold tracking-widest py-2 px-3 sm:px-4 max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 w-full max-w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-center max-w-full">
            <span className="text-rose-500 font-extrabold text-[9px] bg-rose-950/60 border border-rose-900/60 px-1.5 py-0.5 rounded tracking-normal shrink-0">
              LIVE
            </span>
            <span className="text-slate-300">{currentDateStr}</span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="flex items-center space-x-1.5 text-slate-300 shrink-0">
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Raipur • 32°C Sunny</span>
            </span>
          </div>

          {/* Rolling News Ticker */}
          <div className="flex items-center space-x-2 text-slate-300 w-full md:w-auto max-w-full md:max-w-lg min-w-0 overflow-hidden">
            <span className="text-[#dc2626] font-extrabold tracking-wider shrink-0 text-[9px] bg-rose-950/40 border border-rose-900/30 px-1.5 py-0.2 rounded">
              UPDATE
            </span>
            <span className="truncate min-w-0 text-slate-300 font-medium">
              Elevated Smart Transit Corridor Connecting Jaistambh Chowk to Telibandha Marine Drive approved
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE PREMIUM DARK MASTHEAD (Logo Aligned Left) */}
      <div className="bg-[#090d16] text-white py-4.5 px-6 border-b border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left Column: Logo & Newspaper Edition tag next to it */}
          <div 
            onClick={onHomeClick}
            className="cursor-pointer flex items-center space-x-4 w-full md:w-auto justify-center md:justify-start"
          >
            <Logo variant="header" size="md" className="shrink-0" />
            
            <div className="hidden lg:flex flex-col border-l border-slate-800 pl-4 font-serif text-[11px] text-slate-400">
              <div className="flex items-center space-x-2 font-sans font-extrabold text-[9px] text-slate-500 tracking-widest uppercase">
                <span>Established 2025</span>
                <span>•</span>
                <span className="text-rose-500">100% Free Access</span>
              </div>
              <p className="italic font-medium font-serif leading-tight">
                Chhattisgarh's Premier News & Investigative Journalism Platform
              </p>
            </div>
          </div>

          {/* Right Column: Search bar and Authentication controls */}
          <div className="flex items-center justify-center md:justify-end gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Minimalist Glassmorphic Search Bar */}
            <div className="relative flex-1 sm:flex-none sm:w-52 md:w-56 min-w-[160px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900/60 text-slate-200 placeholder-slate-500 focus:bg-slate-950 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] focus:outline-none transition-all font-sans"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            </div>

            {/* Profile Dropdown or Sign In */}
            {isGuest ? (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold transition-all text-xs cursor-pointer shadow-sm border border-[#dc2626]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-slate-100 hover:bg-slate-800 transition-all text-xs font-bold cursor-pointer shadow-sm border border-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="truncate max-w-[80px]">{currentUser?.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-xs font-sans">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <div className="font-extrabold text-slate-900 text-xs leading-none">{currentUser?.name}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-1">{currentUser?.email}</div>
                      <div className="mt-2">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-[#dc2626] uppercase">
                          {currentUser?.role}
                        </span>
                      </div>
                    </div>

                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'JOURNALIST') && (
                      <button
                        onClick={() => {
                          onOpenCms();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <PenTool className="w-4 h-4 text-[#dc2626]" />
                        <span>CMS Studio</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 border-t border-slate-100 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Direct CMS entry for staff */}
            {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'JOURNALIST') && (
              <button
                onClick={onOpenCms}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  isCmsOpen
                    ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
                    : 'bg-[#dc2626] hover:bg-[#b91c1c] text-white border-[#dc2626]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>CMS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. LIGHT CONTRAST CATEGORY NAVIGATION DESK */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center space-x-1 overflow-x-auto py-0.5 px-4 scrollbar-none font-sans whitespace-nowrap">
          
          <button
            onClick={() => {
              onSelectCategory('All');
              if (isCmsOpen) onHomeClick();
            }}
            className={`px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider shrink-0 transition-all cursor-pointer relative ${
              selectedCategory === 'All' && !isCmsOpen
                ? 'text-[#dc2626]'
                : 'text-slate-600 hover:text-[#dc2626]'
            }`}
          >
            All News
            {selectedCategory === 'All' && !isCmsOpen && (
              <span className="absolute bottom-0 inset-x-4 h-0.5 bg-[#dc2626] rounded-t-full"></span>
            )}
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.name);
                if (isCmsOpen) onHomeClick();
              }}
              className={`px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider shrink-0 transition-all cursor-pointer relative ${
                selectedCategory === cat.name && !isCmsOpen
                  ? 'text-[#dc2626]'
                  : 'text-slate-600 hover:text-[#dc2626]'
              }`}
            >
              {cat.name}
              {selectedCategory === cat.name && !isCmsOpen && (
                <span className="absolute bottom-0 inset-x-4 h-0.5 bg-[#dc2626] rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
