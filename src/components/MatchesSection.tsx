import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Play, 
  Clock, 
  Trophy, 
  Mic, 
  Search, 
  Tv, 
  Filter, 
  ArrowRight,
  RefreshCw,
  Zap,
  Pause,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Match, Channel } from '../types';

interface MatchesSectionProps {
  matches: Match[];
  channels: Channel[];
  onPlayChannel: (channel: Channel) => void;
  onBackToPlayer?: () => void;
}

const REFRESH_INTERVAL_SECONDS = 30;

export const MatchesSection: React.FC<MatchesSectionProps> = ({
  matches: initialMatches,
  channels,
  onPlayChannel,
  onBackToPlayer,
}) => {
  // Live mutable matches state that auto-updates
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto-refresh states
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(REFRESH_INTERVAL_SECONDS);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [latestGoalNotification, setLatestGoalNotification] = useState<string | null>(null);
  const [recentlyUpdatedMatchId, setRecentlyUpdatedMatchId] = useState<string | null>(null);

  const goalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh handler to increment minutes and simulate realistic live progression
  const performRefresh = () => {
    setIsRefreshing(true);

    setMatches((prevMatches) => {
      let goalMsg: string | null = null;
      let updatedId: string | null = null;

      const updated = prevMatches.map((m) => {
        if (m.status === 'live' && m.minute) {
          // Extract numeric minute
          const currentMin = parseInt(m.minute.replace("'", ''), 10) || 60;
          const nextMin = currentMin + 1;

          // Occasionally trigger a goal or exciting moment
          let newHomeScore = m.homeScore;
          let newAwayScore = m.awayScore;

          if (nextMin === 70 && m.id === 'm1' && m.homeScore === 2) {
            newHomeScore = 3;
            goalMsg = `⚽ هدف رائع لصالح ريال مدريد (3 - 1) دقيقة ${nextMin}'`;
            updatedId = m.id;
          } else if (nextMin === 58 && m.id === 'm2' && m.awayScore === 1) {
            newAwayScore = 2;
            goalMsg = `⚽ هدف حاسم للنصر في ديربي الرياض (1 - 2) دقيقة ${nextMin}'`;
            updatedId = m.id;
          }

          const minuteStr = nextMin >= 90 ? `90+${nextMin - 90}'` : `${nextMin}'`;

          return {
            ...m,
            minute: minuteStr,
            homeScore: newHomeScore,
            awayScore: newAwayScore,
          };
        }
        return m;
      });

      if (goalMsg) {
        setLatestGoalNotification(goalMsg);
        setRecentlyUpdatedMatchId(updatedId);
        if (goalTimeoutRef.current) clearTimeout(goalTimeoutRef.current);
        goalTimeoutRef.current = setTimeout(() => {
          setLatestGoalNotification(null);
          setRecentlyUpdatedMatchId(null);
        }, 8000);
      }

      return updated;
    });

    setLastUpdatedTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setSecondsRemaining(REFRESH_INTERVAL_SECONDS);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Timer loop for auto-refresh
  useEffect(() => {
    if (!isAutoRefreshActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          performRefresh();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefreshActive]);

  // Extract unique tournaments
  const tournaments = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.tournament) set.add(m.tournament);
    });
    return Array.from(set);
  }, [matches]);

  // Counts
  const liveCount = useMemo(() => matches.filter((m) => m.status === 'live').length, [matches]);
  const upcomingCount = useMemo(() => matches.filter((m) => m.status === 'upcoming').length, [matches]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Status filter
      if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }
      // Tournament filter
      if (selectedTournament !== 'all' && m.tournament !== selectedTournament) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTeams =
          m.homeTeam.toLowerCase().includes(q) ||
          m.awayTeam.toLowerCase().includes(q) ||
          m.tournament.toLowerCase().includes(q) ||
          m.channelName.toLowerCase().includes(q) ||
          m.commentator.toLowerCase().includes(q);
        if (!matchesTeams) return false;
      }
      return true;
    });
  }, [matches, statusFilter, selectedTournament, searchQuery]);

  const handleWatchMatch = (match: Match) => {
    const targetChannel =
      channels.find((c) => c.id === match.channelId) ||
      channels.find((c) => c.name.toLowerCase().includes(match.channelName.toLowerCase())) ||
      channels[0];

    if (targetChannel) {
      onPlayChannel(targetChannel);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Live Goal Flash Toast Banner */}
      {latestGoalNotification && (
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-950/40 border border-emerald-400/40 flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white text-emerald-800 font-black flex items-center justify-center text-sm shadow">
              ⚽
            </span>
            <div>
              <span className="text-xs sm:text-sm font-black block">تحديث مباشر للنتيجة:</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-100">{latestGoalNotification}</span>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-black/25 text-white/90">
            تحديث تلقائي نشط
          </span>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-[#121926] via-[#0e141e] to-[#0a0d14] border border-[#212f42] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#ffcc00] to-[#e69d00] text-black flex items-center justify-center font-black shadow-lg shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-white">
                  جدول مباريات اليوم
                </h1>
                {liveCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>{liveCount} مباشر الآن</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                متابعة حية للنتائج، القنوات الناقلة والمعلقين مع ميزة التحديث التلقائي المستمر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Refresh Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141d2a] border border-[#233144] text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isAutoRefreshActive ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                <span className="text-[11px] font-bold text-gray-200">
                  {isAutoRefreshActive ? (
                    <span className="flex items-center gap-1">
                      <span>تحديث تلقائي:</span>
                      <span className="text-[#ffcc00] font-mono font-black">{secondsRemaining}ث</span>
                    </span>
                  ) : (
                    'التحديث التلقائي متوقف'
                  )}
                </span>
              </div>

              {/* Pause/Resume Toggle */}
              <button
                onClick={() => setIsAutoRefreshActive((prev) => !prev)}
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={isAutoRefreshActive ? 'إيقاف التحديث التلقائي مؤقتاً' : 'استئناف التحديث التلقائي'}
              >
                {isAutoRefreshActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              {/* Manual Refresh Button */}
              <button
                onClick={performRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffcc00]/15 hover:bg-[#ffcc00]/25 text-[#ffcc00] font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                title="تحديث البيانات الآن فوراً"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">تحديث الآن</span>
              </button>
            </div>

            {onBackToPlayer && (
              <button
                onClick={onBackToPlayer}
                className="px-3.5 py-2 text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 hover:text-white rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للبث المباشر</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Auto-Refresh Info Sub-bar */}
        <div className="mt-3 pt-2.5 border-t border-[#1a2535] flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>نظام التحديث الذاتي نشط تلقائياً</span>
            </span>
            <span className="text-gray-600">•</span>
            <span>آخر تحديث: <strong className="text-gray-200 font-mono">{lastUpdatedTime}</strong></span>
          </div>
          <span className="text-gray-500 text-[10px]">
            تتحدث دقائق المباريات والنتائج تلقائياً كل {REFRESH_INTERVAL_SECONDS} ثانية دون الحاجة لإعادة تحميل الصفحة
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-3.5 border-t border-[#1d293a] flex flex-wrap items-center justify-between gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[#ffcc00] text-black shadow-sm'
                  : 'bg-[#151d29] text-gray-300 hover:bg-[#1d2838]'
              }`}
            >
              جميع المباريات ({matches.length})
            </button>

            <button
              onClick={() => setStatusFilter('live')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'live'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-[#151d29] text-gray-300 hover:bg-[#1d2838]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>مباشر ({liveCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'upcoming'
                  ? 'bg-[#00d2ff] text-black shadow-sm'
                  : 'bg-[#151d29] text-gray-300 hover:bg-[#1d2838]'
              }`}
            >
              القادمة ({upcomingCount})
            </button>

            <button
              onClick={() => setStatusFilter('finished')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'finished'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-[#151d29] text-gray-300 hover:bg-[#1d2838]'
              }`}
            >
              المنتهية
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن فريق، بطولة أو معلق..."
              className="w-full bg-[#080d14] text-gray-100 text-xs pr-8.5 pl-3 py-2 rounded-lg border border-[#233144] focus:border-[#ffcc00] focus:outline-none transition-colors placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Tournament Chips */}
        {tournaments.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] text-gray-400 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#ffcc00]" />
              البطولات:
            </span>
            <button
              onClick={() => setSelectedTournament('all')}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedTournament === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              الكل
            </button>
            {tournaments.map((tour) => (
              <button
                key={tour}
                onClick={() => setSelectedTournament(tour)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTournament === tour
                    ? 'bg-[#ffcc00]/20 text-[#ffcc00] border border-[#ffcc00]/40 font-bold'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {tour}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0b0f16] border border-[#1c2738] text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-300">لا توجد مباريات مطابقة للبحث أو التصفية</h3>
          <p className="text-xs text-gray-500 mt-1">جرب تغيير الفلتر أو البحث عن اسم فريق آخر</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredMatches.map((match) => {
            const isLive = match.status === 'live';
            const isHighlighted = recentlyUpdatedMatchId === match.id;

            return (
              <div
                key={match.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                  isHighlighted
                    ? 'bg-gradient-to-br from-[#2a2d15] via-[#1a231b] to-[#0c1017] border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                    : isLive
                    ? 'bg-gradient-to-br from-[#18212e] via-[#121822] to-[#0c1017] border-[#ffcc00]/50 shadow-[0_0_20px_rgba(255,204,0,0.08)]'
                    : 'bg-[#0f141d] border-[#1f2b3b] hover:border-[#2f4057]'
                }`}
              >
                {/* Tournament & Time */}
                <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                    <span className="text-[#ffcc00] font-black text-xs">⚽</span>
                    <span className="text-gray-200 font-bold truncate">{match.tournament}</span>
                  </div>
                  {isLive ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded text-[11px] shrink-0 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>مباشر</span>
                      <span className="font-mono text-[#ffcc00] font-black">{match.minute}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400 text-[11px] shrink-0 bg-white/5 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {match.time}
                    </span>
                  )}
                </div>

                {/* Match Teams & Center Score/VS */}
                <div className="flex items-center justify-between gap-3 py-3 px-1">
                  {/* Home Team */}
                  <div className="flex-1 text-center">
                    <div className="text-3xl mb-1.5 transition-transform hover:scale-110 duration-200 select-none">
                      {match.homeLogo}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {match.homeTeam}
                    </div>
                  </div>

                  {/* Score or VS */}
                  <div className="px-3.5 py-1.5 bg-black/60 rounded-xl border border-white/10 text-center min-w-[76px] shadow-inner shrink-0">
                    {isLive ? (
                      <div>
                        <div className="text-lg sm:text-xl font-black text-[#ffcc00] tracking-wider font-mono">
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block">
                          الشوط الثاني
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-gray-400 tracking-wider">
                        VS
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 text-center">
                    <div className="text-3xl mb-1.5 transition-transform hover:scale-110 duration-200 select-none">
                      {match.awayLogo}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {match.awayTeam}
                    </div>
                  </div>
                </div>

                {/* Match Footer: Channel, Commentator & Action */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs gap-2">
                  <div className="text-gray-400 space-y-0.5 min-w-0">
                    <div className="text-gray-200 font-semibold truncate flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Tv className="w-3.5 h-3.5 text-[#ffcc00] shrink-0" />
                      <span className="text-[#ffcc00]">{match.channelName}</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-gray-400 truncate flex items-center gap-1.5">
                      <Mic className="w-3 h-3 text-gray-500 shrink-0" />
                      <span>المعلق: {match.commentator}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWatchMatch(match)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-md shadow-amber-500/10 hover:scale-102 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>مشاهدة البث</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
