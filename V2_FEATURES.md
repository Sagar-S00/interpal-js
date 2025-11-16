# Interpal-JS v2 Features

This document provides detailed documentation for all new features introduced in Interpal-JS v2.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Collection Class](#collection-class)
3. [Intents System](#intents-system)
4. [Manager Pattern](#manager-pattern)
5. [Enhanced Models](#enhanced-models)
6. [Message Builder](#message-builder)
7. [Event System](#event-system)

---

## Architecture Overview

Interpal-JS v2 introduces a discord.js-inspired architecture with several key components:

```
InterpalClient (EventEmitter)
├── Managers (UserManager, MessageManager, ThreadManager, etc.)
│   ├── Cache (Collection<K, V>)
│   └── API Methods
├── Models (User, Message, Thread)
│   └── Instance Methods
└── WebSocketClient (Internal)
    └── Event Dispatching
```

### Core Principles

1. **Single Entry Point**: `InterpalClient` is the main interface
2. **Event-Driven**: All events emit from the client
3. **Caching First**: Managers automatically cache resources
4. **Fluent API**: Method chaining and intuitive naming
5. **Type Safety**: Full TypeScript support

---

## Collection Class

The `Collection` class extends JavaScript's native `Map` with powerful utility methods inspired by array methods and discord.js.

### Basic Usage

```typescript
import { Collection } from 'interpal-js';

const users = new Collection<string, User>();
users.set('123', user1);
users.set('456', user2);
```

### Available Methods

#### Search & Filter

```typescript
// Find first matching item
const admin = collection.find(user => user.role === 'admin');

// Find key
const adminId = collection.findKey(user => user.role === 'admin');

// Filter items
const adults = collection.filter(user => user.age >= 18);

// Check if any match
const hasAdmin = collection.some(user => user.role === 'admin');

// Check if all match
const allAdults = collection.every(user => user.age >= 18);
```

#### Transform

```typescript
// Map to array
const names = collection.map(user => user.name);

// Map to new Collection
const upperNames = collection.mapValues(user => user.name.toUpperCase());

// Reduce
const totalAge = collection.reduce((sum, user) => sum + user.age, 0);
```

#### Access

```typescript
// First/Last
const first = collection.first();
const last = collection.last();
const first3 = collection.first(3); // Array of first 3
const last3 = collection.last(3); // Array of last 3

// Random
const random = collection.random();
const random5 = collection.random(5); // Array of 5 random

// At index
const third = collection.at(2);
const lastItem = collection.at(-1);
```

#### Manipulation

```typescript
// Sort in place
collection.sort((a, b) => a.age - b.age);

// Clone
const copy = collection.clone();

// Concat
const combined = collection1.concat(collection2, collection3);

// Partition
const [passed, failed] = collection.partition(user => user.age >= 18);

// Sweep (remove and count)
const removed = collection.sweep(user => user.inactive);
```

#### Utilities

```typescript
// Ensure (get or create)
const user = collection.ensure('123', (id) => new User(client, { id }));

// Equals
const same = collection1.equals(collection2);

// Tap (run function and return collection)
collection.tap(c => console.log(`Size: ${c.size}`)).map(u => u.name);

// Each (forEach that returns collection)
collection.each(user => console.log(user.name)).filter(u => u.active);

// To JSON
const json = collection.toJSON(); // { "123": user1, "456": user2 }
```

---

## Intents System

Intents allow you to subscribe only to the events you need, optimizing bandwidth and processing.

### Available Intents

```typescript
Intents.FLAGS.MESSAGES       // Message events
Intents.FLAGS.TYPING          // Typing indicators
Intents.FLAGS.NOTIFICATIONS   // Notifications and counters
Intents.FLAGS.PROFILE_VIEWS   // Profile view events
Intents.FLAGS.PRESENCE        // Online status
Intents.FLAGS.THREADS         // Thread/conversation events
Intents.FLAGS.SOCIAL          // Social interactions
```

### Usage Examples

```typescript
import { InterpalClient, Intents } from 'interpal-js';

// Single intent
const client = new InterpalClient({
  intents: Intents.FLAGS.MESSAGES,
});

// Multiple intents (array)
const client = new InterpalClient({
  intents: [
    Intents.FLAGS.MESSAGES,
    Intents.FLAGS.TYPING,
    Intents.FLAGS.NOTIFICATIONS,
  ],
});

// Multiple intents (bitwise OR)
const client = new InterpalClient({
  intents: Intents.FLAGS.MESSAGES | Intents.FLAGS.TYPING,
});

// All intents
const client = new InterpalClient({
  intents: Intents.ALL,
});

// Default intents (recommended for most bots)
const client = new InterpalClient({
  intents: Intents.DEFAULT, // MESSAGES | NOTIFICATIONS | THREADS
});

// String names
const client = new InterpalClient({
  intents: ['MESSAGES', 'TYPING'],
});
```

### Intent Utilities

```typescript
// Check if intent is included
Intents.has(myIntents, Intents.FLAGS.MESSAGES); // true/false

// Add intent
const newIntents = Intents.add(myIntents, Intents.FLAGS.TYPING);

// Remove intent
const lessIntents = Intents.remove(myIntents, Intents.FLAGS.TYPING);

// Convert to array of names
const names = Intents.toArray(myIntents); // ['MESSAGES', 'NOTIFICATIONS']
```

---

## Manager Pattern

Managers handle fetching, caching, and managing specific resource types.

### UserManager

```typescript
// Fetch user (with caching)
const user = await client.users.fetch('123');

// Force fetch (bypass cache)
const fresh = await client.users.fetch('123', { force: true });

// Fetch without caching
const temp = await client.users.fetch('123', { cache: false });

// Fetch self
const me = await client.users.fetchSelf();

// Update self
const updated = await client.users.updateSelf({ name: 'New Name' });

// Search users
const results = await client.users.search({ country: 'US', age_min: 18 });

// Resolve from cache
const cached = client.users.resolve('123'); // Returns User or null
const cachedById = client.users.resolveId(userInstance); // Returns ID or null

// Access cache
const allUsers = client.users.cache; // Collection<string, User>
const online = client.users.cache.filter(u => u.isOnline);
```

### MessageManager

```typescript
// Fetch thread messages
const messages = await client.messages.fetchThreadMessages('thread123');

// Send message (string)
const sent = await client.messages.send('thread123', 'Hello!');

// Send message (builder)
const builder = new MessageBuilder().setContent('Hello!').setReplyTo('msg123');
const sent = await client.messages.send('thread123', builder);

// Send GIF
const gif = await client.messages.sendGif('thread123', 'https://example.com/gif.gif');

// Send correction
const correction = await client.messages.sendCorrection(
  'thread123',
  'Corrected text',
  'attachment123'
);

// Delete message
await client.messages.delete('msg123', 'thread123');

// Mark as read
await client.messages.markAsRead('thread123', 'msg123');

// Set typing
await client.messages.setTyping('thread123', true);

// Access cache
const cachedMsg = client.messages.cache.get('msg123');
```

### ThreadManager

```typescript
// Fetch single thread
const thread = await client.threads.fetch('thread123');

// Fetch all threads
const threads = await client.threads.fetchAll({ limit: 50, offset: 0 });

// Fetch user thread (direct message)
const dm = await client.threads.fetchUserThread('user123', {
  includeRelation: false,
});

// Access cache
const allThreads = client.threads.cache; // Collection<string, Thread>
const unread = client.threads.cache.filter(t => t.unread);
```

### NotificationManager

```typescript
// Fetch notifications
const notifications = await client.notifications.fetch({ limit: 20 });

// Mark as read
await client.notifications.markAsRead('notif123');

// Mark all as read
await client.notifications.markAllAsRead();

// Delete notification
await client.notifications.delete('notif123');
```

---

## Enhanced Models

All models extend the `Base` class and have a reference to the client, enabling powerful instance methods.

### User Model

```typescript
// Properties
user.id
user.name
user.username
user.country
user.city
user.gender
user.age
user.lastLogin
user.avatarUrl
user.isSelf

// Methods
await user.fetch(); // Refresh from API
user.toString(); // Pretty string representation
user.toJSON(); // Plain object
const clone = user.clone(); // Shallow clone
```

### Message Model

```typescript
// Properties
message.id
message.threadId
message.senderId
message.content
message.createdAt
message.attachmentType

// Getters
message.author // User | null (from cache)

// Methods
await message.fetchAuthor(); // Fetch User from API
await message.delete(); // Delete this message
await message.reply('Response'); // Reply to this message
message.toString();
message.toJSON();
```

### Thread Model

```typescript
// Properties
thread.id
thread.subject
thread.lastMessage
thread.lastMessageId
thread.participantIds
thread.updatedAt
thread.unread

// Getters
thread.participants // Collection<string, User> (from cache)

// Methods
await thread.fetchMessages(options); // Fetch messages in thread
await thread.send('Hello!'); // Send message to thread
await thread.setTyping(true); // Set typing indicator
thread.toString();
thread.toJSON();
```

---

## Message Builder

The `MessageBuilder` provides a fluent API for constructing complex messages.

### Basic Usage

```typescript
import { MessageBuilder } from 'interpal-js';

const message = new MessageBuilder()
  .setContent('Hello, world!')
  .setReplyTo('message123')
  .setTmpId('temp-id');

await client.messages.send('thread123', message);
```

### All Methods

```typescript
const builder = new MessageBuilder('Initial content')
  .setContent('Updated content')         // Set message content
  .setThreadId('thread123')              // Set thread ID
  .setReplyTo('message123')              // Reply to message
  .setGif('https://example.com/gif.gif') // Add GIF
  .setCorrection('attachment123')        // Set as correction
  .setAttachmentType('custom')           // Custom attachment type
  .setTmpId('temp-id')                   // Temporary ID
  .addExtra('key', 'value')              // Add custom field
  .setExtra({ key1: 'val1', key2: 'val2' }); // Set multiple fields

// Build to payload object
const payload = builder.build();

// Access properties
builder.content;   // string
builder.threadId;  // string | undefined
```

### Integration with Manager

The `MessageManager.send()` method accepts strings, builders, or raw payloads:

```typescript
// String
await client.messages.send('thread123', 'Hello!');

// Builder
await client.messages.send('thread123', new MessageBuilder('Hello!'));

// Payload
await client.messages.send('thread123', {
  message: 'Hello!',
  attachment_type: 'gif',
  gif_attachment_url: 'https://example.com/gif.gif',
});
```

---

## Event System

The client emits events that you can listen to using the standard EventEmitter API.

### Lifecycle Events

```typescript
client.on('ready', () => {
  console.log('Connected to gateway!');
});

client.on('disconnect', ({ code, reason }) => {
  console.log(`Disconnected: ${code} - ${reason}`);
});

client.on('error', (error) => {
  console.error('Client error:', error);
});
```

### Resource Events

```typescript
// New message
client.on('messageCreate', (message: Message) => {
  console.log(`${message.author?.username}: ${message.content}`);
});

// Typing started
client.on('typingStart', (data) => {
  console.log('User is typing...');
});

// Notification update
client.on('notificationUpdate', (data) => {
  console.log('New notification count:', data.count);
});

// Profile view
client.on('profileView', (data) => {
  console.log('Someone viewed your profile');
});
```

### Debug Events

```typescript
// Raw WebSocket data
client.on('raw', (data) => {
  console.log('Raw:', data);
});

// Sequence gap detected
client.on('sequenceGap', ({ expected, got }) => {
  console.warn(`Sequence gap: expected ${expected}, got ${got}`);
});
```

### Event Reference

| Event Name | Data Type | Description |
|------------|-----------|-------------|
| `ready` | `void` | Connected to gateway |
| `disconnect` | `{ code: number, reason: string }` | Disconnected from gateway |
| `error` | `Error` | An error occurred |
| `messageCreate` | `Message` | New message received |
| `messageDelete` | `{ id: string, threadId?: string }` | Message deleted |
| `typingStart` | `object` | User started typing |
| `notificationUpdate` | `object` | Notification counter updated |
| `profileView` | `object` | Profile was viewed |
| `raw` | `any` | Raw WebSocket data |
| `sequenceGap` | `{ expected: number, got: number }` | Sequence number gap detected |

---

## TypeScript Support

Interpal-JS v2 is written in TypeScript and provides full type definitions.

### Type Exports

```typescript
import type {
  InterpalClientOptions,
  SessionPayload,
  RequestParams,
  UserData,
  MessageData,
  ThreadData,
  MessagePayload,
  IntentResolvable,
} from 'interpal-js';
```

### Generic Collections

```typescript
const users: Collection<string, User> = client.users.cache;
const messages: Collection<string, Message> = client.messages.cache;
```

### Extending Classes

```typescript
import { Base, InterpalClient } from 'interpal-js';

class CustomModel extends Base {
  constructor(client: InterpalClient, data: any) {
    super(client);
    this._patch(data);
  }

  _patch(data: any): this {
    // Update properties
    return this;
  }

  toJSON(): Record<string, any> {
    return { /* ... */ };
  }
}
```

---

## Best Practices

### 1. Use Intents

Only subscribe to events you need:

```typescript
const client = new InterpalClient({
  intents: [Intents.FLAGS.MESSAGES], // Only messages
});
```

### 2. Leverage Caching

Check cache before fetching:

```typescript
const user = client.users.cache.get('123') 
  || await client.users.fetch('123');
```

### 3. Use Model Methods

Take advantage of instance methods:

```typescript
// Good
await message.reply('Thanks!');

// Less good
await client.messages.send(message.threadId, 'Thanks!', {
  reply_to: message.id,
});
```

### 4. Handle Errors

Always handle potential errors:

```typescript
client.on('error', (error) => {
  console.error('Client error:', error);
});

client.on('messageCreate', async (message) => {
  try {
    await message.reply('Hello!');
  } catch (error) {
    console.error('Failed to send message:', error);
  }
});
```

### 5. Clean Up

Disconnect when done:

```typescript
process.on('SIGINT', async () => {
  await client.disconnect();
  process.exit(0);
});
```

---

For more examples, see the [examples](./examples) directory and [MIGRATION_V2.md](./MIGRATION_V2.md).

