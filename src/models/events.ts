import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { parseTimestamp } from '../utils/time.js';
import type { InterpalState } from '../state/InterpalState.js';
import type { UserData } from './User.js';

type MaybeState = { state?: InterpalState | null };

export interface EventCountersData {
  new_friend_requests?: number;
  new_messages?: number;
  new_notifications?: number;
  new_views?: number;
  total_threads?: number;
  unread_threads?: number;
  [key: string]: unknown;
}

export class EventCounters extends BaseModel<EventCountersData> {
  new_friend_requests = 0;
  new_messages = 0;
  new_notifications = 0;
  new_views = 0;
  total_threads = 0;
  unread_threads = 0;

  constructor(data: EventCountersData = {}) {
    super(data);
    this.new_friend_requests = Number(data.new_friend_requests ?? 0);
    this.new_messages = Number(data.new_messages ?? 0);
    this.new_notifications = Number(data.new_notifications ?? 0);
    this.new_views = Number(data.new_views ?? 0);
    this.total_threads = Number(data.total_threads ?? 0);
    this.unread_threads = Number(data.unread_threads ?? 0);
  }
}

export interface MessageEventDataPayload {
  id?: string | number;
  created?: string | number | Date;
  thread_id?: string | number;
  sender_id?: string | number;
  message?: string;
  fake_id?: string;
  tmp_id?: string;
  [key: string]: unknown;
}

export class MessageEventData extends BaseModel<MessageEventDataPayload> {
  id?: string;
  created?: Date;
  thread_id?: string;
  sender_id?: string;
  message?: string;
  fake_id?: string;
  tmp_id?: string;

  constructor(data: MessageEventDataPayload = {}) {
    super(data);
    this.id = data.id?.toString();
    this.created = parseTimestamp(data.created);
    this.thread_id = data.thread_id?.toString();
    this.sender_id = data.sender_id?.toString();
    this.message = typeof data.message === 'string' ? data.message : '';
    this.fake_id = data.fake_id;
    this.tmp_id = data.tmp_id;
  }
}

export interface ThreadNewMessageEventPayload {
  type?: string;
  counters?: EventCountersData;
  click_url?: string;
  sender?: UserData;
  data?: MessageEventDataPayload;
  [key: string]: unknown;
}

const createUser = (payload: UserData, state?: InterpalState | null): User => {
  if (state) {
    return state.createUser(payload);
  }
  throw new Error('Cannot create User in event without InterpalState. This is a legacy API limitation.');
};

export class ThreadNewMessageEvent extends BaseModel<ThreadNewMessageEventPayload> {
  type: string;
  counters: EventCounters;
  click_url?: string;
  sender?: User;
  data: MessageEventData;

  constructor(data: ThreadNewMessageEventPayload = {}, options: MaybeState = {}) {
    super(data);
    this.type = data.type ?? 'THREAD_NEW_MESSAGE';
    this.counters = new EventCounters(data.counters ?? {});
    this.click_url = data.click_url;
    this.sender = data.sender ? createUser(data.sender, options.state) : undefined;
    this.data = new MessageEventData(data.data ?? {});
  }

  get message(): string | undefined {
    return this.data.message;
  }

  get message_id(): string | undefined {
    return this.data.id;
  }

  get thread_id(): string | undefined {
    return this.data.thread_id;
  }
}

export interface ThreadTypingEventPayload {
  type?: string;
  thread_id?: string | number;
  is_typing?: boolean;
  typing?: boolean;
  user?: UserData;
  user_id?: string | number;
  [key: string]: unknown;
}

export class ThreadTypingEvent extends BaseModel<ThreadTypingEventPayload> {
  type: string;
  thread_id?: string;
  is_typing: boolean;
  user?: User;
  user_id?: string;

  constructor(data: ThreadTypingEventPayload = {}, options: MaybeState = {}) {
    super(data);
    this.type = data.type ?? 'THREAD_TYPING';
    this.thread_id = data.thread_id?.toString();
    this.is_typing = Boolean(data.is_typing ?? data.typing ?? false);
    this.user = data.user ? createUser(data.user, options.state) : undefined;
    this.user_id = data.user_id?.toString();
  }
}

export interface ProfileViewEventPayload {
  type?: string;
  counters?: EventCountersData;
  click_url?: string;
  viewer?: UserData;
  sender?: UserData;
  [key: string]: unknown;
}

export class ProfileViewEvent extends BaseModel<ProfileViewEventPayload> {
  type: string;
  counters: EventCounters;
  click_url?: string;
  viewer?: User;
  sender?: User;

  constructor(data: ProfileViewEventPayload = {}, options: MaybeState = {}) {
    super(data);
    this.type = data.type ?? 'PROFILE_VIEW';
    this.counters = new EventCounters(data.counters ?? {});
    this.click_url = data.click_url;
    const userData = data.sender ?? data.viewer;
    this.viewer = userData ? createUser(userData, options.state) : undefined;
    this.sender = this.viewer;
  }

  get viewer_id(): string | undefined {
    return this.viewer?.id?.toString();
  }
}

export interface CounterUpdateEventPayload {
  type?: string;
  counters?: EventCountersData;
  data?: EventCountersData;
  [key: string]: unknown;
}

export class CounterUpdateEvent extends BaseModel<CounterUpdateEventPayload> {
  type: string;
  counters: EventCounters;

  constructor(data: CounterUpdateEventPayload = {}) {
    super(data);
    this.type = data.type ?? 'COUNTER_UPDATE';
    this.counters = new EventCounters(data.counters ?? data.data ?? {});
  }
}

