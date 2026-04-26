import { BaseAPI } from './BaseAPI.js';
import type { RequestParams } from '../types/index.js';
import { normalizeList } from '../utils/normalize.js';

/**
 * @deprecated Use `client.users.search()` for user search.
 * This class is kept for backward compatibility.
 */
export class SearchAPI extends BaseAPI {
  async searchUsers(params: RequestParams = {}): Promise<unknown[]> {
    const data = await this.http.get<unknown>('/v1/search/user', params);
    return normalizeList(data, 'results');
  }

  async searchByLocation(params: RequestParams = {}): Promise<unknown> {
    return this.http.get('/v1/search/location', params);
  }

  async getFeed(feedType: 'global' | 'following' = 'global', limit = 20, offset = 0, extra = 'photos.user'): Promise<unknown[]> {
    const data = await this.http.get<unknown>('/v1/feed', {
      type: feedType,
      limit,
      offset,
      extra,
    });
    return normalizeList(data, 'feed');
  }

  async getNearbyUsers(limit = 50): Promise<unknown> {
    return this.http.get('/v1/search/nearby', { limit });
  }

  async getSuggestions(limit = 20): Promise<unknown[]> {
    const data = await this.http.get<unknown>('/v1/search/suggestions', { limit });
    return normalizeList(data, 'results');
  }
}

