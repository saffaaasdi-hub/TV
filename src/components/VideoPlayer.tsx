import React, { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  Tv, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle,
  Radio,
  PictureInPicture,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Signal,
  Info,
  Hash,
  Star,
  List,
  Monitor,
  Smartphone
} from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  channels?: Channel[];
  onSelectChannel?: (channel: Channel) => void;
  onSelectAlternativeChannel?: (channelId: string) => void;
  categories?: string[];
  isSatelliteOverlayOpen?: boolean;
  setIsSatelliteOverlayOpen?: (open: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  channel, 
  channels = [],
  onSelectChannel,
  onSelectAlternativeChannel,
  categories = [],
  isSatelliteOverlayOpen: externalIsSatelliteOverlayOpen,
  setIsSatelliteOverlayOpen: externalSetIsSatelliteOverlayOpen,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('جاهز للتشغيل');
  const [statusType, setStatusType] = useState<'idle' | 'loading' | 'live' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [levels, setLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [useProxy, setUseProxy] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.protocol === 'https:';
  });

  // Satellite Receiver State (شاشة وقائمة الستلايت OSD)
  const [internalSatelliteOverlayOpen, setInternalSatelliteOverlayOpen] = useState<boolean>(false);
  const isSatelliteOverlayOpen = externalIsSatelliteOverlayOpen !== undefined 
    ? externalIsSatelliteOverlayOpen 
    : internalSatelliteOverlayOpen;
  
  const setIsSatelliteOverlayOpen = (open: boolean) => {
    if (externalSetIsSatelliteOverlayOpen) {
      externalSetIsSatelliteOverlayOpen(open);
    } else {
      setInternalSatelliteOverlayOpen(open);
    }
  };

  const [showSatelliteBanner, setShowSatelliteBanner] = useState<boolean>(true);
  const [satelliteSearch, setSatelliteSearch] = useState<string>('');
  const [satelliteCategory, setSatelliteCategory] = useState<string>('all');
  const [showNumberPad, setShowNumberPad] = useState<boolean>(false);
  const [zapNumber, setZapNumber] = useState<string>('');
  const [zapMessage, setZapMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  const hideControlsTimeout = useRef<number | null>(null);
  const bannerTimeout = useRef<number | null>(null);
  const zapTimeout = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Digital Satellite Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto hide controls after user is inactive
  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      window.clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = window.setTimeout(() => {
      if (isPlaying && !isSatelliteOverlayOpen) {
        setShowControls(false);
        setShowQualityMenu(false);
      }
    }, 4500);
  };

  // Show satellite info banner on channel change
  const triggerSatelliteBanner = () => {
    setShowSatelliteBanner(true);
    if (bannerTimeout.current) {
      window.clearTimeout(bannerTimeout.current);
    }
    bannerTimeout.current = window.setTimeout(() => {
      setShowSatelliteBanner(false);
    }, 4000);
  };

  useEffect(() => {
    if (channel) {
      triggerSatelliteBanner();
    }
  }, [channel?.id]);

  // Channel navigation (CH+ and CH- like TV Remote)
  const currentIndex = useMemo(() => {
    if (!channel || channels.length === 0) return 0;
    const idx = channels.findIndex((c) => c.id === channel.id);
    return idx >= 0 ? idx : 0;
  }, [channel, channels]);

  const handleNextChannel = () => {
    if (channels.length === 0 || !onSelectChannel) return;
    const nextIdx = (currentIndex + 1) % channels.length;
    const target = channels[nextIdx];
    onSelectChannel(target);
    setZapMessage(`CH+ [${String(target.number).padStart(2, '0')}] ${target.name}`);
    setTimeout(() => setZapMessage(null), 1800);
  };

  const handlePrevChannel = () => {
    if (channels.length === 0 || !onSelectChannel) return;
    const prevIdx = (currentIndex - 1 + channels.length) % channels.length;
    const target = channels[prevIdx];
    onSelectChannel(target);
    setZapMessage(`CH- [${String(target.number).padStart(2, '0')}] ${target.name}`);
    setTimeout(() => setZapMessage(null), 1800);
  };

  // Mobile Swipe Gesture Handlers (Swipe Left/Right for channel zapping)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Minimum swipe threshold 45px, horizontal dominance
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        // Swipe Left: Next Channel
        handleNextChannel();
      } else {
        // Swipe Right: Prev Channel
        handlePrevChannel();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation for TV / Desktop remote experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handleNextChannel();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handlePrevChannel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsSatelliteOverlayOpen(!isSatelliteOverlayOpen);
      } else if (e.key === 'Escape') {
        setIsSatelliteOverlayOpen(false);
        setShowNumberPad(false);
      } else if (e.key.toLowerCase() === 'i') {
        triggerSatelliteBanner();
      } else if (/^[0-9]$/.test(e.key)) {
        // Direct number input
        handleDirectNumberInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, channels, isSatelliteOverlayOpen]);

  // Direct Number Zapping (مثل إدخال رقم القناة بالريموت)
  const handleDirectNumberInput = (digit: string) => {
    const newZap = (zapNumber + digit).slice(-3);
    setZapNumber(newZap);
    setZapMessage(`رقم القناة: ${newZap}`);

    if (zapTimeout.current) {
      window.clearTimeout(zapTimeout.current);
    }

    zapTimeout.current = window.setTimeout(() => {
      const num = parseInt(newZap, 10);
      const found = channels.find((c) => c.number === num);
      if (found && onSelectChannel) {
        onSelectChannel(found);
        setZapMessage(`الانتقال إلى: [${String(found.number).padStart(2, '0')}] ${found.name}`);
      } else {
        setZapMessage(`القناة رقم ${num} غير موجودة`);
      }
      setZapNumber('');
      setTimeout(() => setZapMessage(null), 1800);
    }, 1200);
  };

  // Stream Player Logic (HLS)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    setStatusText('جاري الاتصال بالبث...');
    setStatusType('loading');
    setErrorDetails(null);
    setLevels([]);
    setCurrentLevel(-1);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHttp = channel.url.startsWith('http://');
    const isHttpsEnv = window.location.protocol === 'https:';
    // Resolve stream URL: use proxy when on HTTPS or when proxy mode is active for HTTP streams
    const effectiveStreamUrl = (isHttp && useProxy)
      ? `/api/stream-proxy?url=${encodeURIComponent(channel.url)}`
      : channel.url;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;

      hls.loadSource(effectiveStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setStatusText('● البث يعمل الآن بجودة فائقة');
        setStatusType('live');
        const availableLevels = data.levels.map((lvl, index) => ({
          id: index,
          height: lvl.height || 720,
          bitrate: lvl.bitrate || 0,
        }));
        setLevels(availableLevels);

        video.play().catch(() => {
          setIsPlaying(false);
          setStatusText('اضغط على زر التشغيل لبدء البث');
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setCurrentLevel(data.level);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          if (!useProxy && isHttp) {
            console.log('Direct HTTP stream failed, switching to local proxy...');
            setUseProxy(true);
            return;
          }

          setStatusType('error');
          const isLocalIp = channel.url.includes('192.168.') || channel.url.includes('10.') || channel.url.includes('127.0.0.1') || channel.url.includes('nor.tv.com');
          const isCloudPreview = typeof window !== 'undefined' && (window.location.hostname.includes('run.app') || window.location.protocol === 'https:');

          if (isLocalIp && isCloudPreview) {
            setStatusText('سيرفر محلي خاص (Local LAN 192.168.99.10)');
            setErrorDetails('هذا البث موجه للسيرفر الداخلي على شبكتك المحلية (Port 80). سيرفر المعاينة السحابي على الإنترنت لا يملك وصولاً لشبكتك المنزلية، لكن البث يعمل مباشرة وبسرعة فائقة عند فتح الروابط من أجهزتك وشاشاتك المتصلة بنفس الراوتر (أو عبر تطبيقات IPTV و VLC).');
          } else if (isHttpsEnv && !useProxy && isHttp) {
            setStatusText('حظر المتصفح محتوى HTTP (Mixed Content)');
            setErrorDetails('المتصفح يحظر اتصالات HTTP غير المشفرة داخل صفحات HTTPS. افتح الرابط في برنامج خارجي أو على الشبكة المحلية.');
          } else {
            setStatusText('تعذر الاتصال برابط البث عبر الشبكة');
            setErrorDetails('تأكد من عمل سيرفر IPTV على الشبكة المحلية أو جرب التبديل بين البث المباشر والبروكسي.');
          }
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          setStatusText('معالجة بيانات الفيديو...');
          hls.recoverMediaError();
        } else {
          setStatusType('error');
          setStatusText('تعذر تشغيل هذه القناة حالياً');
          hls.destroy();
          hlsRef.current = null;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = effectiveStreamUrl;
      video.addEventListener('loadedmetadata', () => {
        setStatusText('● البث يعمل');
        setStatusType('live');
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        if (!useProxy && isHttp) {
          setUseProxy(true);
          return;
        }
        setStatusType('error');
        setStatusText('حدث خطأ في تشغيل الفيديو');
        if (isHttpsEnv && isHttp) {
          setErrorDetails('حظر المتصفح محتوى HTTP غير المشفر.');
        }
      });
    } else {
      setStatusType('error');
      setStatusText('متصفحك لا يدعم تشغيل HLS');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, useProxy]);

  // Video event handlers
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch((e) => {
        console.error('Play failed:', e);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleToggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  const handleTogglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('Picture in Picture error:', err);
    }
  };

  const handleSelectQuality = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
      setShowQualityMenu(false);
    }
  };

  const handleReload = () => {
    const video = videoRef.current;
    if (!video || !channel) return;
    setStatusText('إعادة تحميل البث...');
    setStatusType('loading');
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    hlsRef.current = hls;
    hls.loadSource(channel.url);
    hls.attachMedia(video);
    video.play().catch(() => {});
  };

  const copyStreamUrl = () => {
    if (!channel) return;
    navigator.clipboard.writeText(channel.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAspectRatio = () => {
    setAspectRatio((prev) => {
      if (prev === 'contain') return 'cover';
      if (prev === 'cover') return 'fill';
      return 'contain';
    });
  };

  // Filter channels inside the Satellite In-Screen Overlay
  const filteredSatelliteChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchSearch = 
        c.name.toLowerCase().includes(satelliteSearch.toLowerCase()) ||
        String(c.number).includes(satelliteSearch) ||
        c.category.toLowerCase().includes(satelliteSearch.toLowerCase());
      
      if (!matchSearch) return false;

      if (satelliteCategory === 'all') return true;
      if (satelliteCategory === 'favorites') return !!c.isFavorite;
      return c.category === satelliteCategory;
    });
  }, [channels, satelliteSearch, satelliteCategory]);

  const objectFitStyle = 
    aspectRatio === 'contain' ? 'object-contain' : 
    aspectRatio === 'cover' ? 'object-cover' : 'object-fill';

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full aspect-video bg-black rounded-lg sm:rounded-2xl overflow-hidden border border-[#232d3d] shadow-2xl group select-none touch-manipulation"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full ${objectFitStyle} transition-all duration-300`}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => {
          setStatusText('جاري التخزين المؤقت...');
          setStatusType('loading');
        }}
        onPlaying={() => {
          setStatusText('● البث يعمل');
          setStatusType('live');
        }}
      />

      {/* Zapping Toast Notification (e.g. CH+ beIN SPORTS 2) */}
      {zapMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-[#ffcc00] text-black font-black px-4 py-1.5 rounded-full shadow-2xl text-xs sm:text-sm animate-bounce flex items-center gap-2 border-2 border-white/40">
          <Tv className="w-4 h-4 fill-black" />
          <span>{zapMessage}</span>
        </div>
      )}

      {/* Top Overlay: Satellite Status Bar & Tools */}
      <div 
        className={`absolute top-0 inset-x-0 p-2 sm:p-3.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
          showControls || isSatelliteOverlayOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left/Start: Satellite Channel Badge & In-Screen Channel List Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Main "OK / القنوات" Satellite Trigger Button */}
          <button
            onClick={() => setIsSatelliteOverlayOpen(!isSatelliteOverlayOpen)}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-extrabold flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all cursor-pointer ${
              isSatelliteOverlayOpen
                ? 'bg-[#ffcc00] text-black scale-102 ring-2 ring-white/30'
                : 'bg-black/60 hover:bg-[#ffcc00] text-white hover:text-black border border-[#ffcc00]/50 hover:border-[#ffcc00]'
            }`}
            title="فتح قائمة قنوات الستلايت داخل الشاشة (OK)"
          >
            <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">قائمة القنوات</span>
            <span className="text-[10px] bg-black/40 text-amber-300 px-1 py-0.2 rounded font-mono">OK</span>
          </button>

          {/* Satellite Channel Info preview */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-[#ffcc00] text-black font-extrabold flex items-center justify-center text-[11px] sm:text-xs shrink-0 shadow">
              {channel ? String(channel.number).padStart(2, '0') : '--'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <h2 className="text-white text-xs sm:text-sm font-bold tracking-wide truncate">
                {channel ? channel.name : 'يرجى اختيار قناة'}
              </h2>
            </div>
          </div>
        </div>

        {/* Right/End: Quick Remote Controls (CH- / CH+, Direct 123, Aspect, Proxy) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Satellite CH- & CH+ Quick Remote Buttons (بارز ومثالي للهاتف) */}
          <div className="flex items-center bg-black/70 rounded-lg border border-white/15 p-0.5 shadow-md">
            <button
              onClick={handlePrevChannel}
              className="px-2 py-1 text-gray-200 hover:text-[#ffcc00] active:scale-95 transition-all text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
              title="القناة السابقة (CH-)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[10px]">CH-</span>
            </button>
            <div className="w-px h-3.5 bg-white/20" />
            <button
              onClick={handleNextChannel}
              className="px-2 py-1 text-gray-200 hover:text-[#ffcc00] active:scale-95 transition-all text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
              title="القناة التالية (CH+)"
            >
              <span className="text-[10px]">CH+</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Satellite Numeric Keypad Toggle */}
          <button
            onClick={() => setShowNumberPad(!showNumberPad)}
            title="لوحة أرقام القنوات (123)"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showNumberPad
                ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                : 'bg-black/60 text-gray-300 hover:text-white border-white/15'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Satellite Info Banner */}
          <button
            onClick={() => setShowSatelliteBanner((prev) => !prev)}
            title="معلومات القناة (INFO)"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showSatelliteBanner
                ? 'bg-[#ffcc00]/20 text-[#ffcc00] border-[#ffcc00]/50'
                : 'bg-black/60 text-gray-300 hover:text-white border-white/15'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* HTTP Mode Toggle (Direct / Local Proxy) */}
          {channel?.url.startsWith('http://') && (
            <button
              onClick={() => setUseProxy((prev) => !prev)}
              title={useProxy ? 'بروكسي محلي نشط' : 'بث مباشر محلي HTTP'}
              className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                useProxy
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span className="hidden xs:inline">{useProxy ? 'بروكسي' : 'مباشر'}</span>
            </button>
          )}

          {/* Aspect Ratio */}
          <button
            onClick={toggleAspectRatio}
            title="أبعاد الشاشة"
            className="hidden sm:inline-block px-2 py-1 text-[10px] rounded-lg bg-black/60 text-gray-200 border border-white/15 hover:bg-white/15 transition-colors cursor-pointer"
          >
            {aspectRatio === 'contain' ? '16:9' : aspectRatio === 'cover' ? 'تغطية' : 'تمدد'}
          </button>

          {/* Copy URL */}
          <button
            onClick={copyStreamUrl}
            title="نسخ الرابط"
            className="p-1.5 rounded-lg bg-black/60 hover:bg-white/15 text-gray-200 border border-white/15 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SATELLITE RECEIVER OSD CHANNEL LIST (قائمة قنوات الستلايت داخل شاشة المشغل) */}
      {/* ========================================================================= */}
      {isSatelliteOverlayOpen && (
        <div className="absolute inset-0 z-40 bg-[#070b12]/93 backdrop-blur-md flex flex-col p-2.5 sm:p-4 text-white animate-in fade-in duration-200">
          {/* Satellite Header */}
          <div className="flex items-center justify-between border-b border-[#223044] pb-2 sm:pb-3 mb-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#ffcc00] to-[#e6a800] text-black flex items-center justify-center font-black shadow-md">
                <Tv className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#ffcc00] flex items-center gap-1.5">
                  <span>قائمة قنوات الستلايت</span>
                  <span className="text-[10px] text-gray-300 font-normal">({filteredSatelliteChannels.length} قناة)</span>
                </h3>
                <p className="text-[10px] text-gray-400">اختر القناة باللمس للتشغيل المباشر داخل المشغل</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="text-[10px] font-mono text-[#ffcc00] bg-black/60 border border-[#ffcc00]/30 px-2 py-0.5 rounded hidden sm:block">
                🕒 {currentTime}
              </div>
              <button
                onClick={() => setIsSatelliteOverlayOpen(false)}
                className="p-1 sm:p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="إغلاق القائمة (EXIT)"
              >
                <X className="w-4 h-4" />
                <span className="hidden xs:inline">إغلاق (EXIT)</span>
              </button>
            </div>
          </div>

          {/* Quick Search & Categories within Satellite OSD */}
          <div className="space-y-1.5 mb-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="search"
                value={satelliteSearch}
                onChange={(e) => setSatelliteSearch(e.target.value)}
                placeholder="بحث سريع عن القناة أو الرقم (beIN, SSC, 1...)"
                className="w-full bg-[#0d1420] text-white text-xs pr-8 pl-3 py-1.5 rounded-lg border border-[#2a384e] focus:border-[#ffcc00] focus:outline-none placeholder:text-gray-500"
              />
              {satelliteSearch && (
                <button
                  onClick={() => setSatelliteSearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Chips inside Satellite OSD */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <button
                onClick={() => setSatelliteCategory('all')}
                className={`px-2.5 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  satelliteCategory === 'all'
                    ? 'bg-[#ffcc00] text-black shadow-xs'
                    : 'bg-[#141d2a] text-gray-300 hover:bg-[#1f2d40]'
                }`}
              >
                الكل ({channels.length})
              </button>

              <button
                onClick={() => setSatelliteCategory('favorites')}
                className={`px-2.5 py-0.5 rounded-md font-bold whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
                  satelliteCategory === 'favorites'
                    ? 'bg-[#ffcc00] text-black shadow-xs'
                    : 'bg-[#141d2a] text-gray-300 hover:bg-[#1f2d40]'
                }`}
              >
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span>المفضلة</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSatelliteCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    satelliteCategory === cat
                      ? 'bg-[#ffcc00] text-black shadow-xs'
                      : 'bg-[#141d2a] text-gray-300 hover:bg-[#1f2d40]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Satellite Channels List Grid */}
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 min-h-0 divide-y divide-[#17202d]/60">
            {filteredSatelliteChannels.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                لا توجد قنوات تطابق بحثك في قائمة الستلايت
              </div>
            ) : (
              filteredSatelliteChannels.map((item) => {
                const isCurrent = channel?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onSelectChannel) {
                        onSelectChannel(item);
                        triggerSatelliteBanner();
                        // Auto close overlay on mobile after selecting
                        if (window.innerWidth < 768) {
                          setIsSatelliteOverlayOpen(false);
                        }
                      }
                    }}
                    className={`w-full text-right p-2 sm:p-2.5 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#ffcc00] text-black font-extrabold shadow-lg ring-1 ring-[#ffcc00]'
                        : 'bg-[#0e1522]/80 hover:bg-[#1a2538] text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      {/* Satellite Channel Number */}
                      <span className={`w-8 h-7 rounded flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                        isCurrent
                          ? 'bg-black text-[#ffcc00]'
                          : 'bg-black/60 text-amber-400 border border-amber-400/30'
                      }`}>
                        {String(item.number).padStart(2, '0')}
                      </span>

                      {/* Channel Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-black' : 'text-white'}`}>
                            {item.name}
                          </span>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                          )}
                        </div>
                        <div className={`text-[10px] flex items-center gap-2 ${isCurrent ? 'text-black/80' : 'text-gray-400'}`}>
                          <span>{item.category}</span>
                          <span>·</span>
                          <span>{item.quality || '1080p'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Satellite Signal & Status Indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-black/20 text-black'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isCurrent ? '● جاري البث' : 'بث مباشر'}
                      </span>
                      <Signal className={`w-3.5 h-3.5 ${isCurrent ? 'text-black' : 'text-emerald-400'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Satellite Footer Remote Info */}
          <div className="mt-2 pt-2 border-t border-[#223044] flex items-center justify-between text-[10px] text-gray-400 shrink-0">
            <span className="flex items-center gap-1">
              <span className="text-[#ffcc00] font-bold">تلميح:</span> يمكنك التمرير السريع (سحب لليسار/اليمين) على الفيديو للتنقل بين القنوات
            </span>
            <span className="hidden sm:inline font-mono">CH- [←] | [→] CH+</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SATELLITE NUMBER PAD OVERLAY (لوحة أرقام الستلايت المباشرة) */}
      {/* ========================================================================= */}
      {showNumberPad && (
        <div className="absolute top-14 left-3 z-30 bg-[#090f19]/95 border border-[#2a3a52] rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-white animate-in zoom-in-95 duration-150">
          <div className="text-[10px] font-bold text-gray-400 mb-1.5 text-center flex items-center justify-between">
            <span>لوحة أرقام الستلايت</span>
            <button onClick={() => setShowNumberPad(false)} className="text-gray-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 w-36">
            {['1','2','3','4','5','6','7','8','9','C','0','OK'].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'C') {
                    setZapNumber('');
                    setZapMessage(null);
                  } else if (key === 'OK') {
                    if (zapNumber) {
                      const num = parseInt(zapNumber, 10);
                      const found = channels.find((c) => c.number === num);
                      if (found && onSelectChannel) onSelectChannel(found);
                      setZapNumber('');
                      setShowNumberPad(false);
                    }
                  } else {
                    handleDirectNumberInput(key);
                  }
                }}
                className="h-8 rounded bg-[#16202e] hover:bg-[#ffcc00] hover:text-black text-xs font-mono font-bold transition-colors flex items-center justify-center cursor-pointer"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Center Big Play/Pause / Loading / Error Overlay */}
      {statusType === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-xs">
          <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs sm:text-sm font-semibold text-gray-200">{statusText}</p>
        </div>
      )}

      {statusType === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-4 sm:p-6 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2.5 text-amber-400">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">{statusText}</h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-3 leading-relaxed">
            {errorDetails || 'تعذر تشغيل هذا الرابط. قد يتطلب الاتصال بشبكة السيرفر المحلية أو مشغل خارجي يدعم بروتوكول HTTP.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {channel?.url.startsWith('http://') && (
              <button
                onClick={() => {
                  setUseProxy((prev) => !prev);
                  setStatusText('إعادة المحاولة عبر النمط الآخر...');
                  setStatusType('loading');
                }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md ${
                  useProxy
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-black'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{useProxy ? 'تجربة الاتصال المباشر HTTP' : 'تشغيل عبر البروكسي المحلي'}</span>
              </button>
            )}

            <button
              onClick={handleReload}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>

            {/* Quick Zap to Next Channel on error */}
            <button
              onClick={handleNextChannel}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              القناة التالية (CH+)
            </button>

            {channel && (
              <a
                href={channel.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                فتح في VLC / خارجي
              </a>
            )}
          </div>
        </div>
      )}

      {/* Big Center Play Button */}
      {!isPlaying && statusType !== 'loading' && statusType !== 'error' && !isSatelliteOverlayOpen && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 m-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#ffcc00]/95 hover:bg-[#ffcc00] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-all z-10 cursor-pointer"
          title="تشغيل البث"
        >
          <Play className="w-5 h-5 sm:w-7 sm:h-7 fill-black translate-x-0.5" />
        </button>
      )}

      {/* ========================================================================= */}
      {/* SATELLITE RECEIVER INFO BANNER (شريط معلومات القناة السفلي مثل أجهزة الستلايت) */}
      {/* ========================================================================= */}
      {showSatelliteBanner && channel && !isSatelliteOverlayOpen && (
        <div className="absolute bottom-11 sm:bottom-13 inset-x-2 sm:inset-x-4 z-20 pointer-events-auto transition-all duration-300">
          <div className="bg-gradient-to-r from-black/95 via-[#0b121e]/95 to-black/95 border-t-2 border-[#ffcc00] rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-2xl backdrop-blur-md text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
              {/* Channel Big Number */}
              <div className="w-9 h-8 sm:w-11 sm:h-10 rounded-lg bg-[#ffcc00] text-black font-black flex items-center justify-center text-sm sm:text-base shrink-0 shadow-lg">
                {String(channel.number).padStart(2, '0')}
              </div>

              {/* Channel Meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-base font-black text-white truncate">
                    {channel.name}
                  </h3>
                  <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase animate-pulse shrink-0">
                    مباشر
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-300 flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[#ffcc00] font-semibold">{channel.category}</span>
                  <span>·</span>
                  <span className="font-mono">{channel.quality || '1080p FHD'}</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-semibold hidden xs:inline">بث محلي (Port 80)</span>
                </div>
              </div>
            </div>

            {/* Satellite Signal Bar & Receiver Clock */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-1.5 sm:pt-0 shrink-0">
              {/* Signal Bar Indicator */}
              <div className="flex items-center gap-1 text-[10px] text-gray-300 bg-black/50 px-2 py-0.5 rounded border border-white/10">
                <Signal className="w-3 h-3 text-emerald-400" />
                <span>إشارة البث:</span>
                <span className="text-emerald-400 font-bold font-mono">99%</span>
              </div>

              {/* Digital Receiver Clock */}
              <div className="text-[10px] sm:text-xs font-mono font-bold text-[#ffcc00] bg-black/60 px-2 py-0.5 rounded border border-[#ffcc00]/30">
                {currentTime}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM BAR STANDARD CONTROLS */}
      {/* ========================================================================= */}
      <div 
        className={`absolute bottom-0 inset-x-0 p-1.5 sm:p-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Left Controls: Play, Reload, Live Indicator, Volume */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handlePlayPause}
              className="p-1 sm:p-1.5 text-white hover:text-[#ffcc00] transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
            </button>

            <button
              onClick={handleReload}
              className="p-1 sm:p-1.5 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
              title="إعادة الاتصال بالبث"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Live Indicator */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-black/40 border border-white/10">
              <span className={`w-2 h-2 rounded-full ${statusType === 'live' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : statusType === 'loading' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-gray-200">
                {statusType === 'live' ? 'بث حي' : statusType === 'loading' ? 'تحميل...' : 'غير متصل'}
              </span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
              <button
                onClick={handleToggleMute}
                className="text-gray-300 hover:text-white transition-colors cursor-pointer p-0.5"
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-12 sm:w-20 accent-[#ffcc00] cursor-pointer h-1 sm:h-1.5 rounded-lg bg-gray-700 hidden xs:inline-block sm:inline-block"
              />
            </div>
          </div>

          {/* Right Controls: Quality Menu, PiP, Fullscreen */}
          <div className="flex items-center gap-1 md:gap-2 relative">
            {/* Satellite List Quick Button on Bottom Bar */}
            <button
              onClick={() => setIsSatelliteOverlayOpen(!isSatelliteOverlayOpen)}
              className="p-1 sm:p-1.5 text-[#ffcc00] hover:text-white transition-colors rounded-lg hover:bg-white/10 flex items-center gap-1 text-xs cursor-pointer"
              title="قائمة قنوات الستلايت"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline font-bold">الستلايت</span>
            </button>

            {/* Quality Selector */}
            {levels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="جودة البث"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{currentLevel === -1 ? 'تلقائي' : `${levels[currentLevel]?.height || 720}p`}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-9 left-0 bg-[#121924] border border-[#26354a] rounded-lg shadow-xl p-1.5 w-36 z-30 space-y-1 text-xs">
                    <button
                      onClick={() => handleSelectQuality(-1)}
                      className={`w-full text-right px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer ${
                        currentLevel === -1 ? 'bg-[#ffcc00] text-black font-bold' : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>تلقائي (Auto)</span>
                      {currentLevel === -1 && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {levels.map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => handleSelectQuality(lvl.id)}
                        className={`w-full text-right px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer ${
                          currentLevel === lvl.id ? 'bg-[#ffcc00] text-black font-bold' : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <span>{lvl.height}p HD</span>
                        {currentLevel === lvl.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PiP */}
            <button
              onClick={handleTogglePiP}
              className="p-1 sm:p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10 hidden sm:block cursor-pointer"
              title="صورة داخل صورة (PiP)"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="p-1 sm:p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
              title={isFullscreen ? 'خروج من الشاشة الكاملة' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
