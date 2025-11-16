import { BaseManager } from './BaseManager.js';
import { Message, type MessageData } from '../models/Message.js';
import type { InterpalClient } from '../client/InterpalClient.js';
import type { RequestParams } from '../types/index.js';
import { MessageBuilder, type MessagePayload } from '../builders/MessageBuilder.js';

/**
 * Manages message data and operations.
 */
export class MessageManager extends BaseManager<string, Message> {
  constructor(client: InterpalClient) {
    super(client);
  }

  /**
   * Fetches messages from a thread.
   * @param threadId The ID of the thread
   * @param options Fetch options
   * @returns Array of messages
   */
  async fetchThreadMessages(threadId: string, options: RequestParams & { cache?: boolean } = {}): Promise<Message[]> {
    const { cache = true, ...params } = options;

    const data = await this.http.get<MessageData[] | { messages?: MessageData[] }>(`/v1/thread/${threadId}`, params);
    
    let messageDataArray: MessageData[];
    if (Array.isArray(data)) {
      messageDataArray = data;
    } else if (data && 'messages' in data && Array.isArray(data.messages)) {
      messageDataArray = data.messages;
    } else {
      messageDataArray = [];
    }

    return messageDataArray.map((messageData) => this._createOrUpdate(messageData, cache));
  }

  /**
   * Sends a message to a thread.
   * @param threadId The ID of the thread
   * @param content The message content, a message builder, or a message payload
   * @param extra Additional payload data (only used if content is a string)
   * @returns The sent message
   */
  async send(threadId: string, content: string | MessageBuilder | MessagePayload, extra: Record<string, unknown> = {}): Promise<Message> {
    let payload: MessagePayload;

    if (typeof content === 'string') {
      payload = {
        thread_id: threadId,
        message: content,
        ...extra,
      };
    } else if (content instanceof MessageBuilder) {
      payload = content.build();
      // Ensure thread_id is set
      if (!payload.thread_id) {
        payload.thread_id = threadId;
      }
    } else {
      payload = content;
      // Ensure thread_id is set
      if (!payload.thread_id) {
        payload.thread_id = threadId;
      }
    }

    const data = await this.http.post<MessageData>('/v1/message', payload);
    const message = this._createOrUpdate(data);

    // Emit messageCreate event
    this.client.emit('messageCreate', message);

    return message;
  }

  /**
   * Sends a GIF message to a thread.
   * @param threadId The ID of the thread
   * @param gifUrl The URL of the GIF
   * @param tmpId Temporary ID for the message
   * @returns The sent message
   */
  async sendGif(threadId: string, gifUrl: string, tmpId = 'tmp'): Promise<Message> {
    return this.send(threadId, '', {
      attachment_type: 'gif',
      gif_attachment_url: gifUrl,
      tmp_id: tmpId,
    });
  }

  /**
   * Sends a message correction.
   * @param threadId The ID of the thread
   * @param content The corrected message content
   * @param attachmentId The ID of the attachment to correct
   * @param tmpId Optional temporary ID
   * @returns The sent correction message
   */
  async sendCorrection(threadId: string, content: string, attachmentId: string, tmpId?: string): Promise<Message> {
    const payload: Record<string, unknown> = {
      thread_id: threadId,
      message: content,
      attachment_type: 'correction',
      attachment_id: attachmentId,
    };

    if (tmpId) {
      payload.tmp_id = tmpId;
    }

    const data = await this.http.post<MessageData>('/v1/message', payload);
    return this._createOrUpdate(data);
  }

  /**
   * Deletes a message.
   * @param messageId The ID of the message to delete
   * @param threadId Optional thread ID
   */
  async delete(messageId: string, threadId?: string): Promise<void> {
    await this.http.delete(`/v1/message/${messageId}${threadId ? `?thread_id=${threadId}` : ''}`);
    
    // Remove from cache
    this._remove(messageId);

    // Emit messageDelete event
    this.client.emit('messageDelete', { id: messageId, threadId });
  }

  /**
   * Marks a message as read.
   * @param threadId The ID of the thread
   * @param messageId The ID of the message
   */
  async markAsRead(threadId: string, messageId: string): Promise<void> {
    await this.http.put(`/v1/thread/${threadId}/viewed`, { message_id: messageId });
  }

  /**
   * Sets typing indicator for a thread.
   * @param threadId The ID of the thread
   * @param typing Whether the user is typing
   */
  async setTyping(threadId: string, typing = true): Promise<void> {
    await this.http.post('/v1/thread/typing', { thread_id: threadId, typing });
  }

  /**
   * Creates or updates a message in the cache.
   * @param data The raw message data
   * @param cache Whether to cache the message
   * @returns The created or updated message
   */
  _createOrUpdate(data: MessageData, cache = true): Message {
    const id = data.id?.toString();
    
    if (id && this.cache.has(id)) {
      const existing = this.cache.get(id)!;
      existing._patch(data);
      return existing;
    }

    const message = new Message(this.client, data);
    if (id && cache) {
      this._add(id, message);
    }

    return message;
  }

  /**
   * Handles incoming message events from the WebSocket.
   * @param data The raw message data from the event
   * @internal
   */
  _handleMessageCreate(data: MessageData): Message {
    return this._createOrUpdate(data);
  }
}

