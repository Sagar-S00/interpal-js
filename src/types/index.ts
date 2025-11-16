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

export type RequestParams = Record<string, string | number | boolean | undefined | null>;

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
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: unknown;
  params?: RequestParams;
  headers?: Record<string, string>;
  files?: unknown;
}

export interface UserSummary {
  id?: string;
  name?: string;
  username?: string;
  country?: string;
  country_code?: string;
  is_online?: boolean;
  [key: string]: unknown;
}

export type { ThreadNewMessageEvent, ThreadTypingEvent, CounterUpdateEvent, ProfileViewEvent } from '../models/events.js';
export type { IntentResolvable } from '../util/Intents.js';

