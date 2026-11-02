import React, { useState } from 'react';
import { X, Server, Copy, Check, Download, ShieldCheck, Key, User, Globe } from 'lucide-react';
import { ServerConfig, Channel } from '../types';

interface ServerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverConfig: ServerConfig;
  onUpdateServerConfig: (config: ServerConfig) => void;
  channels: Channel[];
}

export const ServerInfoModal: React.FC<ServerInfoModalProps> = ({
  isOpen,
  onClose,
  serverConfig,
  onUpdateServerConfig,
  channels,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<ServerConfig>(serverConfig);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateServerConfig(formData);
    setIsEditing(false);
  };

  const generateM3U = () => {
    let content = '#EXTM3U\n';
    channels.forEach((ch) => {
      content += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" group-title="${ch.category}",${ch.name}\n${ch.url}\n`;
    });
    const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safaa_iptv_playlist_${serverConfig.username}.m3u`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#101620] border border-[#26374a] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#212e3e] flex items-center justify-between bg-gradient-to-r from-[#141c28] to-[#0d121a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffcc00]/10 border border-[#ffcc00]/30 flex items-center justify-center text-[#ffcc00]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">معلومات خدمة البث وسيرفر IPTV</h3>
              <p className="text-xs text-gray-400">منصة صفاء الأسدي لخدمات الإنترنت والبث الرقمي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 md:p-6 space-y-5">
          {!isEditing ? (
            <>
              {/* Server Details Grid matching user's template */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Host */}
                <div className="bg-[#151e2b] border border-[#27384d] rounded-xl p-4 text-center relative group">
                  <div className="flex items-center justify-center gap-1.5 text-[#00d2ff] text-xs font-bold mb-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>SERVER HOST</span>
                  </div>
                  <strong className="text-sm text-white font-mono block break-all mb-2">
                    {serverConfig.host}
                  </strong>
                  <button
                    onClick={() => handleCopy(serverConfig.host, 'host')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                  >
                    {copiedField === 'host' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'host' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>

                {/* Username */}
                <div className="bg-[#151e2b] border border-[#27384d] rounded-xl p-4 text-center relative group">
                  <div className="flex items-center justify-center gap-1.5 text-[#00d2ff] text-xs font-bold mb-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>USERNAME</span>
                  </div>
                  <strong className="text-sm text-white font-mono block break-all mb-2">
                    {serverConfig.username}
                  </strong>
                  <button
                    onClick={() => handleCopy(serverConfig.username, 'user')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                  >
                    {copiedField === 'user' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'user' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>

                {/* Password */}
                <div className="bg-[#151e2b] border border-[#27384d] rounded-xl p-4 text-center relative group">
                  <div className="flex items-center justify-center gap-1.5 text-[#00d2ff] text-xs font-bold mb-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>PASSWORD</span>
                  </div>
                  <strong className="text-sm text-white font-mono block break-all mb-2">
                    {serverConfig.password}
                  </strong>
                  <button
                    onClick={() => handleCopy(serverConfig.password, 'pass')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                  >
                    {copiedField === 'pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'pass' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              {/* M3U URL Box */}
              <div className="bg-[#0b1017] p-4 rounded-xl border border-[#202d3e]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    رابط M3U المباشر للتشغيل على الأجهزة الذكية
                  </span>
                  <button
                    onClick={() => handleCopy(`${serverConfig.host}/get.php?username=${serverConfig.username}&password=${serverConfig.password}&type=m3u_plus`, 'm3u')}
                    className="text-[#ffcc00] hover:underline flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === 'm3u' ? 'تم النسخ!' : 'نسخ الرابط'}
                  </button>
                </div>
                <div className="text-xs font-mono text-gray-400 bg-black/50 p-2.5 rounded-lg border border-white/5 break-all select-all">
                  {serverConfig.host}/get.php?username={serverConfig.username}&password={serverConfig.password}&type=m3u_plus
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  تعديل بيانات السيرفر
                </button>

                <button
                  onClick={generateM3U}
                  className="px-4 py-2 text-xs font-bold text-black bg-[#ffcc00] hover:bg-[#e6b800] rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل ملف M3U للرسيفر والشاشات</span>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  عنوان السيرفر (Server Host)
                </label>
                <input
                  type="text"
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full bg-[#0a0f16] border border-[#2b3a4f] rounded-lg p-2.5 text-xs text-white focus:border-[#ffcc00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    اسم المستخدم (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-[#0a0f16] border border-[#2b3a4f] rounded-lg p-2.5 text-xs text-white focus:border-[#ffcc00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    كلمة المرور (Password)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#0a0f16] border border-[#2b3a4f] rounded-lg p-2.5 text-xs text-white focus:border-[#ffcc00] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-black bg-[#ffcc00] hover:bg-[#e6b800] rounded-lg transition-colors"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          )}

          {/* Copyright notice matching user's template */}
          <div className="pt-4 border-t border-[#1b2533] text-center text-xs text-gray-500">
            جميع الحقوق محفوظة لمنصة صفاء الأسدي لخدمات الإنترنت © 2026
          </div>
        </div>
      </div>
    </div>
  );
};
