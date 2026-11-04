import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tv, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Trophy,
  Server,
  List
} from 'lucide-react';
import { Channel, ServerConfig } from './types';
import { defaultChannels, initialServerConfig } from './data/defaultChannels';
import { todayMatches } from './data/mockMatches';
import { VideoPlayer } from './components/VideoPlayer';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MatchesSection } from './components/MatchesSection';
import { AddChannelModal } from './components/AddChannelModal';
import { ServerInfoModal } from './components/ServerInfoModal';
import { TickerBar } from './components/TickerBar';

export default function App() {
  // Local storage keys
  const CHANNELS_STORAGE_KEY = 'safaa_iptv_channels_xui_v2';
  const SERVER_STORAGE_KEY = 'safaa_iptv_server_xui_v2';

  // State
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem(CHANNELS_STORAGE_KEY) || localStorage.getItem('safaa_iptv_channels_xui_v1');
      if (saved) {
        const parsed: Channel[] = JSON.parse(saved);
        // Ensure channels point to local host on port 80 (192.168.99.10:80)
        return parsed.map((ch) => ({
          ...ch,
          url: ch.url.replace('http://nor.tv.com', 'http://192.168.99.10:80'),
        }));
      }
    } catch (e) {
      console.warn('Failed to parse saved channels', e);
    }
    return defaultChannels;
  });

  const [serverConfig] = useState<ServerConfig>(() => {
    return initialServerConfig;
  });

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(() => {
    return channels[0] || defaultChannels[0];
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'player' | 'matches'>('player');
  const [isSatelliteOverlayOpen, setIsSatelliteOverlayOpen] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isServerInfoOpen, setIsServerInfoOpen] = useState<boolean>(false);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(channels));
    } catch (e) {
      console.warn('Failed to save channels to localStorage', e);
    }
  }, [channels]);

  useEffect(() => {
    try {
      localStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(serverConfig));
    } catch (e) {
      console.warn('Failed to save server config to localStorage', e);
    }
  }, [serverConfig]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [channels]);

  // Actions
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setActiveTab('player');
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleFavorite = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId ? { ...ch, isFavorite: !ch.isFavorite } : ch
      )
    );
  };

  const handleAddChannel = (newChannel: Channel) => {
    setChannels((prev) => [newChannel, ...prev]);
    setSelectedChannel(newChannel);
  };

  const handleDeleteCustomChannel = (channelId: string) => {
    setChannels((prev) => prev.filter((ch) => ch.id !== channelId));
    if (selectedChannel?.id === channelId) {
      setSelectedChannel(channels[0] || null);
    }
  };

  const handleDownloadM3U = () => {
    let content = '#EXTM3U\n';
    channels.forEach((ch) => {
      content += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" group-title="${ch.category}",${ch.name}\n${ch.url}\n`;
    });
    const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safaa_sports_iptv_${serverConfig.username}.m3u`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectAlternative = (channelId: string) => {
    const found = channels.find((c) => c.id === channelId);
    if (found) {
      setSelectedChannel(found);
    }
  };

  const handleOpenSatelliteFromMobile = () => {
    setActiveTab('player');
    setIsSatelliteOverlayOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-white flex flex-col font-sans selection:bg-[#ffcc00] selection:text-black pb-16 lg:pb-0">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenServerInfo={() => setIsServerInfoOpen(true)}
        onDownloadM3U={handleDownloadM3U}
        channelCount={channels.length}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar for Channels - visible on player tab */}
        {activeTab === 'player' && (
          <Sidebar
            channels={channels}
            selectedChannel={selectedChannel}
            onSelectChannel={handleSelectChannel}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onToggleFavorite={handleToggleFavorite}
            onDeleteCustomChannel={handleDeleteCustomChannel}
            categories={categories}
          />
        )}

        {/* Central Content Panel */}
        <main className="order-1 lg:order-2 flex-1 flex flex-col min-w-0 overflow-y-auto">
          {activeTab === 'matches' ? (
            /* Dedicated Matches Page - completely separate with auto-refresh */
            <div className="flex-1 p-3 sm:p-5 md:p-8 bg-[#070a0f] overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <MatchesSection
                  matches={todayMatches}
                  channels={channels}
                  onPlayChannel={handleSelectChannel}
                  onBackToPlayer={() => setActiveTab('player')}
                />
              </div>
            </div>
          ) : (
            /* Player and Details View */
            <div className="flex-1 flex flex-col">
              {/* Player Section - Responsive & Mobile-friendly */}
              <section className="p-1 sm:p-3 md:p-6 bg-[#05070a] border-b border-[#1b2533]">
                <div className="max-w-6xl mx-auto">
                  <VideoPlayer
                    channel={selectedChannel}
                    channels={channels}
                    onSelectChannel={handleSelectChannel}
                    onSelectAlternativeChannel={handleSelectAlternative}
                    categories={categories}
                    isSatelliteOverlayOpen={isSatelliteOverlayOpen}
                    setIsSatelliteOverlayOpen={setIsSatelliteOverlayOpen}
                  />

                  {/* Channel Details Banner */}
                  <div className="mt-2 sm:mt-4 p-2.5 sm:p-4 rounded-xl bg-[#10151f] border border-[#202a3a] flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#ffcc00] text-black font-extrabold flex items-center justify-center text-xs sm:text-sm shrink-0 shadow">
                        {selectedChannel ? String(selectedChannel.number).padStart(2, '0') : '--'}
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center gap-2">
                          <span>{selectedChannel ? selectedChannel.name : 'يرجى اختيار قناة'}</span>
                        </h2>
                        <div className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-1.5 sm:gap-2 mt-0.5">
                          <span className="text-[#ffcc00] font-semibold">{selectedChannel?.category}</span>
                          <span>·</span>
                          <span>{selectedChannel?.quality || '1080p'}</span>
                          <span>·</span>
                          <span className="text-emerald-400 font-semibold">بث محلي (بورت 80)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Satellite OSD trigger button */}
                      <button
                        onClick={() => setIsSatelliteOverlayOpen(true)}
                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border border-[#ffcc00]/40 bg-[#ffcc00]/10 text-[#ffcc00] hover:bg-[#ffcc00]/20 transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm"
                        title="فتح قائمة قنوات الستلايت داخل المشغل"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>قائمة قنوات الستلايت</span>
                      </button>

                      <button
                        onClick={() => setIsServerInfoOpen(true)}
                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg border border-[#26374d] bg-[#141d2a] text-gray-300 hover:text-white hover:bg-[#1c293c] transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer"
                        title="عرض معلومات سيرفر nor.tv.com"
                      >
                        <Server className="w-3.5 h-3.5 text-[#ffcc00]" />
                        <span className="hidden xs:inline">معلومات السيرفر</span>
                      </button>

                      <button
                        onClick={() => selectedChannel && handleToggleFavorite(selectedChannel.id)}
                        className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                          selectedChannel?.isFavorite
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                        }`}
                      >
                        <span>{selectedChannel?.isFavorite ? 'في المفضلة ★' : 'إضافة للمفضلة ☆'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Actions & Footer */}
              <section className="p-2.5 sm:p-4 md:p-8 bg-[#090d13]">
                <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
                  {/* Clean Server Info Banner Card */}
                  <div className="bg-gradient-to-r from-[#121822] via-[#0e141e] to-[#0a0d14] rounded-xl sm:rounded-2xl border border-[#202d3f] p-3 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5 sm:gap-3.5">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#ffcc00]/15 text-[#ffcc00] flex items-center justify-center font-bold shrink-0 border border-[#ffcc00]/20">
                        <Server className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm md:text-base font-bold text-white">
                            سيرفر nor.tv.com
                          </h3>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-400 font-mono mt-0.5">
                          Host: <span className="text-gray-200">{serverConfig.host}</span> · User: <span className="text-gray-200">{serverConfig.username}</span> · Pass: <span className="text-gray-200">{serverConfig.password}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsServerInfoOpen(true)}
                        className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white bg-[#1a2535] hover:bg-[#233246] rounded-xl border border-[#2a3c53] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Server className="w-3.5 h-3.5 text-[#ffcc00]" />
                        <span>عرض بيانات السيرفر والروابط</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Card: Matches Schedule Separate Page Link */}
                  <div className="bg-gradient-to-r from-[#131b27] via-[#0f1520] to-[#0a0e16] rounded-xl sm:rounded-2xl border border-[#223247] p-3 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5 sm:gap-3.5">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#ffcc00]/15 text-[#ffcc00] flex items-center justify-center font-bold shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm md:text-base font-bold text-white">
                            جدول مباريات اليوم
                          </h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-bold">
                            تحديث تلقائي مستمر
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-400">
                          نتائج مباشرة مع تحديث ذاتي للوقت والنتائج والقنوات الناقلة
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('matches')}
                      className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-black bg-[#ffcc00] hover:bg-[#e6b800] rounded-xl transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>فتح جدول المباريات كاملة</span>
                      <span>←</span>
                    </button>
                  </div>

                  {/* Clean Footer Bar */}
                  <div className="p-3 sm:p-4 rounded-xl bg-[#0d121a] border border-[#1e2837] flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs text-gray-400">
                    <span className="text-[11px] sm:text-xs">
                      جميع الحقوق محفوظة لمنصة صفاء الأسدي لخدمات الإنترنت © 2026
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
                      <button
                        onClick={() => setIsServerInfoOpen(true)}
                        className="text-gray-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Server className="w-3.5 h-3.5 text-[#ffcc00]" />
                        <span>معلومات السيرفر</span>
                      </button>
                      <span className="text-gray-600">•</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        البث المباشر نشط
                      </span>
                      <span className="text-gray-600">•</span>
                      <button
                        onClick={handleDownloadM3U}
                        className="text-[#ffcc00] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        تحميل ملف M3U
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (شريط تنقل سفلي خاص بالهواتف) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0d131c]/95 backdrop-blur-md border-t border-[#1e2a3a] px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setActiveTab('player');
            setIsSatelliteOverlayOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold p-1 cursor-pointer transition-colors ${
            activeTab === 'player' && !isSatelliteOverlayOpen ? 'text-[#ffcc00]' : 'text-gray-400'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>المشغل</span>
        </button>

        <button
          onClick={handleOpenSatelliteFromMobile}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold p-1 cursor-pointer transition-colors ${
            isSatelliteOverlayOpen ? 'text-[#ffcc00]' : 'text-amber-400'
          }`}
        >
          <div className="w-5 h-4.5 rounded bg-[#ffcc00] text-black flex items-center justify-center font-black text-[9px] shadow-sm">
            OK
          </div>
          <span>قائمة الستلايت</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold p-1 cursor-pointer transition-colors ${
            activeTab === 'matches' ? 'text-[#ffcc00]' : 'text-gray-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>المباريات</span>
        </button>

        <button
          onClick={() => setIsServerInfoOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[11px] font-bold text-gray-400 hover:text-white p-1 cursor-pointer"
        >
          <Server className="w-4 h-4" />
          <span>السيرفر</span>
        </button>
      </div>

      {/* Bottom News Ticker */}
      <div className="hidden lg:block">
        <TickerBar />
      </div>

      {/* Modals */}
      <AddChannelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddChannel={handleAddChannel}
        categories={categories}
        nextNumber={channels.length + 1}
      />

      <ServerInfoModal
        isOpen={isServerInfoOpen}
        onClose={() => setIsServerInfoOpen(false)}
        serverConfig={serverConfig}
        onDownloadM3U={handleDownloadM3U}
        channelCount={channels.length}
      />
    </div>
  );
}
