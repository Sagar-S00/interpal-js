// Main Client
export { InterpalClient } from './client/InterpalClient.js';
export { AsyncInterpalClient } from './client/AsyncInterpalClient.js';
export { Bot } from './ext/commands/index.js';

// Managers (v2 API)
export { BaseManager } from './managers/BaseManager.js';
export { UserManager } from './managers/UserManager.js';
export { MessageManager } from './managers/MessageManager.js';
export { ThreadManager } from './managers/ThreadManager.js';
export { NotificationManager } from './managers/NotificationManager.js';

// Models
export { Base } from './models/Base.js';
export { User, type UserData } from './models/User.js';
export { Message, type MessageData } from './models/Message.js';
export { Thread, type ThreadData } from './models/Thread.js';

// Builders
export { MessageBuilder, type MessagePayload } from './builders/MessageBuilder.js';

// Utilities
export { Collection } from './util/Collection.js';
export { Intents, type IntentResolvable } from './util/Intents.js';

// Legacy API (for backward compatibility)
export { UserAPI } from './api/UserAPI.js';
export { MessagesAPI } from './api/MessagesAPI.js';
export { SearchAPI } from './api/SearchAPI.js';
export { MediaAPI } from './api/MediaAPI.js';
export { SocialAPI } from './api/SocialAPI.js';
export { RealtimeAPI } from './api/RealtimeAPI.js';
export { NotificationsAPI } from './api/NotificationsAPI.js';
export { PostsAPI } from './api/PostsAPI.js';

// Core
export { AuthManager } from './auth/AuthManager.js';
export { HttpClient } from './http/HttpClient.js';
export { InterpalState } from './state/InterpalState.js';
export { WebSocketClient } from './websocket/WebSocketClient.js';

// Events
export {
  EventCounters,
  MessageEventData,
  ThreadNewMessageEvent,
  ThreadTypingEvent,
  ProfileViewEvent,
  CounterUpdateEvent,
} from './models/events.js';

// Errors and Types
export * from './errors.js';
export * from './types/index.js';
export type { CommandContext as Context } from './ext/commands/index.js';

