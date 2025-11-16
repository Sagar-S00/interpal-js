import { BaseAPI } from './BaseAPI.js';
import { User, type UserData } from '../models/User.js';
import { Message, type MessageData } from '../models/Message.js';
import { Thread, type ThreadData } from '../models/Thread.js';
import type { RequestParams } from '../types/index.js';

export class UserAPI extends BaseAPI {
  async getSelf(): Promise<User> {
    const data = await this.http.get<UserData>('/v1/account/self');
    return this.state?.createProfile?.(data) ?? new User(data);
  }

  async updateSelf(payload: Record<string, unknown>): Promise<User> {
    const data = await this.http.put<UserData>('/v1/account/self', payload);
    return this.state?.createProfile?.(data) ?? new User(data);
  }

  async getUser(userId: string): Promise<User> {
    const data = await this.http.get<UserData>(`/v1/profile/${userId}`);
    return this.state?.createProfile?.(data) ?? new User(data);
  }

  async getThreads(): Promise<Thread[]> {
    const data = await this.http.get<ThreadData[] | { threads?: ThreadData[] }>('/v1/thread');
    if (Array.isArray(data)) {
      return data.map((entry) => new Thread(entry));
    }
    if (data && 'threads' in data && Array.isArray(data.threads)) {
      return data.threads.map((entry: ThreadData) => new Thread(entry));
    }
    return [];
  }

  async sendMessage(threadId: string, content: string): Promise<Message> {
    const data = await this.http.post<MessageData>('/v1/message', { thread_id: threadId, message: content });
    return new Message(data);
  }

  async searchUsers(params: RequestParams = {}) {
    const data = await this.http.get<UserData[] | { results?: UserData[] }>('/v1/search/user', params);
    if (Array.isArray(data)) {
      return data.map((entry) => new User(entry));
    }
    if (data && 'results' in data && Array.isArray(data.results)) {
      return data.results.map((entry: UserData) => new User(entry));
    }
    return [];
  }
}

