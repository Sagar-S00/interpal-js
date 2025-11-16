# Interpal-JS v2 Quick Reference

A quick reference guide for the most common v2 API operations.

## Setup

```javascript
import { InterpalClient, Intents } from 'interpal-js';

const client = new InterpalClient({
  username: 'your-username',
  password: 'your-password',
  autoLogin: true,
  intents: Intents.DEFAULT, // or specific intents array
});

await client.initialize();
await client.connect();
```

## Events

```javascript
// Connection lifecycle
client.on('ready', () => { /* Connected */ });
client.on('disconnect', ({ code, reason }) => { /* Disconnected */ });
client.on('error', (error) => { /* Error occurred */ });

// Resource events
client.on('messageCreate', (message) => { /* New message */ });
client.on('typingStart', (data) => { /* User typing */ });
client.on('notificationUpdate', (data) => { /* Notification update */ });
```

## Users

```javascript
// Fetch user
const user = await client.users.fetch('userId');

// Fetch self
const me = await client.users.fetchSelf();

// Update self
await client.users.updateSelf({ name: 'New Name' });

// Search users
const results = await client.users.search({ country: 'US' });

// Cache access
const cached = client.users.cache.get('userId');
const allUsers = client.users.cache; // Collection
```

## Messages

```javascript
// Fetch messages
const messages = await client.messages.fetchThreadMessages('threadId');

// Send message
await client.messages.send('threadId', 'Hello!');

// Send with builder
const msg = new MessageBuilder()
  .setContent('Hello!')
  .setReplyTo('messageId');
await client.messages.send('threadId', msg);

// Send GIF
await client.messages.sendGif('threadId', 'https://example.com/gif.gif');

// Delete message
await client.messages.delete('messageId', 'threadId');

// Mark as read
await client.messages.markAsRead('threadId', 'messageId');

// Set typing
await client.messages.setTyping('threadId', true);
```

## Threads

```javascript
// Fetch thread
const thread = await client.threads.fetch('threadId');

// Fetch all threads
const threads = await client.threads.fetchAll({ limit: 50 });

// Fetch DM thread
const dm = await client.threads.fetchUserThread('userId');

// Cache access
const unread = client.threads.cache.filter(t => t.unread);
```

## Message Instance Methods

```javascript
// Reply to message
await message.reply('Response');

// Delete message
await message.delete();

// Get/fetch author
const author = message.author; // From cache
const author = await message.fetchAuthor(); // From API
```

## Thread Instance Methods

```javascript
// Send message
await thread.send('Hello!');

// Fetch messages
const messages = await thread.fetchMessages();

// Set typing
await thread.setTyping(true);

// Get participants
const participants = thread.participants; // Collection
```

## User Instance Methods

```javascript
// Refresh data
await user.fetch();
```

## Collection Methods

```javascript
const collection = client.users.cache;

// Find
const user = collection.find(u => u.username === 'john');
const userId = collection.findKey(u => u.age > 18);

// Filter
const adults = collection.filter(u => u.age >= 18);

// Map
const names = collection.map(u => u.name);

// Check
const hasAdmin = collection.some(u => u.role === 'admin');
const allActive = collection.every(u => u.active);

// Access
const first = collection.first();
const last = collection.last();
const random = collection.random();
const at = collection.at(2);

// Multiple
const first3 = collection.first(3);
const last5 = collection.last(5);
const random10 = collection.random(10);

// Sort
collection.sort((a, b) => a.age - b.age);

// Clone
const copy = collection.clone();

// Partition
const [active, inactive] = collection.partition(u => u.active);

// Reduce
const totalAge = collection.reduce((sum, u) => sum + (u.age || 0), 0);

// Sweep (remove matching)
const removed = collection.sweep(u => u.inactive);

// Ensure (get or create)
const user = collection.ensure('id', (id) => createUser(id));

// To array
const array = [...collection.values()];
const keys = [...collection.keys()];

// To JSON
const json = collection.toJSON();
```

## Intents

```javascript
import { Intents } from 'interpal-js';

// Predefined
const all = Intents.ALL;
const defaults = Intents.DEFAULT;

// Individual flags
const messages = Intents.FLAGS.MESSAGES;
const typing = Intents.FLAGS.TYPING;
const notifications = Intents.FLAGS.NOTIFICATIONS;
const profileViews = Intents.FLAGS.PROFILE_VIEWS;
const presence = Intents.FLAGS.PRESENCE;
const threads = Intents.FLAGS.THREADS;
const social = Intents.FLAGS.SOCIAL;

// Combine
const combined = Intents.FLAGS.MESSAGES | Intents.FLAGS.TYPING;

// Array (recommended)
const client = new InterpalClient({
  intents: [
    Intents.FLAGS.MESSAGES,
    Intents.FLAGS.TYPING,
  ],
});

// String names
const client = new InterpalClient({
  intents: ['MESSAGES', 'TYPING'],
});

// Check intent
Intents.has(myIntents, Intents.FLAGS.MESSAGES); // boolean

// Add intent
const newIntents = Intents.add(myIntents, Intents.FLAGS.TYPING);

// Remove intent
const lessIntents = Intents.remove(myIntents, Intents.FLAGS.TYPING);

// List intents
const names = Intents.toArray(myIntents); // ['MESSAGES', 'TYPING']
```

## MessageBuilder

```javascript
import { MessageBuilder } from 'interpal-js';

const message = new MessageBuilder('Initial content')
  .setContent('Updated content')
  .setThreadId('threadId')
  .setReplyTo('messageId')
  .setGif('https://example.com/gif.gif')
  .setCorrection('attachmentId')
  .setAttachmentType('custom')
  .setTmpId('temp-id')
  .addExtra('key', 'value')
  .setExtra({ key1: 'val1', key2: 'val2' });

// Build payload
const payload = message.build();

// Send
await client.messages.send('threadId', message);
```

## Notifications

```javascript
// Fetch notifications
const notifications = await client.notifications.fetch({ limit: 20 });

// Mark as read
await client.notifications.markAsRead('notifId');

// Mark all as read
await client.notifications.markAllAsRead();

// Delete
await client.notifications.delete('notifId');
```

## TypeScript Types

```typescript
import type {
  InterpalClient,
  Collection,
  User,
  Message,
  Thread,
  MessageBuilder,
  Intents,
  IntentResolvable,
  UserData,
  MessageData,
  ThreadData,
  MessagePayload,
  InterpalClientOptions,
  SessionPayload,
  RequestParams,
} from 'interpal-js';
```

## Common Patterns

### Command Handler

```javascript
client.on('messageCreate', async (message) => {
  if (!message.content?.startsWith('!')) return;
  
  const args = message.content.slice(1).split(' ');
  const command = args.shift()?.toLowerCase();
  
  switch (command) {
    case 'ping':
      await message.reply('Pong!');
      break;
    case 'help':
      await message.reply('Available commands: !ping, !help');
      break;
  }
});
```

### Error Handling

```javascript
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

### Cache Management

```javascript
// Clear old messages from cache
const oneHourAgo = Date.now() - 3600000;
client.messages.cache.sweep(msg => 
  msg.createdAt && msg.createdAt.getTime() < oneHourAgo
);

// Find unread threads
const unreadThreads = client.threads.cache.filter(t => t.unread);
console.log(`You have ${unreadThreads.size} unread threads`);

// Get most recent message
const latestMessage = client.messages.cache
  .sort((a, b) => 
    (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
  )
  .first();
```

### Graceful Shutdown

```javascript
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await client.disconnect();
  process.exit(0);
});
```

---

For more detailed documentation, see:
- [MIGRATION_V2.md](./MIGRATION_V2.md) - Full migration guide
- [V2_FEATURES.md](./V2_FEATURES.md) - Complete feature documentation
- [examples/v2-basic-bot.js](./examples/v2-basic-bot.js) - Working example

