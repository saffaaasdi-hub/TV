import React, { useEffect, useRef, useState } from 'react';
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
  SlidersHorizontal
} from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  onSelectAlternativeChannel?: (channelId: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  channel, 
  onSelectAlternativeChannel 
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

  const hideControlsTimeout = useRef<number | null>(null);

  // Auto hide controls after user is inactive
  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      window.clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowQualityMenu(false);
      }
    }, 4000);
  };

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

    const isHttpOnHttps = window.location.protocol === 'https:' && channel.url.startsWith('http://');

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;

      hls.loadSource(channel.url);
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
          // Autoplay blocked by browser policy
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
          setStatusType('error');
          if (isHttpOnHttps) {
            setStatusText('تعذر تحميل البث (حماية Mixed Content المتصفح)');
            setErrorDetails('الرابط يستخدم بروتوكول HTTP غير مشفر داخل صفحة HTTPS، أو أن سيرفر البث nor.tv.com متاح على شبكة محلية خاصة.');
          } else {
            setStatusText('تعذر الاتصال بسيرفر البث');
            setErrorDetails('تأكد من عمل سيرفر IPTV أو جرب قناة تجريبية بديلة.');
          }
          // Attempt retry once
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
      // Native Apple HLS (Safari, iOS)
      video.src = channel.url;
      video.addEventListener('loadedmetadata', () => {
        setStatusText('● البث يعمل');
        setStatusType('live');
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setStatusType('error');
        setStatusText('حدث خطأ في تشغيل الفيديو');
        if (isHttpOnHttps) {
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
  }, [channel]);

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

  const objectFitStyle = 
    aspectRatio === 'contain' ? 'object-contain' : 
    aspectRatio === 'cover' ? 'object-cover' : 'object-fill';

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-[#232d3d] shadow-2xl group select-none"
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

      {/* Top Overlay: Channel Name & Quick Info */}
      <div 
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ffcc00] text-black font-extrabold flex items-center justify-center text-sm shadow-md">
            {channel ? String(channel.number).padStart(2, '0') : '--'}
          </div>
          <div>
            <h2 className="text-white text-base md:text-lg font-bold tracking-wide flex items-center gap-2">
              {channel ? channel.name : 'يرجى اختيار قناة رياضية'}
              {channel?.isLive && (
                <span className="bg-red-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase animate-pulse">
                  مباشر LIVE
                </span>
              )}
            </h2>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>{channel?.category || 'بث مباشر'}</span>
              <span>·</span>
              <span>{channel?.quality || 'FHD 1080p'}</span>
            </div>
          </div>
        </div>

        {/* Top-Right Tools */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Badge */}
          <button
            onClick={toggleAspectRatio}
            title="تغيير أبعاد العرض (16:9 / شاشة كاملة)"
            className="px-2.5 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 transition-colors"
          >
            {aspectRatio === 'contain' ? '16:9 قياسي' : aspectRatio === 'cover' ? 'تغطية الشاشة' : 'تمدد ملء الشاشة'}
          </button>

          {/* Copy URL */}
          <button
            onClick={copyStreamUrl}
            title="نسخ رابط البث m3u8"
            className="p-2 rounded bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Big Play/Pause / Loading / Error Overlay */}
      {statusType === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-xs">
          <div className="w-14 h-14 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-gray-200">{statusText}</p>
        </div>
      )}

      {statusType === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{statusText}</h3>
          <p className="text-xs md:text-sm text-gray-400 max-w-md mb-4 leading-relaxed">
            {errorDetails || 'تعذر تشغيل هذا الرابط. قد يتطلب الاتصال بشبكة السيرفر المحلية أو مشغل خارجي يدعم بروتوكول HTTP.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleReload}
              className="px-4 py-2 bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>

            {channel && (
              <a
                href={channel.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                فتح في تبويب جديد / VLC
              </a>
            )}

            {onSelectAlternativeChannel && (
              <button
                onClick={() => onSelectAlternativeChannel('demo-live-1')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Tv className="w-3.5 h-3.5" />
                تشغيل بث تجريبي فوري
              </button>
            )}
          </div>
        </div>
      )}

      {!isPlaying && statusType !== 'loading' && statusType !== 'error' && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 m-auto w-18 h-18 rounded-full bg-[#ffcc00]/95 hover:bg-[#ffcc00] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-all z-10"
        >
          <Play className="w-8 h-8 fill-black translate-x-0.5" />
        </button>
      )}

      {/* Bottom Bar Controls */}
      <div 
        className={`absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Controls: Play, Reload, Live Indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="p-2 text-white hover:text-[#ffcc00] transition-colors rounded-lg hover:bg-white/10"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={handleReload}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              title="إعادة الاتصال بالبث"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-black/40 border border-white/10">
              <span className={`w-2.5 h-2.5 rounded-full ${statusType === 'live' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : statusType === 'loading' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-gray-200">
                {statusType === 'live' ? 'بث حي' : statusType === 'loading' ? 'تحميل...' : 'غير متصل'}
              </span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={handleToggleMute}
                className="text-gray-300 hover:text-white transition-colors"
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 md:w-24 accent-[#ffcc00] cursor-pointer h-1.5 rounded-lg bg-gray-700"
              />
            </div>
          </div>

          {/* Right Controls: Quality Menu, PiP, Fullscreen */}
          <div className="flex items-center gap-1 md:gap-2 relative">
            {/* Quality Selector */}
            {levels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="px-2.5 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-gray-200 flex items-center gap-1 transition-colors"
                  title="جودة البث"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{currentLevel === -1 ? 'تلقائي (Auto)' : `${levels[currentLevel]?.height || 720}p`}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-9 left-0 bg-[#121924] border border-[#26354a] rounded-lg shadow-xl p-1.5 w-36 z-30 space-y-1 text-xs">
                    <button
                      onClick={() => handleSelectQuality(-1)}
                      className={`w-full text-right px-2.5 py-1.5 rounded flex items-center justify-between ${
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
                        className={`w-full text-right px-2.5 py-1.5 rounded flex items-center justify-between ${
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
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10 hidden sm:block"
              title="صورة داخل صورة (PiP)"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              title={isFullscreen ? 'خروج من الشاشة الكاملة' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
