import React, { useState } from 'react';
import { X, Plus, Tv, Globe, Tag } from 'lucide-react';
import { Channel } from '../types';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (channel: Channel) => void;
  categories: string[];
  nextNumber: number;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  onAddChannel,
  categories,
  nextNumber,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(categories[0] || '⚽ Alwan Sport');
  const [quality, setQuality] = useState('1080p FHD');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const newChannel: Channel = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      category: category.trim(),
      number: nextNumber,
      quality: quality,
      isLive: true,
      isCustom: true,
    };

    onAddChannel(newChannel);
    setName('');
    setUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#111722] border border-[#26374a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#212e3e] flex items-center justify-between bg-gradient-to-r from-[#141c28] to-[#0d121a]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ffcc00]/10 border border-[#ffcc00]/30 flex items-center justify-center text-[#ffcc00]">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">إضافة قناة رياضية جديدة</h3>
              <p className="text-xs text-gray-400">إضافة رابط بث HLS / M3U8 مخصص</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              اسم القناة
            </label>
            <div className="relative">
              <Tv className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                placeholder="مثال: beIN SPORTS 7 HD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0a0f16] border border-[#2b3a4f] rounded-lg pr-9 pl-3 py-2 text-xs text-white focus:border-[#ffcc00] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              رابط البث المباشر (HLS / m3u8)
            </label>
            <div className="relative">
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="url"
                required
                placeholder="http://nor.tv.com/play/.../m3u8 أو https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#0a0f16] border border-[#2b3a4f] rounded-lg pr-9 pl-3 py-2 text-xs text-white focus:border-[#ffcc00] outline-none font-mono text-left dir-ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                القسم / الفئة
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0a0f16] border border-[#2b3a4f] rounded-lg px-3 py-2 text-xs text-white focus:border-[#ffcc00] outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="⚽ قنوات مخصصة">⚽ قنوات مخصصة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                جودة العرض
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full bg-[#0a0f16] border border-[#2b3a4f] rounded-lg px-3 py-2 text-xs text-white focus:border-[#ffcc00] outline-none cursor-pointer"
              >
                <option value="1080p FHD">1080p FHD</option>
                <option value="4K UHD">4K UHD</option>
                <option value="720p HD">720p HD</option>
                <option value="SD">SD</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-black bg-[#ffcc00] hover:bg-[#e6b800] rounded-lg transition-colors shadow-md"
            >
              إضافة وتثبيت القناة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
