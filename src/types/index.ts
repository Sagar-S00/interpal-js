// ─── Session & Auth ────────────────────────────────────────────────────────

export interface SessionPayload {
  sessionCookie: string;
  authToken?: string | null;
  botId?: string | null;
}

export interface LoginResult extends SessionPayload {
  username?: string;
}

export interface SessionPersistencePayload extends SessionPayload {
  username?: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionInfo {
  username?: string;
  botId?: string;
  createdAt: Date;
  expiresAt: Date;
  timeRemainingMs: number;
  isExpired: boolean;
}

// ─── HTTP / Request ─────────────────────────────────────────────────────────

export type RequestParams = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: unknown;
  params?: RequestParams;
  headers?: Record<string, string>;
}

// ─── Client Options ─────────────────────────────────────────────────────────

export interface InterpalClientOptions {
  username?: string;
  password?: string;
  sessionCookie?: string;
  authToken?: string;
  autoLogin?: boolean;
  userAgent?: string;
  persistSession?: boolean;
  sessionFile?: string;
  sessionExpirationHours?: number;
  maxMessages?: number;
  cacheUsers?: boolean;
  cacheThreads?: boolean;
  weakReferences?: boolean;
  /** Gateway intents to subscribe to. Can be a number, array of numbers/strings, or intent names */
  intents?: import('../util/Intents.js').IntentResolvable;
  /**
   * When set, every raw WebSocket gateway frame is appended to a JSONL file so
   * you can learn the exact field names the server sends.
   * Pass `true` to use the default path (`interpal-payloads.jsonl`), or a
   * custom path string.  Inspect the file, update `WebSocketClient` with the
   * real field names, then remove this option.
   */
  discoverPayloads?: boolean | string;
}

// ─── Domain Interfaces ───────────────────────────────────────────────────────

/** A minimal user summary as returned by search and social endpoints. */
export interface UserSummary {
  id?: string;
  name?: string;
  username?: string;
  country?: string;
  country_code?: string;
  is_online?: boolean;
  [key: string]: unknown;
}

/** A notification item returned by notification endpoints. */
export interface Notification {
  id?: string;
  type?: string;
  message?: string;
  read?: boolean;
  created?: string;
  [key: string]: unknown;
}

/** A post item returned by the posts feed. */
export interface Post {
  id?: string;
  user_id?: string;
  content?: string;
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

/** A comment on a post. */
export interface Comment {
  id?: string;
  post_id?: string;
  user_id?: string;
  content?: string;
  created?: string;
  [key: string]: unknown;
}

/** A social relation between two users. */
export interface Relation {
  user_id?: string;
  type?: string;
  [key: string]: unknown;
}

/** A like on a piece of content. */
export interface Like {
  user_id?: string;
  content_id?: string;
  content_type?: string;
  [key: string]: unknown;
}

/** A bookmarked user entry. */
export interface Bookmark {
  user_id?: string;
  note?: string;
  created?: string;
  [key: string]: unknown;
}

/** A photo resource. */
export interface Photo {
  id?: string;
  user_id?: string;
  url?: string;
  caption?: string;
  created?: string;
  [key: string]: unknown;
}

/** A photo album. */
export interface Album {
  id?: string;
  user_id?: string;
  name?: string;
  description?: string;
  created?: string;
  [key: string]: unknown;
}

/** An online user entry from the realtime online endpoint. */
export interface OnlineUser {
  id?: string;
  username?: string;
  [key: string]: unknown;
}

/** A search result item (user or location). */
export interface SearchResult {
  id?: string;
  [key: string]: unknown;
}

/** A push-token registration payload. */
export interface PushTokenPayload {
  token: string;
  device: string;
  platform: string;
}

/** The raw shape of messages received over the WebSocket gateway. */
export interface WebSocketRawPayload {
  op?: string | number;
  t?: string;
  type?: string;
  event?: string;
  s?: number;
  seq?: number;
  offset?: number;
  d?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Typed Event Map ─────────────────────────────────────────────────────────
// Import lazily to avoid circular dependency issues.
export type { ThreadNewMessageEvent, ThreadTypingEvent, CounterUpdateEvent, ProfileViewEvent } from '../models/events.js';
export type { IntentResolvable } from '../util/Intents.js';

