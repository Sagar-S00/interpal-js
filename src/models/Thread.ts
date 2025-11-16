import { BaseModel } from './BaseModel.js';
import { parseTimestamp } from '../utils/time.js';

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

export class Thread extends BaseModel<ThreadData> {
  id?: string;
  subject?: string;
  lastMessage?: string;
  lastMessageId?: string;
  participantIds?: string[];
  updatedAt?: Date;
  unread?: boolean;

  constructor(data: ThreadData) {
    super(data);
    this.id = data.id?.toString();
    this.subject = data.subject as string | undefined;
    this.lastMessage = data.last_message as string | undefined;
    this.lastMessageId = data.last_message_id?.toString();
    this.participantIds = data.participant_ids?.map((v) => v.toString());
    this.updatedAt = parseTimestamp(data.updated);
    this.unread = Boolean(data.unread);
  }
}

