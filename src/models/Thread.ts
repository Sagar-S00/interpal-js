import { Base } from './Base.js';
import { parseTimestamp } from '../utils/time.js';
import type { InterpalClient } from '../client/InterpalClient.js';
import type { Message } from './Message.js';
import type { User } from './User.js';
import { Collection } from '../util/Collection.js';

export interface ThreadData {
  id?: string | number;
  subject?: string;
  last_message?: string;
  last_message_id?: string | number;
  participant_ids?: Array<string | number>;
  updated?: string | number | Date;
  unread?: boolean;
  [key: string]: unknown;
}

export class Thread extends Base {
  id?: string;
  subject?: string;
  lastMessage?: string;
  lastMessageId?: string;
  participantIds?: string[];
  updatedAt?: Date;
  unread?: boolean;

  private _rawData: ThreadData;

  constructor(client: InterpalClient, data: ThreadData) {
    super(client);
    this._rawData = data;
    this._patch(data);
  }

  _patch(data: ThreadData): this {
    this._rawData = { ...this._rawData, ...data };
    
    if (data.id !== undefined) this.id = data.id?.toString();
    if (data.subject !== undefined) this.subject = data.subject as string | undefined;
    if (data.last_message !== undefined) this.lastMessage = data.last_message as string | undefined;
    if (data.last_message_id !== undefined) this.lastMessageId = data.last_message_id?.toString();
    if (data.participant_ids !== undefined) this.participantIds = data.participant_ids?.map((v) => v.toString());
    if (data.updated !== undefined) this.updatedAt = parseTimestamp(data.updated);
    if (data.unread !== undefined) this.unread = Boolean(data.unread);

    return this;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      subject: this.subject,
      lastMessage: this.lastMessage,
      lastMessageId: this.lastMessageId,
      participantIds: this.participantIds,
      updatedAt: this.updatedAt?.toISOString(),
      unread: this.unread,
    };
  }

  toString(): string {
    return this.subject ?? `Thread${this.id ? `[${this.id}]` : ''}`;
  }

  /**
   * Gets the participants of this thread from the cache.
   * @returns Collection of cached participants
   */
  get participants(): Collection<string, User> {
    const participants = new Collection<string, User>();
    if (!this.participantIds) return participants;

    for (const id of this.participantIds) {
      const user = this.client.users.resolve(id);
      if (user) {
        participants.set(id, user);
      }
    }

    return participants;
  }

  /**
   * Fetches messages from this thread.
   * @param options Fetch options
   * @returns Array of messages
   */
  async fetchMessages(options: Record<string, any> = {}): Promise<Message[]> {
    if (!this.id) {
      throw new Error('Cannot fetch messages for a thread without an ID');
    }
    return await this.client.messages.fetchThreadMessages(this.id, options);
  }

  /**
   * Sends a message to this thread.
   * @param content The message content
   * @returns The sent message
   */
  async send(content: string): Promise<Message> {
    if (!this.id) {
      throw new Error('Cannot send a message to a thread without an ID');
    }
    return await this.client.messages.send(this.id, content);
  }

  /**
   * Sets the typing indicator for this thread.
   * @param typing Whether to show typing indicator
   */
  async setTyping(typing = true): Promise<void> {
    if (!this.id) {
      throw new Error('Cannot set typing for a thread without an ID');
    }
    await this.client.messages.setTyping(this.id, typing);
  }
}

