import { BaseAPI } from './BaseAPI.js';
import type { RequestParams } from '../types/index.js';

export class SearchAPI extends BaseAPI {
  async searchUsers(params: RequestParams = {}) {
    const data = await this.http.get<unknown[] | { results?: unknown[] }>('/v1/search/user', params);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results?: unknown[] }).results)) {
      return (data as { results?: unknown[] }).results ?? [];
    }
    return [];
  }

  async searchByLocation(params: RequestParams = {}) {
    return this.http.get('/v1/search/location', params);
  }

  async getFeed(feedType: 'global' | 'following' = 'global', limit = 20, offset = 0, extra = 'photos.user') {
    const data = await this.http.get<unknown[] | { feed?: unknown[] }>('/v1/feed', {
      type: feedType,
      limit,
      offset,
      extra,
    });
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'feed' in data && Array.isArray((data as { feed?: unknown[] }).feed)) {
      return (data as { feed?: unknown[] }).feed ?? [];
    }
    return [];
  }

  async getNearbyUsers(limit = 50) {
    return this.http.get('/v1/search/nearby', { limit });
  }

  async getSuggestions(limit = 20) {
    const data = await this.http.get<{ results?: unknown[] }>('/v1/search/suggestions', { limit });
    return data?.results ?? [];
  }
}

