import { BaseAPI } from './BaseAPI.js';
import type { RequestParams } from '../types/index.js';

export class PostsAPI extends BaseAPI {
  async createPost(payload: Record<string, unknown>) {
    return this.http.post('/v1/post', payload);
  }

  async getPost(postId: string, params: RequestParams = {}) {
    return this.http.get(`/v1/post/${postId}`, params);
  }

  async getFeed(feedType: 'global' | 'following' = 'global', limit = 20, offset = 0) {
    return this.http.get('/v1/post/feed', { type: feedType, limit, offset });
  }

  async updatePost(postId: string, payload: Record<string, unknown>) {
    return this.http.put(`/v1/post/${postId}`, payload);
  }

  async deletePost(postId: string) {
    return this.http.delete(`/v1/post/${postId}`);
  }

  async getComments(postId: string, limit = 20, offset = 0) {
    return this.http.get(`/v1/post/${postId}/comment`, { limit, offset });
  }

  async createComment(postId: string, payload: Record<string, unknown>) {
    return this.http.post(`/v1/post/${postId}/comment`, payload);
  }

  async updateComment(postId: string, commentId: string, payload: Record<string, unknown>) {
    return this.http.put(`/v1/post/${postId}/comment/${commentId}`, payload);
  }

  async deleteComment(postId: string, commentId: string) {
    return this.http.delete(`/v1/post/${postId}/comment/${commentId}`);
  }
}

