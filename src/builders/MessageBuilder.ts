/**
 * A builder for constructing message payloads with a fluent API.
 */
export class MessageBuilder {
  private _content: string;
  private _threadId?: string;
  private _attachmentType?: string;
  private _attachmentId?: string;
  private _gifUrl?: string;
  private _tmpId?: string;
  private _replyTo?: string;
  private _extra: Record<string, unknown> = {};

  /**
   * Creates a new MessageBuilder.
   * @param content The initial message content
   */
  constructor(content = '') {
    this._content = content;
  }

  /**
   * Sets the message content.
   * @param content The message content
   * @returns This builder for chaining
   */
  setContent(content: string): this {
    this._content = content;
    return this;
  }

  /**
   * Sets the thread ID for this message.
   * @param threadId The thread ID
   * @returns This builder for chaining
   */
  setThreadId(threadId: string): this {
    this._threadId = threadId;
    return this;
  }

  /**
   * Sets the message as a reply to another message.
   * @param messageId The ID of the message to reply to
   * @returns This builder for chaining
   */
  setReplyTo(messageId: string): this {
    this._replyTo = messageId;
    return this;
  }

  /**
   * Sets a GIF attachment for this message.
   * @param gifUrl The URL of the GIF
   * @returns This builder for chaining
   */
  setGif(gifUrl: string): this {
    this._gifUrl = gifUrl;
    this._attachmentType = 'gif';
    return this;
  }

  /**
   * Sets a correction attachment for this message.
   * @param attachmentId The ID of the attachment to correct
   * @returns This builder for chaining
   */
  setCorrection(attachmentId: string): this {
    this._attachmentId = attachmentId;
    this._attachmentType = 'correction';
    return this;
  }

  /**
   * Sets the attachment type.
   * @param type The attachment type
   * @returns This builder for chaining
   */
  setAttachmentType(type: string): this {
    this._attachmentType = type;
    return this;
  }

  /**
   * Sets the temporary ID for this message.
   * @param tmpId The temporary ID
   * @returns This builder for chaining
   */
  setTmpId(tmpId: string): this {
    this._tmpId = tmpId;
    return this;
  }

  /**
   * Adds extra data to the message payload.
   * @param key The key
   * @param value The value
   * @returns This builder for chaining
   */
  addExtra(key: string, value: unknown): this {
    this._extra[key] = value;
    return this;
  }

  /**
   * Sets multiple extra data fields at once.
   * @param extra The extra data object
   * @returns This builder for chaining
   */
  setExtra(extra: Record<string, unknown>): this {
    this._extra = { ...this._extra, ...extra };
    return this;
  }

  /**
   * Builds and returns the final message payload.
   * @returns The message payload ready for the API
   */
  build(): MessagePayload {
    const payload: MessagePayload = {
      message: this._content,
      ...this._extra,
    };

    if (this._threadId) {
      payload.thread_id = this._threadId;
    }

    if (this._attachmentType) {
      payload.attachment_type = this._attachmentType;
    }

    if (this._attachmentId) {
      payload.attachment_id = this._attachmentId;
    }

    if (this._gifUrl) {
      payload.gif_attachment_url = this._gifUrl;
    }

    if (this._tmpId) {
      payload.tmp_id = this._tmpId;
    }

    if (this._replyTo) {
      payload.reply_to = this._replyTo;
    }

    return payload;
  }

  /**
   * Returns the thread ID if set.
   * @returns The thread ID
   */
  get threadId(): string | undefined {
    return this._threadId;
  }

  /**
   * Returns the content.
   * @returns The message content
   */
  get content(): string {
    return this._content;
  }
}

/**
 * The message payload interface.
 */
export interface MessagePayload {
  message: string;
  thread_id?: string;
  attachment_type?: string;
  attachment_id?: string;
  gif_attachment_url?: string;
  tmp_id?: string;
  reply_to?: string;
  [key: string]: unknown;
}

