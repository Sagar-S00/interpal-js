import { BaseAPI } from './BaseAPI.js';
import type { Relation, Like, Bookmark } from '../types/index.js';

/**
 * @deprecated Use `client.social` equivalent or direct HTTP calls instead.
 * This class is kept for backward compatibility.
 */
export class SocialAPI extends BaseAPI {
  async getRelations(userId: string): Promise<Relation[]> {
    return this.http.get<Relation[]>(`/v1/social/relations/${userId}`);
  }

  async getFriends(userId?: string): Promise<Relation[]> {
    if (userId) {
      return this.http.get<Relation[]>(`/v1/social/friends/${userId}`);
    }
    return this.http.get<Relation[]>('/v1/social/friends');
  }

  async blockUser(userId: string): Promise<void> {
    await this.http.post('/v1/social/block', { user_id: userId });
  }

  async unblockUser(userId: string): Promise<void> {
    await this.http.post('/v1/social/unblock', { user_id: userId });
  }

  async bookmarkUser(userId: string, note?: string): Promise<Bookmark> {
    return this.http.post<Bookmark>('/v1/social/bookmark', { user_id: userId, note });
  }

  async removeBookmark(userId: string): Promise<void> {
    await this.http.delete(`/v1/social/bookmark/${userId}`);
  }

  async getBookmarks(): Promise<Bookmark[]> {
    return this.http.get<Bookmark[]>('/v1/social/bookmark');
  }

  async likeContent(contentId: string, contentType: string): Promise<Like> {
    return this.http.post<Like>('/v1/social/like', { content_id: contentId, content_type: contentType });
  }

  async unlikeContent(contentId: string): Promise<void> {
    await this.http.post('/v1/social/unlike', { content_id: contentId });
  }

  async getLikes(contentId: string): Promise<Like[]> {
    return this.http.get<Like[]>(`/v1/social/like/${contentId}`);
  }
}

