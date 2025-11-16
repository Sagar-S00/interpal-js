import { BaseManager } from './BaseManager.js';
import { Thread, type ThreadData } from '../models/Thread.js';
import type { InterpalClient } from '../client/InterpalClient.js';

/**
 * Manages thread (conversation) data and operations.
 */
export class ThreadManager extends BaseManager<string, Thread> {
  constructor(client: InterpalClient) {
    super(client);
  }

  /**
   * Fetches a thread by ID from the API.
   * @param id The ID of the thread
   * @param options Fetch options
   * @returns The fetched thread
   */
  async fetch(id: string, options: { force?: boolean; cache?: boolean } = {}): Promise<Thread> {
    const { force = false, cache = true } = options;

    if (!force && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Note: The API might not have a direct endpoint for fetching a single thread by ID
    // You may need to adjust this based on the actual API
    const data = await this.http.get<ThreadData>(`/v1/thread/${id}`);
    const thread = new Thread(this.client, data);

    if (cache && thread.id) {
      this._add(thread.id, thread);
    }

    return thread;
  }

  /**
   * Fetches all threads for the current user.
   * @param options Fetch options
   * @returns Array of threads
   */
  async fetchAll(options: { limit?: number; offset?: number; force?: boolean; cache?: boolean } = {}): Promise<Thread[]> {
    const { limit = 50, offset = 0, cache = true } = options;

    const data = await this.http.get<ThreadData[] | { threads?: ThreadData[] }>('/v1/thread', { limit, offset });
    
    let threadDataArray: ThreadData[];
    if (Array.isArray(data)) {
      threadDataArray = data;
    } else if (data && 'threads' in data && Array.isArray(data.threads)) {
      threadDataArray = data.threads;
    } else {
      threadDataArray = [];
    }

    return threadDataArray.map((threadData) => this._createOrUpdate(threadData, cache));
  }

  /**
   * Fetches or creates a thread with a specific user.
   * @param userId The ID of the user
   * @param options Fetch options
   * @returns The thread with the user
   */
  async fetchUserThread(userId: string, options: { includeRelation?: boolean; force?: boolean; cache?: boolean } = {}): Promise<Thread> {
    const { includeRelation = false, force = false, cache = true } = options;

    // Check cache first if not forcing
    if (!force) {
      const cached = this.cache.find((thread) => 
        !!thread.participantIds && 
        thread.participantIds.includes(userId) && 
        thread.participantIds.length === 2
      );
      if (cached) return cached;
    }

    const data = await this.http.get<ThreadData>(`/v1/thread/user/${userId}`, { include_relation: includeRelation });
    const thread = new Thread(this.client, data);

    if (cache && thread.id) {
      this._add(thread.id, thread);
    }

    return thread;
  }

  /**
   * Creates or updates a thread in the cache.
   * @param data The raw thread data
   * @param cache Whether to cache the thread
   * @returns The created or updated thread
   */
  _createOrUpdate(data: ThreadData, cache = true): Thread {
    const id = data.id?.toString();
    
    if (id && this.cache.has(id)) {
      const existing = this.cache.get(id)!;
      existing._patch(data);
      return existing;
    }

    const thread = new Thread(this.client, data);
    if (id && cache) {
      this._add(id, thread);
    }

    return thread;
  }
}

