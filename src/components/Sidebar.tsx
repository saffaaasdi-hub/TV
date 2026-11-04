import React, { useMemo } from 'react';
import { Search, Star, Radio, Trash2, Filter, Play } from 'lucide-react';
import { Channel } from '../types';

interface SidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onToggleFavorite: (channelId: string) => void;
  onDeleteCustomChannel?: (channelId: string) => void;
  categories: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  channels,
  selectedChannel,
  onSelectChannel,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onToggleFavorite,
  onDeleteCustomChannel,
  categories,
}) => {
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (selectedCategory === 'favorites') {
        return !!c.isFavorite;
      }
      if (selectedCategory === 'all') {
        return true;
      }
      return c.category === selectedCategory;
    });
  }, [channels, searchQuery, selectedCategory]);

  return (
    <aside className="order-2 lg:order-1 w-full lg:w-80 xl:w-96 bg-[#10151d] border-b lg:border-b-0 lg:border-l border-[#202937] flex flex-col shrink-0 h-auto lg:h-[calc(100vh-4rem-2.5rem)]">
      {/* Search Bar - compact padding on mobile */}
      <div className="p-2 sm:p-3 border-b border-[#1c2430]">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن قناة رياضية (beIN, Alwan...)"
            className="w-full bg-[#090d14] text-gray-100 text-xs pr-8.5 pl-3 py-1.5 sm:py-2 rounded-lg border border-[#2a3647] focus:border-[#ffcc00] focus:outline-none transition-colors placeholder:text-gray-500"
          />
        </div>

        {/* Category Pills/Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#ffcc00] text-black shadow-xs'
                : 'bg-[#18212c] text-gray-300 hover:bg-[#202c3b]'
            }`}
          >
            الكل ({channels.length})
          </button>

          <button
            onClick={() => setSelectedCategory('favorites')}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
              selectedCategory === 'favorites'
                ? 'bg-[#ffcc00] text-black shadow-xs'
                : 'bg-[#18212c] text-gray-300 hover:bg-[#202c3b]'
            }`}
          >
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>المفضلة</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#ffcc00] text-black shadow-xs'
                  : 'bg-[#18212c] text-gray-300 hover:bg-[#202c3b]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Channel List Header */}
      <div className="px-3 sm:px-4 py-1.5 bg-[#0b0f15] border-b border-[#1b232f] flex items-center justify-between text-[11px] sm:text-xs text-gray-400">
        <span>قائمة القنوات ({filteredChannels.length})</span>
        <span className="text-[10px] text-[#ffcc00]">تحديث تلقائي</span>
      </div>

      {/* Channels Scrollable List */}
      <div className="flex-1 overflow-y-auto p-1.5 sm:p-2.5 space-y-1 sm:space-y-1.5 max-h-[280px] lg:max-h-none">
        {filteredChannels.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <Radio className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-gray-500" />
            <p className="text-xs font-semibold">لا توجد قنوات تطابق بحثك</p>
            <p className="text-[10px] text-gray-500 mt-0.5">جرب البحث بكلمة أخرى أو إضافة قناة جديدة</p>
          </div>
        ) : (
          filteredChannels.map((channel, idx) => {
            const isSelected = selectedChannel?.id === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`group flex items-center gap-2 sm:gap-2.5 p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#261f08] border-[#ffcc00] shadow-[0_0_12px_rgba(255,204,0,0.15)]'
                    : 'bg-[#151c26] border-transparent hover:bg-[#1d2736] hover:border-[#2f3d52]'
                }`}
              >
                {/* Channel Number */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#ffcc00] text-black'
                      : 'bg-[#1f2937] text-gray-300 group-hover:text-[#ffcc00]'
                  }`}
                >
                  {String(channel.number || idx + 1).padStart(2, '0')}
                </div>

                {/* Channel Name & Category */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs md:text-sm font-bold truncate block ${
                        isSelected ? 'text-[#ffcc00]' : 'text-gray-100'
                      }`}
                    >
                      {channel.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 block truncate">
                    {channel.category} {channel.quality ? `· ${channel.quality}` : ''}
                  </span>
                </div>

                {/* Right Action Icons: Favorite Star & Active Live Dot */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFavorite(channel.id)}
                    className="p-1 text-gray-400 hover:text-amber-400 transition-colors"
                    title={channel.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        channel.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-500'
                      }`}
                    />
                  </button>

                  {channel.isCustom && onDeleteCustomChannel && (
                    <button
                      onClick={() => onDeleteCustomChannel(channel.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="حذف القناة المخصصة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      isSelected
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        : 'bg-gray-600'
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
