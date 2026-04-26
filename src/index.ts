// ─── Main Clients ────────────────────────────────────────────────────────────
export { InterpalClient } from './client/InterpalClient.js';
export { AsyncInterpalClient } from './client/AsyncInterpalClient.js';
export { Bot } from './ext/commands/index.js';

// ─── Manager-Based API (recommended) ─────────────────────────────────────────
export { BaseManager } from './managers/BaseManager.js';
export { UserManager } from './managers/UserManager.js';
export { MessageManager } from './managers/MessageManager.js';
export { ThreadManager } from './managers/ThreadManager.js';
export { NotificationManager } from './managers/NotificationManager.js';

// ─── Models ──────────────────────────────────────────────────────────────────
export { Base } from './models/Base.js';
export { User, type UserData } from './models/User.js';
export { Message, type MessageData } from './models/Message.js';
export { Thread, type ThreadData } from './models/Thread.js';

// ─── Gateway Event Models ─────────────────────────────────────────────────────
export {
  EventCounters,
  MessageEventData,
  ThreadNewMessageEvent,
  ThreadTypingEvent,
  ProfileViewEvent,
  CounterUpdateEvent,
} from './models/events.js';

// ─── Builders ─────────────────────────────────────────────────────────────────
export { MessageBuilder, type MessagePayload } from './builders/MessageBuilder.js';

// ─── Utilities ────────────────────────────────────────────────────────────────
export { Collection } from './util/Collection.js';
export { Intents, type IntentResolvable } from './util/Intents.js';
export { normalizeList } from './utils/normalize.js';
export { parseTimestamp } from './utils/time.js';

// ─── Core Internals (advanced use) ───────────────────────────────────────────
export { AuthManager } from './auth/AuthManager.js';
export { HttpClient } from './http/HttpClient.js';
export { InterpalState } from './state/InterpalState.js';
export { WebSocketClient } from './websocket/WebSocketClient.js';
export { SessionManager } from './session/SessionManager.js';

// ─── Legacy API (backward compat, @deprecated) ───────────────────────────────
export { BaseAPI } from './api/BaseAPI.js';
export { UserAPI } from './api/UserAPI.js';
export { MessagesAPI } from './api/MessagesAPI.js';
export { SearchAPI } from './api/SearchAPI.js';
export { MediaAPI } from './api/MediaAPI.js';
export { SocialAPI } from './api/SocialAPI.js';
export { RealtimeAPI } from './api/RealtimeAPI.js';
export { NotificationsAPI } from './api/NotificationsAPI.js';
export { PostsAPI } from './api/PostsAPI.js';

// ─── Errors ───────────────────────────────────────────────────────────────────
export * from './errors.js';

// ─── Types ────────────────────────────────────────────────────────────────────
export * from './types/index.js';

// ─── Aliases ──────────────────────────────────────────────────────────────────
export type { CommandContext as Context } from './ext/commands/index.js';


