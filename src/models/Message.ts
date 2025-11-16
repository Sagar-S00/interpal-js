import { Base } from './Base.js';
import { parseTimestamp } from '../utils/time.js';
import type { InterpalClient } from '../client/InterpalClient.js';
import type { User } from './User.js';

export interface MessageData {
  id?: string | number;
  thread_id?: string | number;
  sender_id?: string | number;
  message?: string;
  created?: string | number | Date;
  attachment_type?: string;
  [key: string]: unknown;
}

export class Message extends Base {
  id?: string;
  threadId?: string;
  senderId?: string;
  content?: string;
  createdAt?: Date;
  attachmentType?: string;

  private _rawData: MessageData;

  constructor(client: InterpalClient, data: MessageData) {
    super(client);
    this._rawData = data;
    this._patch(data);
  }

  _patch(data: MessageData): this {
    this._rawData = { ...this._rawData, ...data };
    
    if (data.id !== undefined) this.id = data.id?.toString();
    if (data.thread_id !== undefined) this.threadId = data.thread_id?.toString();
    if (data.sender_id !== undefined) this.senderId = data.sender_id?.toString();
    if (data.message !== undefined) this.content = data.message as string | undefined;
    if (data.created !== undefined) this.createdAt = parseTimestamp(data.created);
    if (data.attachment_type !== undefined) this.attachmentType = data.attachment_type as string | undefined;

    return this;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      threadId: this.threadId,
      senderId: this.senderId,
      content: this.content,
      createdAt: this.createdAt?.toISOString(),
      attachmentType: this.attachmentType,
    };
  }

  toString(): string {
    return this.content ?? `Message${this.id ? `[${this.id}]` : ''}`;
  }

  /**
   * Gets the author of this message.
   * @returns The user who sent this message, or null if not found in cache
   */
  get author(): User | null {
    if (!this.senderId) return null;
    return this.client.users.resolve(this.senderId);
  }

  /**
   * Fetches the author of this message.
   * @returns The user who sent this message
   */
  async fetchAuthor(): Promise<User | null> {
    if (!this.senderId) return null;
    return await this.client.users.fetch(this.senderId);
  }

  /**
   * Deletes this message.
   */
  async delete(): Promise<void> {
    if (!this.id) {
      throw new Error('Cannot delete a message without an ID');
    }
    await this.client.messages.delete(this.id, this.threadId);
  }

  /**
   * Replies to this message.
   * @param content The reply content
   * @returns The sent reply message
   */
  async reply(content: string): Promise<Message> {
    if (!this.threadId) {
      throw new Error('Cannot reply to a message without a thread ID');
    }
    return await this.client.messages.send(this.threadId, content, {
      reply_to: this.id,
    });
  }
}

