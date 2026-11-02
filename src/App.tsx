import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tv, 
  Calendar, 
  Server, 
  Globe, 
  User, 
  Key, 
  ShieldCheck, 
  Download, 
  Radio, 
  Sparkles,
  Info,
  CheckCircle2,
  Share2,
  ExternalLink
} from 'lucide-react';
import { Channel, ServerConfig } from './types';
import { defaultChannels, initialServerConfig } from './data/defaultChannels';
import { todayMatches } from './data/mockMatches';
import { VideoPlayer } from './components/VideoPlayer';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MatchesSection } from './components/MatchesSection';
import { ServerInfoModal } from './components/ServerInfoModal';
import { AddChannelModal } from './components/AddChannelModal';
import { TickerBar } from './components/TickerBar';

export default function App() {
  // Local storage keys
  const CHANNELS_STORAGE_KEY = 'safaa_iptv_channels_v1';
  const SERVER_STORAGE_KEY = 'safaa_iptv_server_v1';

  // State
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem(CHANNELS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved channels', e);
    }
    return defaultChannels;
  });

  const [serverConfig, setServerConfig] = useState<ServerConfig>(() => {
    try {
      const saved = localStorage.getItem(SERVER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved server config', e);
    }
    return initialServerConfig;
  });

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(() => {
    return channels[0] || defaultChannels[0];
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'player' | 'matches' | 'server'>('player');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);

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
    // Scroll to top on mobile
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

  return (
    <div className="min-h-screen bg-[#07090d] text-white flex flex-col font-sans selection:bg-[#ffcc00] selection:text-black">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        onDownloadM3U={handleDownloadM3U}
        channelCount={channels.length}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar for Channels */}
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

        {/* Central Content Panel */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {activeTab === 'matches' ? (
            /* Dedicated Matches Tab */
            <div className="flex-1 p-4 md:p-8">
              <div className="max-w-6xl mx-auto space-y-6">
                <MatchesSection
                  matches={todayMatches}
                  channels={channels}
                  onPlayChannel={handleSelectChannel}
                />
              </div>
            </div>
          ) : (
            /* Player and Details View */
            <div className="flex-1 flex flex-col">
              {/* Player Section */}
              <section className="p-3 md:p-6 bg-[#05070a] border-b border-[#1b2533]">
                <div className="max-w-6xl mx-auto">
                  <VideoPlayer
                    channel={selectedChannel}
                    onSelectAlternativeChannel={handleSelectAlternative}
                  />

                  {/* Channel Details Banner */}
                  <div className="mt-4 p-4 rounded-xl bg-[#10151f] border border-[#202a3a] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#ffcc00] text-black font-extrabold flex items-center justify-center text-sm">
                        {selectedChannel ? String(selectedChannel.number).padStart(2, '0') : '--'}
                      </div>
                      <div>
                        <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                          <span>{selectedChannel ? selectedChannel.name : 'يرجى اختيار قناة'}</span>
                        </h2>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                          <span className="text-[#ffcc00]">{selectedChannel?.category}</span>
                          <span>·</span>
                          <span>{selectedChannel?.quality || '1080p'}</span>
                          <span>·</span>
                          <span className="text-emerald-400 font-semibold">بث مشفر HLS</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => selectedChannel && handleToggleFavorite(selectedChannel.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                          selectedChannel?.isFavorite
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                        }`}
                      >
                        <span>{selectedChannel?.isFavorite ? 'في المفضلة ★' : 'إضافة للمفضلة ☆'}</span>
                      </button>

                      <button
                        onClick={() => setIsServerModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Server className="w-3.5 h-3.5" />
                        <span>بيانات السيرفر</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Server Info Cards (as prominently featured in user's original HTML template) */}
              <section className="p-4 md:p-8 bg-[#090d13]">
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Matches Section integrated below player */}
                  <MatchesSection
                    matches={todayMatches}
                    channels={channels}
                    onPlayChannel={handleSelectChannel}
                  />

                  {/* Server Connection Information Cards */}
                  <div className="bg-[#0f141d] rounded-2xl border border-[#222e3e] p-5 md:p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#00d2ff]/10 text-[#00d2ff] flex items-center justify-center font-bold">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm md:text-base font-bold text-[#ffcc00]">
                            معلومات خدمة البث وسيرفر المشاهدة
                          </h3>
                          <p className="text-xs text-gray-400">
                            بيانات الاتصال المباشرة بسيرفر IPTV للبث المباشر
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsServerModalOpen(true)}
                        className="text-xs text-[#00d2ff] hover:underline font-semibold"
                      >
                        إدارة السيرفر ↗
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="bg-gradient-to-br from-[#151e29] to-[#0d1118] border border-[#263c4d] rounded-xl p-4 text-center">
                        <label className="block text-[#00d2ff] text-xs font-bold mb-2">
                          SERVER HOST
                        </label>
                        <strong className="text-sm md:text-base font-mono text-white block break-all">
                          {serverConfig.host}
                        </strong>
                      </div>

                      <div className="bg-gradient-to-br from-[#151e29] to-[#0d1118] border border-[#263c4d] rounded-xl p-4 text-center">
                        <label className="block text-[#00d2ff] text-xs font-bold mb-2">
                          USERNAME
                        </label>
                        <strong className="text-sm md:text-base font-mono text-white block break-all">
                          {serverConfig.username}
                        </strong>
                      </div>

                      <div className="bg-gradient-to-br from-[#151e29] to-[#0d1118] border border-[#263c4d] rounded-xl p-4 text-center">
                        <label className="block text-[#00d2ff] text-xs font-bold mb-2">
                          PASSWORD
                        </label>
                        <strong className="text-sm md:text-base font-mono text-white block break-all">
                          {serverConfig.password}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#1e2837] flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                      <span>
                        جميع الحقوق محفوظة لمنصة صفاء الأسدي لخدمات الإنترنت © 2026
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          حالة السيرفر: متصل ونشط
                        </span>
                        <button
                          onClick={handleDownloadM3U}
                          className="text-[#ffcc00] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          تحميل ملف القنوات M3U
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Bottom News Ticker */}
      <TickerBar />

      {/* Modals */}
      <ServerInfoModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        serverConfig={serverConfig}
        onUpdateServerConfig={setServerConfig}
        channels={channels}
      />

      <AddChannelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddChannel={handleAddChannel}
        categories={categories}
        nextNumber={channels.length + 1}
      />
    </div>
  );
}
