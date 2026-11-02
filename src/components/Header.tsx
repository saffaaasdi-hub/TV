import React from 'react';
import { Tv, Calendar, Server, Plus, Download, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'player' | 'matches' | 'server';
  setActiveTab: (tab: 'player' | 'matches' | 'server') => void;
  onOpenAddModal: () => void;
  onOpenServerModal: () => void;
  onDownloadM3U: () => void;
  channelCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenServerModal,
  onDownloadM3U,
  channelCount,
}) => {
  return (
    <header className="h-16 bg-[#0e131b] border-b border-[#1f2937] px-4 md:px-8 flex items-center justify-between gap-4 md:gap-8 shrink-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ffcc00] to-[#e6a800] text-black flex items-center justify-center font-black shadow-lg">
          <Tv className="w-5 h-5 text-black" />
        </div>
        <div>
          <span className="text-base md:text-lg font-black tracking-tight text-[#ffcc00] whitespace-nowrap block leading-tight">
            منصة صفاء الأسدي
          </span>
          <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase block">
            PREMIUM SPORTS IPTV
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Single-line, clear active states) */}
      <nav className="hidden sm:flex items-center gap-2 md:gap-4 text-xs md:text-sm font-semibold text-gray-300">
        <button
          onClick={() => setActiveTab('player')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'player'
              ? 'bg-[#1b2533] text-[#ffcc00] font-bold shadow-sm'
              : 'hover:text-white hover:bg-white/5'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>البث المباشر</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-gray-400">
            {channelCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'matches'
              ? 'bg-[#1b2533] text-[#ffcc00] font-bold shadow-sm'
              : 'hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>مباريات اليوم</span>
        </button>

        <button
          onClick={onOpenServerModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:text-white hover:bg-white/5 whitespace-nowrap shrink-0 text-gray-300"
        >
          <Server className="w-4 h-4" />
          <span>معلومات السيرفر</span>
        </button>

        <button
          onClick={onDownloadM3U}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:text-white hover:bg-white/5 whitespace-nowrap shrink-0 text-gray-300"
          title="تنزيل قائمة القنوات M3U"
        >
          <Download className="w-4 h-4" />
          <span>تحميل M3U</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenAddModal}
          className="px-3.5 py-2 text-xs font-bold text-black bg-[#ffcc00] hover:bg-[#e6b800] rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>إضافة قناة</span>
        </button>
      </div>
    </header>
  );
};
