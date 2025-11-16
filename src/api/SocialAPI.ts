import { BaseAPI } from './BaseAPI.js';

export class SocialAPI extends BaseAPI {
  async getRelations(userId: string) {
    return this.http.get(`/v1/social/relations/${userId}`);
  }

  async getFriends(userId?: string) {
    if (userId) {
      return this.http.get(`/v1/social/friends/${userId}`);
    }
    return this.http.get('/v1/social/friends');
  }

  async blockUser(userId: string) {
    return this.http.post('/v1/social/block', { user_id: userId });
  }

  async unblockUser(userId: string) {
    return this.http.post('/v1/social/unblock', { user_id: userId });
  }

  async bookmarkUser(userId: string, note?: string) {
    return this.http.post('/v1/social/bookmark', { user_id: userId, note });
  }

  async removeBookmark(userId: string) {
    return this.http.delete(`/v1/social/bookmark/${userId}`);
  }

  async getBookmarks() {
    return this.http.get('/v1/social/bookmark');
  }

  async likeContent(contentId: string, contentType: string) {
    return this.http.post('/v1/social/like', { content_id: contentId, content_type: contentType });
  }

  async unlikeContent(contentId: string) {
    return this.http.post('/v1/social/unlike', { content_id: contentId });
  }

  async getLikes(contentId: string) {
    return this.http.get(`/v1/social/like/${contentId}`);
  }
}

