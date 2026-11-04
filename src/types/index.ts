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
  localHttpMode?: boolean;
  localIp?: string;
  localPort?: number;
}

export interface LocalNetworkInfo {
  status: string;
  protocol: 'http' | 'https';
  port: number;
  host: string;
  ips: { interface: string; ip: string }[];
  localHttpUrl: string;
  loopbackUrl: string;
  allUrls: string[];
}
