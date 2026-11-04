import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';

interface TickerBarProps {
  newsItems?: string[];
}

export const TickerBar: React.FC<TickerBarProps> = ({ newsItems }) => {
  const [isPaused, setIsPaused] = useState(false);

  const defaultItems = [
    '📢 خدمات الإنترنت والبث الرياضي - سرعة فائقة وجودة مستقرة 4K / FHD',
    '⚽ تغطية حصرية لكافة مباريات دوري أبطال أوروبا، والدوريات الأوروبية والعربية',
    '💰 عروض واشتراكات مميزة لجميع مشتركي منصة صفاء الأسدي',
    '🛠️ الدعم الفني والصيانة متوفر على مدار 24 ساعة لخدمتكم',
    '⭐ منصة صفاء الأسدي - عنوان الجودة والاستقرار الرياضي الدائم',
    '📺 لمستخدمي الشاشات والرسيفرات: يمكنكم تحميل ملف M3U مباشرة من زر معلومات السيرفر',
  ];

  const items = newsItems || defaultItems;

  return (
    <div 
      className="h-7.5 sm:h-9 md:h-10 bg-[#0d131c] border-t border-[#1c2736] flex items-center overflow-hidden shrink-0 z-20 select-none group"
      title="شريط الأخبار: يتحرك بهدوء من اليسار إلى اليمين - اضغط للإيقاف المؤقت"
    >
      {/* Label Badge */}
      <div className="bg-[#ffcc00] text-black h-full px-2 sm:px-3.5 flex items-center gap-1 sm:gap-1.5 font-black text-[10px] sm:text-xs shrink-0 z-10 shadow-md">
        <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-black" />
        <span className="whitespace-nowrap">أخبار المنصة</span>
        <span className="text-[9px] font-bold opacity-80 hidden md:inline-block">←</span>
      </div>

      {/* Marquee Track - Moving slowly from Left to Right */}
      <div 
        dir="ltr"
        onClick={() => setIsPaused(!isPaused)}
        className="overflow-hidden flex-1 relative h-full flex items-center cursor-pointer"
      >
        <div 
          className="animate-marquee flex items-center whitespace-nowrap min-w-full"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
            animationDuration: '75s'
          }}
        >
          {items.map((item, index) => (
            <span
              dir="rtl"
              key={`item-1-${index}`}
              className="text-[#ffcc00] text-[10px] sm:text-xs font-semibold px-4 sm:px-6 flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              <span>{item}</span>
              <span className="text-gray-600 text-xs sm:text-sm">✦</span>
            </span>
          ))}
          {items.map((item, index) => (
            <span
              dir="rtl"
              key={`item-2-${index}`}
              className="text-[#ffcc00] text-[10px] sm:text-xs font-semibold px-4 sm:px-6 flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              <span>{item}</span>
              <span className="text-gray-600 text-xs sm:text-sm">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
