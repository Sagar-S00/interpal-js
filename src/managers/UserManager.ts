import { BaseManager } from './BaseManager.js';
import { User, type UserData } from '../models/User.js';
import type { InterpalClient } from '../client/InterpalClient.js';
import type { RequestParams } from '../types/index.js';

/**
 * Manages user-related data and operations.
 */
export class UserManager extends BaseManager<string, User> {
  constructor(client: InterpalClient) {
    super(client);
  }

  /**
   * Fetches a user from the API.
   * @param id The ID of the user to fetch
   * @param options Fetch options
   * @returns The fetched user
   */
  async fetch(id: string, options: { force?: boolean; cache?: boolean } = {}): Promise<User> {
    const { force = false, cache = true } = options;

    // Return from cache if available and not forcing
    if (!force && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Fetch from API
    const data = await this.http.get<UserData>(`/v1/profile/${id}`);
    const user = new User(this.client, data);

    // Add to cache
    if (cache) {
      this._add(id, user);
    }

    return user;
  }

  /**
   * Fetches the current authenticated user.
   * @param options Fetch options
   * @returns The current user
   */
  async fetchSelf(options: { force?: boolean; cache?: boolean } = {}): Promise<User> {
    const { force = false, cache = true } = options;

    // Check if we have a cached self user
    const cachedSelf = this.cache.find((user) => user.isSelf);
    if (!force && cachedSelf) {
      return cachedSelf;
    }

    // Fetch from API
    const data = await this.http.get<UserData>('/v1/account/self');
    const user = new User(this.client, data);
    user.isSelf = true;

    if (user.id && cache) {
      this._add(user.id, user);
    }

    return user;
  }

  /**
   * Updates the current authenticated user's profile.
   * @param payload The data to update
   * @returns The updated user
   */
  async updateSelf(payload: Record<string, unknown>): Promise<User> {
    const data = await this.http.put<UserData>('/v1/account/self', payload);
    const user = new User(this.client, data);
    user.isSelf = true;

    if (user.id) {
      this._add(user.id, user);
    }

    return user;
  }

  /**
   * Searches for users based on criteria.
   * @param params Search parameters
   * @returns Array of matching users
   */
  async search(params: RequestParams = {}): Promise<User[]> {
    const data = await this.http.get<UserData[] | { results?: UserData[] }>('/v1/search/user', params);
    
    let results: UserData[];
    if (Array.isArray(data)) {
      results = data;
    } else if (data && 'results' in data && Array.isArray(data.results)) {
      results = data.results;
    } else {
      results = [];
    }

    return results.map((userData) => {
      const user = new User(this.client, userData);
      if (user.id) {
        this._add(user.id, user, true);
      }
      return user;
    });
  }

  /**
   * Creates or updates a user in the cache.
   * @param data The raw user data
   * @param cache Whether to cache the user
   * @returns The created or updated user
   */
  _createOrUpdate(data: UserData, cache = true): User {
    const id = data.id?.toString();
    
    if (id && this.cache.has(id)) {
      const existing = this.cache.get(id)!;
      existing._patch(data);
      return existing;
    }

    const user = new User(this.client, data);
    if (id && cache) {
      this._add(id, user);
    }

    return user;
  }
}

