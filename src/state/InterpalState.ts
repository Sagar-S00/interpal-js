import { LRUCache } from 'lru-cache';
import type { HttpClient } from '../http/HttpClient.js';
import type { InterpalClient } from '../client/InterpalClient.js';
import { User, type UserData } from '../models/User.js';
import { Thread, type ThreadData } from '../models/Thread.js';
import { Message, type MessageData } from '../models/Message.js';

export interface StateOptions {
  http?: HttpClient | null;
  maxMessages?: number;
  cacheUsers?: boolean;
  cacheThreads?: boolean;
}

export class InterpalState {
  private httpClient: HttpClient | null;
  private client: InterpalClient | null = null;
  private readonly cacheUsers: boolean;
  private readonly cacheThreads: boolean;

  private readonly userCache: Map<string, User>;
  private readonly threadCache: Map<string, Thread>;
  private readonly messageCache: LRUCache<string, Message>;

  private readonly stats: Record<string, number>;

  constructor(options: StateOptions = {}) {
    this.httpClient = options.http ?? null;
    this.cacheUsers = options.cacheUsers ?? true;
    this.cacheThreads = options.cacheThreads ?? true;

    this.userCache = new Map();
    this.threadCache = new Map();
    this.messageCache = new LRUCache<string, Message>({ max: options.maxMessages ?? 1_000 });

    this.stats = {
      cache_hits: 0,
      cache_misses: 0,
      objects_created: 0,
      objects_updated: 0,
    };
  }

  setHttpClient(http: HttpClient): void {
    this.httpClient = http;
  }

  getHttpClient(): HttpClient | null {
    return this.httpClient;
  }

  setClient(client: InterpalClient): void {
    this.client = client;
  }

  clearCaches(): void {
    this.messageCache.clear();
    this.userCache.clear();
    this.threadCache.clear();
  }

  getStats(): Record<string, number> {
    return { ...this.stats };
  }

  createUser(data: UserData): User {
    if (!this.client) {
      throw new Error('InterpalState requires a client instance. Call setClient() first.');
    }

    if (!this.cacheUsers || !data?.id) {
      return new User(this.client, data);
    }

    const key = data.id.toString();
    if (this.userCache.has(key)) {
      const user = this.userCache.get(key)!;
      user._patch(data);
      this.stats.cache_hits += 1;
      this.stats.objects_updated += 1;
      return user;
    }

    const user = new User(this.client, data);
    this.userCache.set(key, user);
    this.stats.cache_misses += 1;
    this.stats.objects_created += 1;
    return user;
  }

  createProfile(data: UserData): User {
    return this.createUser(data);
  }

  createThread(data: ThreadData): Thread {
    if (!this.client) {
      throw new Error('InterpalState requires a client instance. Call setClient() first.');
    }

    if (!this.cacheThreads || !data?.id) {
      return new Thread(this.client, data);
    }
    const key = data.id.toString();
    if (this.threadCache.has(key)) {
      const thread = this.threadCache.get(key)!;
      thread._patch(data);
      this.stats.cache_hits += 1;
      this.stats.objects_updated += 1;
      return thread;
    }
    const thread = new Thread(this.client, data);
    this.threadCache.set(key, thread);
    this.stats.cache_misses += 1;
    this.stats.objects_created += 1;
    return thread;
  }

  createMessage(data: MessageData): Message {
    if (!this.client) {
      throw new Error('InterpalState requires a client instance. Call setClient() first.');
    }

    if (!data?.id) {
      return new Message(this.client, data);
    }
    const key = data.id.toString();
    if (this.messageCache.has(key)) {
      const message = this.messageCache.get(key) as Message;
      message._patch(data);
      this.messageCache.set(key, message);
      this.stats.cache_hits += 1;
      this.stats.objects_updated += 1;
      return message;
    }
    const message = new Message(this.client, data);
    this.messageCache.set(key, message);
    this.stats.cache_misses += 1;
    this.stats.objects_created += 1;
    return message;
  }

  getCachedUser(userId: string): User | undefined {
    const user = this.userCache.get(userId);
    if (user) {
      this.stats.cache_hits += 1;
      return user;
    }
    this.stats.cache_misses += 1;
    return undefined;
  }

  getCachedMessage(messageId: string): Message | undefined {
    const message = this.messageCache.get(messageId) as Message | undefined;
    if (message) {
      this.messageCache.set(messageId, message);
      this.stats.cache_hits += 1;
      return message;
    }
    this.stats.cache_misses += 1;
    return undefined;
  }
}


