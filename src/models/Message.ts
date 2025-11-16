import { BaseModel } from './BaseModel.js';
import { parseTimestamp } from '../utils/time.js';

export interface MessageData {
  id?: string | number;
  thread_id?: string | number;
  sender_id?: string | number;
  message?: string;
  created?: string | number | Date;
  attachment_type?: string;
  [key: string]: unknown;
}

export class Message extends BaseModel<MessageData> {
  id?: string;
  threadId?: string;
  senderId?: string;
  content?: string;
  createdAt?: Date;
  attachmentType?: string;

  constructor(data: MessageData) {
    super(data);
    this.id = data.id?.toString();
    this.threadId = data.thread_id?.toString();
    this.senderId = data.sender_id?.toString();
    this.content = data.message as string | undefined;
    this.createdAt = parseTimestamp(data.created);
    this.attachmentType = data.attachment_type as string | undefined;
  }
}

