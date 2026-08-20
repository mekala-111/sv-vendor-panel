/** YouTube connection/stream fetchers for the vendor panel. */

import { api } from "@/lib/api";

export interface YoutubeChannel {
  id: string;
  channelId: string;
  channelName: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR" | "TOKEN_EXPIRED";
  tokenExpiry: string | null;
  createdAt: string;
}

export interface YoutubeStreamWithEvent {
  id: string;
  eventId: string;
  youtubeChannelId: string;
  youtubeVideoId: string | null;
  youtubeLiveUrl: string | null;
  status: "CONNECTED" | "SCHEDULED" | "LIVE" | "ENDED" | "ERROR";
  createdAt: string;
  event: { id: string; eventName: string; eventSlug: string };
}

export async function fetchYoutubeChannels(): Promise<YoutubeChannel[]> {
  return api.get<YoutubeChannel[]>("/youtube/channels");
}

export async function fetchYoutubeStreams(): Promise<YoutubeStreamWithEvent[]> {
  return api.get<YoutubeStreamWithEvent[]>("/youtube/streams");
}
