import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

export type ConnectionState = 'online' | 'weak' | 'offline';

export const NetworkStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<ConnectionState>('online');
  const [latency, setLatency] = useState<number | null>(null);
  const [effectiveType, setEffectiveType] = useState<string>('4G');
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSimulatedWeak, setIsSimulatedWeak] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Ping test function to check latency and connectivity
  const checkPing = async () => {
    if (!navigator.onLine) {
      setStatus('offline');
      setLatency(null);
      return;
    }

    setIsChecking(true);
    const start = performance.now();
    try {
      const response = await fetch(`/index.html?ping=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });

      const end = performance.now();
      const rtt = Math.round(end - start);
      setLatency(rtt);

      if (isSimulatedWeak) {
        setStatus('weak');
      } else if (!response.ok || rtt > 350) {
        setStatus('weak');
      } else {
        setStatus('online');
      }
    } catch {
      if (isSimulatedWeak) {
        setStatus('weak');
      } else if (!navigator.onLine) {
        setStatus('offline');
        setLatency(null);
      } else {
        setStatus('weak');
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      if (isSimulatedWeak) {
        setStatus('weak');
      } else {
        setStatus('online');
        checkPing();
      }
    };

    const handleOffline = () => {
      setStatus('offline');
      setLatency(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setStatus('offline');
    } else {
      checkPing();
    }

    const navConn = (navigator as unknown as {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        addEventListener?: (type: string, listener: () => void) => void;
        removeEventListener?: (type: string, listener: () => void) => void;
      };
    }).connection;

    if (navConn) {
      if (navConn.effectiveType) {
        setEffectiveType(navConn.effectiveType.toUpperCase());
        if (
          navConn.effectiveType === 'slow-2g' ||
          navConn.effectiveType === '2g'
        ) {
          setStatus('weak');
        }
      }

      const handleConnChange = () => {
        if (navConn.effectiveType) {
          setEffectiveType(navConn.effectiveType.toUpperCase());
          if (
            navConn.effectiveType === 'slow-2g' ||
            navConn.effectiveType === '2g'
          ) {
            setStatus('weak');
          } else if (navigator.onLine && !isSimulatedWeak) {
            checkPing();
          }
        }
      };

      if (navConn.addEventListener) {
        navConn.addEventListener('change', handleConnChange);
      }
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (navConn.removeEventListener) {
          navConn.removeEventListener('change', handleConnChange);
        }
      };
    }

    const interval = setInterval(() => {
      if (navigator.onLine && !isSimulatedWeak) {
        checkPing();
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isSimulatedWeak]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isGreen = status === 'online' && !isSimulatedWeak;
  const isWeak = status === 'weak' || isSimulatedWeak;
  const isOffline = status === 'offline';

  const handleToggleSimulateWeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isSimulatedWeak;
    setIsSimulatedWeak(next);
    if (next) {
      setStatus('weak');
    } else {
      if (!navigator.onLine) {
        setStatus('offline');
      } else {
        setStatus('online');
        checkPing();
      }
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Network Status Pill Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        title={
          isGreen
            ? `الشبكة متصلة ومستقرة ${latency ? `(${latency}ms)` : ''} - اضغط للتفاصيل`
            : isWeak
            ? 'تنبيه: اتصال الشبكة ضعيف أو غير مستقر - اضغط للتفاصيل'
            : 'تنبيه: تم انقطاع اتصال الإنترنت - اضغط للتفاصيل'
        }
        className={`group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300 cursor-pointer select-none ${
          isGreen
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
            : 'bg-orange-500/20 border-orange-500/45 text-orange-400 hover:bg-orange-500/30 hover:border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
        }`}
      >
        {/* Pulsing Status Dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isGreen
                ? 'animate-ping bg-emerald-400'
                : 'animate-pulse bg-orange-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isGreen ? 'bg-emerald-400' : 'bg-orange-400'
            }`}
          />
        </span>

        {/* Status Icon */}
        {isGreen ? (
          <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
        ) : isWeak ? (
          <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0" />
        ) : (
          <WifiOff className="w-3 h-3 text-orange-400 shrink-0" />
        )}

        {/* Status Text Label */}
        <span className="tracking-tight whitespace-nowrap">
          {isGreen
            ? latency !== null
              ? `متصل (${latency}ms)`
              : 'متصل'
            : isWeak
            ? 'ضعف الشبكة'
            : 'انقطاع الاتصال'}
        </span>
      </button>

      {/* Popover / Detail Card */}
      {isOpen && (
        <div
          dir="rtl"
          className="absolute top-full right-0 mt-2 w-72 p-3.5 bg-[#0e141d] border border-[#223042] rounded-xl shadow-2xl z-50 text-right backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1b2636] pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isGreen
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}
              >
                {isGreen ? (
                  <Wifi className="w-4 h-4" />
                ) : isWeak ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">حالة اتصال الشبكة</span>
                <span
                  className={`text-[10px] font-semibold block ${
                    isGreen ? 'text-emerald-400' : 'text-orange-400'
                  }`}
                >
                  {isGreen
                    ? 'الشبكة ممتازة للبث الرياضي'
                    : isWeak
                    ? 'الشبكة ضعيفة (قد تواجه تقطيع)'
                    : 'لا يوجد اتصال بالإنترنت'}
                </span>
              </div>
            </div>

            <button
              onClick={checkPing}
              disabled={isChecking}
              title="إعادة فحص الاتصال الآن"
              className="p-1.5 rounded-lg bg-[#16202e] hover:bg-[#1f2d40] text-gray-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-[#ffcc00]' : ''}`}
              />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
            <div className="bg-[#141b26] p-2 rounded-lg border border-[#1e2a3a]">
              <span className="text-gray-400 block text-[10px] mb-0.5">سرعة الاستجابة (Ping)</span>
              <span className="font-mono font-bold text-white">
                {latency !== null ? `${latency} ms` : isOffline ? '---' : 'جاري الفحص...'}
              </span>
            </div>
            <div className="bg-[#141b26] p-2 rounded-lg border border-[#1e2a3a]">
              <span className="text-gray-400 block text-[10px] mb-0.5">نوع الاتصال</span>
              <span className="font-bold text-white">{effectiveType || 'Wi-Fi/LAN'}</span>
            </div>
            <div className="bg-[#141b26] p-2 rounded-lg border border-[#1e2a3a] col-span-2 flex items-center justify-between">
              <span className="text-gray-400 text-[10px]">خادم الشبكة المحلية:</span>
              <span className="font-mono text-emerald-400 font-bold text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                سيرفر HTTP (0.0.0.0:3000) نشط
              </span>
            </div>
          </div>

          {/* Color Indicator Legend */}
          <div className="bg-[#111722] p-2 rounded-lg border border-[#1a2332] text-[10px] text-gray-300 space-y-1.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span>
                <strong className="text-emerald-400">اللون الأخضر:</strong> متصل ومستقر لجودة FHD/4K
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
              <span>
                <strong className="text-orange-400">اللون البرتقالي:</strong> ضعف في الشبكة أو انقطاع
              </span>
            </div>
          </div>

          {/* Test State Toggle (to easily verify orange state) */}
          <div className="pt-2 border-t border-[#1a2536] flex items-center justify-between">
            <span className="text-[10px] text-gray-400">تجربة محاكاة ضعف الشبكة:</span>
            <button
              onClick={handleToggleSimulateWeak}
              type="button"
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                isSimulatedWeak
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#1b2533] text-gray-300 hover:text-white'
              }`}
            >
              {isSimulatedWeak ? 'إلغاء المحاكاة (أخضر)' : 'تفعيل الضعف (برتقالي)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
