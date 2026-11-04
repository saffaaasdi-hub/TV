import React from 'react';
import { Tv, Calendar, Plus, Download, Server } from 'lucide-react';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';

interface HeaderProps {
  activeTab: 'player' | 'matches';
  setActiveTab: (tab: 'player' | 'matches') => void;
  onOpenAddModal: () => void;
  onOpenServerInfo: () => void;
  onDownloadM3U: () => void;
  channelCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenServerInfo,
  onDownloadM3U,
  channelCount,
}) => {
  return (
    <header className="h-13 sm:h-16 bg-[#0e131b] border-b border-[#1f2937] px-2.5 sm:px-4 md:px-8 flex items-center justify-between gap-2 sm:gap-4 md:gap-8 shrink-0 z-30">
      {/* Zone 1: Single text element wordmark with Network Status Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#ffcc00] to-[#e6a800] text-black flex items-center justify-center font-black shadow-lg shrink-0">
          <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
        </div>
        <div>
          <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-[#ffcc00] whitespace-nowrap block leading-tight">
            منصة صفاء الأسدي
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium tracking-widest uppercase block truncate max-w-[100px] sm:max-w-none">
              PREMIUM SPORTS
            </span>
            <span className="text-gray-600 text-[10px] select-none">•</span>
            <NetworkStatusIndicator />
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden sm:flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold text-gray-300">
        <button
          onClick={() => setActiveTab('player')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
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
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'matches'
              ? 'bg-[#1b2533] text-[#ffcc00] font-bold shadow-sm'
              : 'hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4 text-[#ffcc00]" />
          <span>جدول المباريات</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
            تحديث تلقائي 🔄
          </span>
        </button>

        <button
          onClick={onOpenServerInfo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:text-white hover:bg-white/5 whitespace-nowrap shrink-0 text-gray-300 cursor-pointer border border-[#223043] bg-[#111823]"
          title="عرض معلومات سيرفر nor.tv.com"
        >
          <Server className="w-4 h-4 text-[#ffcc00]" />
          <span>معلومات السيرفر</span>
          <span className="text-[10px] font-mono px-1 rounded bg-[#ffcc00]/15 text-[#ffcc00]">
            nor.tv.com
          </span>
        </button>

        <button
          onClick={onDownloadM3U}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:text-white hover:bg-white/5 whitespace-nowrap shrink-0 text-gray-300 cursor-pointer"
          title="تنزيل قائمة القنوات M3U"
        >
          <Download className="w-4 h-4" />
          <span>تحميل M3U</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action + Mobile Shortcuts */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onOpenServerInfo}
          className="sm:hidden p-2 rounded-lg bg-[#141c28] border border-[#223043] text-[#ffcc00] hover:text-white transition-colors cursor-pointer"
          title="معلومات السيرفر"
        >
          <Server className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'matches' ? 'player' : 'matches')}
          className={`sm:hidden px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
            activeTab === 'matches' ? 'bg-[#ffcc00] text-black font-bold shadow-sm' : 'bg-white/10 text-gray-200'
          }`}
          title="جدول المباريات"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">المباريات</span>
        </button>
        <button
          onClick={onOpenAddModal}
          className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-black bg-[#ffcc00] hover:bg-[#e6b800] rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          <span>إضافة قناة</span>
        </button>
      </div>
    </header>
  );
};
