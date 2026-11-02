export interface Channel {
  id: string;
  name: string;
  url: string;
  category: string;
  number: number;
  logo?: string;
  isFavorite?: boolean;
  quality?: string;
  isLive?: boolean;
  isCustom?: boolean;
}

export interface ChannelGroup {
  category: string;
  channels: Channel[];
}

export interface Match {
  id: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  homeScore?: number;
  awayScore?: number;
  tournament: string;
  time: string;
  status: 'live' | 'upcoming' | 'finished';
  minute?: string;
  channelId: string;
  channelName: string;
  commentator: string;
}

export interface ServerConfig {
  host: string;
  username: string;
  password: string;
  portalName: string;
  lastUpdated: string;
}
