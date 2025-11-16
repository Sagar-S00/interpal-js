import { BaseAPI } from './BaseAPI.js';
import { Thread, type ThreadData } from '../models/Thread.js';
import { Message, type MessageData } from '../models/Message.js';
import type { RequestParams } from '../types/index.js';

export class MessagesAPI extends BaseAPI {
  async getThreads(limit = 50, offset = 0): Promise<Thread[]> {
    const data = await this.http.get<ThreadData[] | { threads?: ThreadData[] }>('/v1/thread', { limit, offset });
    const threads = (Array.isArray(data) ? data : data?.threads ?? []) as ThreadData[];
    return threads.map((entry) => this.state?.createThread(entry) ?? new Thread(entry));
  }

  async getUserThread(userId: string, includeRelation = false): Promise<Thread> {
    const data = await this.http.get<ThreadData>(`/v1/thread/user/${userId}`, { include_relation: includeRelation });
    return this.state?.createThread(data) ?? new Thread(data);
  }

  async getThreadMessages(threadId: string, params: RequestParams = {}): Promise<Message[]> {
    const data = await this.http.get<MessageData[] | { messages?: MessageData[] }>(`/v1/thread/${threadId}`, params);
    const messages = (Array.isArray(data) ? data : data?.messages ?? []) as MessageData[];
    return messages.map((entry) => this.state?.createMessage(entry) ?? new Message(entry));
  }

  async sendMessage(threadId: string, content: string, extra: Record<string, unknown> = {}): Promise<Message> {
    const payload = {
      thread_id: threadId,
      message: content,
      ...extra,
    };
    const data = await this.http.post<MessageData>('/v1/message', payload);
    return this.state?.createMessage(data) ?? new Message(data);
  }

  async sendGif(threadId: string, gifUrl: string, tmpId = 'tmp'): Promise<Message> {
    return this.sendMessage(threadId, '', {
      attachment_type: 'gif',
      gif_attachment_url: gifUrl,
      tmp_id: tmpId,
    });
  }

  async sendMessageCorrection(threadId: string, message: string, attachmentId: string, tmpId?: string): Promise<Message> {
    const payload: Record<string, unknown> = {
      thread_id: threadId,
      message,
      attachment_type: 'correction',
      attachment_id: attachmentId,
    };
    if (tmpId) {
      payload.tmp_id = tmpId;
    }
    const data = await this.http.post<MessageData>('/v1/message', payload);
    return this.state?.createMessage(data) ?? new Message(data);
  }

  async setTyping(threadId: string, typing = true): Promise<void> {
    await this.http.post('/v1/thread/typing', { thread_id: threadId, typing });
  }

  async deleteMessage(messageId: string, threadId?: string): Promise<void> {
    await this.http.delete(`/v1/message/${messageId}${threadId ? `?thread_id=${threadId}` : ''}`);
  }

  async readMessage(threadId: string, messageId: string): Promise<void> {
    await this.http.put(`/v1/thread/${threadId}/viewed`, { message_id: messageId });
  }
}

