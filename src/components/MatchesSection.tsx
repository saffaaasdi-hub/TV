import React from 'react';
import { Calendar, Play, Clock, Trophy, Mic } from 'lucide-react';
import { Match, Channel } from '../types';

interface MatchesSectionProps {
  matches: Match[];
  channels: Channel[];
  onPlayChannel: (channel: Channel) => void;
}

export const MatchesSection: React.FC<MatchesSectionProps> = ({
  matches,
  channels,
  onPlayChannel,
}) => {
  const handleWatchMatch = (match: Match) => {
    // Find matching channel by ID or name
    const targetChannel = 
      channels.find((c) => c.id === match.channelId) ||
      channels.find((c) => c.name.toLowerCase().includes(match.channelName.toLowerCase())) ||
      channels[0];

    if (targetChannel) {
      onPlayChannel(targetChannel);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-[#0a0e14] border-t border-[#1b232f]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#ffcc00]" />
          <h3 className="text-base md:text-lg font-bold text-white">
            جدول مباريات اليوم والبثوث المباشرة
          </h3>
        </div>
        <span className="text-xs text-gray-400">
          تحديث مباشر للنتائج والقنوات الناقلة
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {matches.map((match) => {
          const isLive = match.status === 'live';
          return (
            <div
              key={match.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isLive
                  ? 'bg-gradient-to-br from-[#161c26] to-[#121620] border-[#ffcc00]/40 shadow-[0_0_15px_rgba(255,204,0,0.06)]'
                  : 'bg-[#10151e] border-[#1d2634] hover:border-[#2a3649]'
              }`}
            >
              {/* Tournament & Status */}
              <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-white/5">
                <span className="text-gray-300 font-semibold">{match.tournament}</span>
                {isLive ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    مباشر {match.minute}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {match.time}
                  </span>
                )}
              </div>

              {/* Teams & Scores */}
              <div className="flex items-center justify-between gap-2 py-2">
                {/* Home Team */}
                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">{match.homeLogo}</div>
                  <div className="text-xs font-bold text-gray-100 truncate">{match.homeTeam}</div>
                </div>

                {/* Score or VS */}
                <div className="px-3 py-1 bg-black/40 rounded-lg border border-white/5 text-center min-w-[70px]">
                  {isLive ? (
                    <div className="text-lg font-black text-[#ffcc00] tracking-wider font-mono">
                      {match.homeScore} - {match.awayScore}
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-gray-400 tracking-wider">
                      VS
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">{match.awayLogo}</div>
                  <div className="text-xs font-bold text-gray-100 truncate">{match.awayTeam}</div>
                </div>
              </div>

              {/* Match Channel, Commentator & Action */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="text-gray-400 space-y-0.5 min-w-0">
                  <div className="text-gray-300 font-medium truncate flex items-center gap-1">
                    <span className="text-[#ffcc00]">📺</span>
                    <span>{match.channelName}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                    <Mic className="w-3 h-3 text-gray-500" />
                    <span>المعلق: {match.commentator}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleWatchMatch(match)}
                  className="px-3 py-1.5 rounded-lg bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-bold flex items-center gap-1 transition-colors shrink-0 shadow-sm cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>شاهد</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
