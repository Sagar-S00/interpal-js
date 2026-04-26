import { BaseAPI } from './BaseAPI.js';
import type { RequestParams } from '../types/index.js';
import type { Post, Comment } from '../types/index.js';

/**
 * @deprecated Access posts through the feed APIs directly.
 * This class is kept for backward compatibility.
 */
export class PostsAPI extends BaseAPI {
  async createPost(payload: Record<string, unknown>): Promise<Post> {
    return this.http.post<Post>('/v1/post', payload);
  }

  async getPost(postId: string, params: RequestParams = {}): Promise<Post> {
    return this.http.get<Post>(`/v1/post/${postId}`, params);
  }

  async getFeed(feedType: 'global' | 'following' = 'global', limit = 20, offset = 0): Promise<Post[]> {
    return this.http.get<Post[]>('/v1/post/feed', { type: feedType, limit, offset });
  }

  async updatePost(postId: string, payload: Record<string, unknown>): Promise<Post> {
    return this.http.put<Post>(`/v1/post/${postId}`, payload);
  }

  async deletePost(postId: string): Promise<void> {
    await this.http.delete(`/v1/post/${postId}`);
  }

  async getComments(postId: string, limit = 20, offset = 0): Promise<Comment[]> {
    return this.http.get<Comment[]>(`/v1/post/${postId}/comment`, { limit, offset });
  }

  async createComment(postId: string, payload: Record<string, unknown>): Promise<Comment> {
    return this.http.post<Comment>(`/v1/post/${postId}/comment`, payload);
  }

  async updateComment(postId: string, commentId: string, payload: Record<string, unknown>): Promise<Comment> {
    return this.http.put<Comment>(`/v1/post/${postId}/comment/${commentId}`, payload);
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    await this.http.delete(`/v1/post/${postId}/comment/${commentId}`);
  }
}

