import React, { useState } from 'react';
import { 
  Server, 
  User, 
  KeyRound, 
  Link, 
  Copy, 
  Check, 
  X, 
  Download, 
  ShieldCheck, 
  Tv, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { ServerConfig } from '../types';

interface ServerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverConfig: ServerConfig;
  onDownloadM3U: () => void;
  channelCount: number;
}

export const ServerInfoModal: React.FC<ServerInfoModalProps> = ({
  isOpen,
  onClose,
  serverConfig,
  onDownloadM3U,
  channelCount,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const m3uUrl = `${serverConfig.host}/get.php?username=${serverConfig.username}&password=${serverConfig.password}&type=m3u_plus`;
  const xtreamApiUrl = `${serverConfig.host}/player_api.php?username=${serverConfig.username}&password=${serverConfig.password}`;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const infoFields = [
    {
      key: 'host',
      label: 'عنوان السيرفر (Server Host / URL)',
      value: serverConfig.host,
      icon: Server,
      badge: 'الخادم الرئيسي',
      badgeColor: 'text-[#ffcc00] bg-[#ffcc00]/10 border-[#ffcc00]/30',
    },
    {
      key: 'username',
      label: 'اسم المستخدم (Username)',
      value: serverConfig.username,
      icon: User,
      badge: 'الحساب',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      key: 'password',
      label: 'كلمة المرور (Password)',
      value: serverConfig.password,
      icon: KeyRound,
      badge: 'الرمز السري',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      key: 'm3u',
      label: 'رابط ملف M3U الكامل (M3U Plus Playlist)',
      value: m3uUrl,
      icon: Link,
      badge: 'M3U Plus',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      isLong: true,
    },
    {
      key: 'xtream',
      label: 'رابط واجهة Xtream Codes API',
      value: xtreamApiUrl,
      icon: ExternalLink,
      badge: 'Xtream API',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      isLong: true,
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0e141e] border border-[#233245] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#141d2b] to-[#0d141e] border-b border-[#202d3f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffcc00]/15 text-[#ffcc00] border border-[#ffcc00]/30 flex items-center justify-center font-bold shadow-md">
              <Server className="w-5 h-5 text-[#ffcc00]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>سيرفر nor.tv.com</span>
              </h2>
              <p className="text-xs text-gray-400">
                بيانات الاتصال لإعداد مشغلات IPTV على الشاشات الذكية والهواتف
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-right">
          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/25 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="text-xs text-gray-300">
              <span className="font-bold text-white">الخادم المسجل:</span> {serverConfig.host} — القنوات تبث محلياً عبر بورت 80 مع دعم كامل لجميع صيغ البث HLS/M3U8.
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-3">
            {infoFields.map((field) => {
              const Icon = field.icon;
              const isCopied = copiedKey === field.key;

              return (
                <div
                  key={field.key}
                  className="p-3 sm:p-3.5 rounded-xl bg-[#121a26] border border-[#1d2b3c] hover:border-[#2a3c54] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#ffcc00]" />
                      <span className="text-xs font-bold text-gray-200">{field.label}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${field.badgeColor}`}>
                      {field.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-[#090d14] border border-[#1a2535] rounded-lg px-3 py-2 text-xs font-mono text-gray-100 select-all overflow-x-auto whitespace-nowrap">
                      {field.value}
                    </div>

                    <button
                      onClick={() => copyToClipboard(field.value, field.key)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-[#1b2738] hover:bg-[#25354d] text-gray-200 border border-[#2b3d55]'
                      }`}
                      title="نسخ إلى الحافظة"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Setup Instructions for IPTV apps */}
          <div className="p-3.5 rounded-xl bg-[#0a0f16] border border-[#1b2636] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
              <Layers className="w-4 h-4 text-[#ffcc00]" />
              <span>كيفية التشغيل على التطبيقات (IPTV Smarters / TiviMate / Smart TV):</span>
            </div>
            <ul className="text-[11px] text-gray-400 space-y-1 list-disc list-inside leading-relaxed pr-1">
              <li>
                اختر <strong className="text-gray-200">Xtream Codes API</strong> في التطبيق.
              </li>
              <li>
                اكتب أي اسم للقائمة (مثلاً: <strong className="text-gray-200">سيرفر صفاء الأسدي</strong>).
              </li>
              <li>
                أدخل عنوان السيرفر: <strong className="text-[#ffcc00] font-mono">{serverConfig.host}</strong>
              </li>
              <li>
                أدخل اسم المستخدم: <strong className="text-[#ffcc00] font-mono">{serverConfig.username}</strong> وكلمة المرور: <strong className="text-[#ffcc00] font-mono">{serverConfig.password}</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#0a0f16] border-t border-[#1c2738] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Tv className="w-4 h-4 text-gray-500" />
            <span>عدد القنوات النشطة: <strong className="text-white">{channelCount} قناة</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadM3U}
              className="px-3.5 py-2 text-xs font-bold text-black bg-[#ffcc00] hover:bg-[#e6b800] rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف M3U</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
