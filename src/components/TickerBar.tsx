import React from 'react';
import { Megaphone } from 'lucide-react';

interface TickerBarProps {
  newsItems?: string[];
}

export const TickerBar: React.FC<TickerBarProps> = ({ newsItems }) => {
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
    <div className="h-10 bg-[#0d131c] border-t border-[#1c2736] flex items-center overflow-hidden shrink-0 z-20 select-none">
      {/* Label Badge */}
      <div className="bg-[#ffcc00] text-black h-full px-3 md:px-4 flex items-center gap-1.5 font-black text-xs shrink-0 z-10 shadow-md">
        <Megaphone className="w-3.5 h-3.5 fill-black" />
        <span>أخبار المنصة</span>
      </div>

      {/* Marquee Track */}
      <div className="overflow-hidden flex-1 relative h-full flex items-center">
        <div className="animate-marquee flex items-center whitespace-nowrap">
          {items.map((item, index) => (
            <span
              key={`item-1-${index}`}
              className="text-[#ffcc00] text-xs font-semibold px-6 flex items-center gap-2"
            >
              <span>{item}</span>
              <span className="text-gray-600 text-sm">✦</span>
            </span>
          ))}
          {items.map((item, index) => (
            <span
              key={`item-2-${index}`}
              className="text-[#ffcc00] text-xs font-semibold px-6 flex items-center gap-2"
            >
              <span>{item}</span>
              <span className="text-gray-600 text-sm">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
