# Interpal-JS v2 Migration Guide

This guide will help you migrate from Interpal-JS v1 to v2. The v2 refactoring introduces architectural changes inspired by discord.js to improve developer experience, performance, and maintainability.

## Table of Contents

1. [Key Changes](#key-changes)
2. [Breaking Changes](#breaking-changes)
3. [New Features](#new-features)
4. [Migration Examples](#migration-examples)
5. [Backward Compatibility](#backward-compatibility)

---

## Key Changes

### 1. Client is Now an EventEmitter

The `InterpalClient` now extends Node.js's `EventEmitter`, making it the central hub for all events.

**Before (v1):**
```javascript
const client = new InterpalClient({ /* options */ });
await client.startWebSocket();

// Events were on the WebSocket client
client.wsClient.on('message', (data) => {
  console.log('New message:', data);
});
```

**After (v2):**
```javascript
const client = new InterpalClient({ /* options */ });
await client.connect();

// Events are now on the main client
client.on('messageCreate', (message) => {
  console.log('New message:', message);
});
```

### 2. Manager Pattern for Resources

Resources (users, messages, threads) are now managed by dedicated `Manager` classes with caching built-in.

**Before (v1):**
```javascript
const user = await client.user.getUser('123');
```

**After (v2):**
```javascript
const user = await client.users.fetch('123');
// Cached automatically! Second call won't hit the API
const sameUser = await client.users.fetch('123');
```

### 3. Models Now Have Client Reference

All models (User, Message, Thread) extend the new `Base` class and have access to the client.

**Before (v1):**
```javascript
const message = await client.messages.getThreadMessages('thread123');
// message[0] is a plain object
```

**After (v2):**
```javascript
const messages = await client.messages.fetchThreadMessages('thread123');
// messages[0] is a Message instance with methods
await messages[0].delete();
await messages[0].reply('Thanks!');
const author = await messages[0].fetchAuthor();
```

### 4. Collection Utility

Collections (extended Maps) are used throughout the API for working with groups of resources.

```javascript
const users = await client.users.search({ country: 'US' });
// users is an array, but cache is a Collection

// Find a user in cache
const cachedUser = client.users.cache.find(u => u.username === 'john');

// Filter users
const onlineUsers = client.users.cache.filter(u => u.isOnline);

// Map to usernames
const usernames = client.users.cache.map(u => u.username);
```

### 5. Intent-Based Event Filtering

Subscribe only to the events you need to reduce data transfer and processing.

```javascript
import { InterpalClient, Intents } from 'interpal-js';

const client = new InterpalClient({
  intents: [
    Intents.FLAGS.MESSAGES,
    Intents.FLAGS.TYPING,
  ],
});
```

---

## Breaking Changes

### Client Methods

| v1 Method | v2 Method | Notes |
|-----------|-----------|-------|
| `client.startWebSocket()` | `client.connect()` | Old method still works but deprecated |
| `client.stopWebSocket()` | `client.disconnect()` | Old method still works but deprecated |
| `client.isWebSocketConnected()` | `client.isConnected` | Now a property, not a method |
| `client.readMessage()` | `client.messages.markAsRead()` | Moved to MessageManager |

### API Namespaces

| v1 API | v2 Manager | Notes |
|--------|-----------|-------|
| `client.user.*` | `client.users.*` | Now plural, returns Manager |
| `client.messages.*` | `client.messages.*` | Same name, but different methods |

### Event Names

| v1 Event | v2 Event | Data Type |
|----------|----------|-----------|
| `'message'` | `'messageCreate'` | `Message` instance |
| `'typing'` | `'typingStart'` | Event data object |
| `'notification'` | `'notificationUpdate'` | Event data object |

### Model Constructors

Models now require a client instance as the first parameter:

**Before (v1):**
```javascript
const user = new User({ id: '123', name: 'John' });
```

**After (v2):**
```javascript
const user = new User(client, { id: '123', name: 'John' });
// But you typically won't construct models manually - managers do this for you
```

---

## New Features

### 1. MessageBuilder

Build complex messages with a fluent API:

```javascript
import { MessageBuilder } from 'interpal-js';

const message = new MessageBuilder()
  .setContent('Hello!')
  .setReplyTo('message123')
  .setTmpId('temp-id');

await client.messages.send('thread123', message);
```

### 2. Collection Methods

Work with cached resources using powerful array-like methods:

```javascript
// Find
const user = client.users.cache.find(u => u.age > 18);

// Filter
const adults = client.users.cache.filter(u => u.age >= 18);

// Map
const names = client.users.cache.map(u => u.name);

// First/Last
const firstUser = client.users.cache.first();
const last5Users = client.users.cache.last(5);

// Random
const randomUser = client.users.cache.random();

// Sort
client.users.cache.sort((a, b) => a.age - b.age);

// Reduce
const totalAge = client.users.cache.reduce((sum, u) => sum + (u.age || 0), 0);
```

### 3. Model Methods

Models now have useful instance methods:

```javascript
// Message methods
await message.delete();
await message.reply('Thanks!');
const author = await message.fetchAuthor();
const authorCached = message.author; // From cache

// User methods
await user.fetch(); // Refresh data from API

// Thread methods
await thread.send('Hello!');
await thread.setTyping(true);
const messages = await thread.fetchMessages();
const participants = thread.participants; // Collection of Users
```

### 4. Intent System

Fine-tune which events you receive:

```javascript
import { Intents } from 'interpal-js';

// Specific intents
const client = new InterpalClient({
  intents: [Intents.FLAGS.MESSAGES, Intents.FLAGS.NOTIFICATIONS],
});

// All intents
const client = new InterpalClient({
  intents: Intents.ALL,
});

// Default intents (messages, notifications, threads)
const client = new InterpalClient({
  intents: Intents.DEFAULT,
});

// By name (string)
const client = new InterpalClient({
  intents: ['MESSAGES', 'TYPING'],
});

// Mixed
const client = new InterpalClient({
  intents: [Intents.FLAGS.MESSAGES, 'TYPING', 1 << 2],
});
```

---

## Migration Examples

### Example 1: Basic Bot

**Before (v1):**
```javascript
import { InterpalClient } from 'interpal-js';

const client = new InterpalClient({
  username: 'mybot',
  password: 'password',
  autoLogin: true,
});

await client.initialize();
await client.startWebSocket();

client.wsClient.on('message', async (event) => {
  if (event.message?.content === '!ping') {
    await client.messages.sendMessage(event.threadId, 'Pong!');
  }
});
```

**After (v2):**
```javascript
import { InterpalClient, Intents } from 'interpal-js';

const client = new InterpalClient({
  username: 'mybot',
  password: 'password',
  autoLogin: true,
  intents: [Intents.FLAGS.MESSAGES],
});

await client.initialize();
await client.connect();

client.on('messageCreate', async (message) => {
  if (message.content === '!ping') {
    await message.reply('Pong!');
  }
});
```

### Example 2: User Fetching and Caching

**Before (v1):**
```javascript
const user1 = await client.user.getUser('123');
const user2 = await client.user.getUser('123'); // Another API call
```

**After (v2):**
```javascript
const user1 = await client.users.fetch('123');
const user2 = await client.users.fetch('123'); // From cache, no API call!

// Force refresh
const freshUser = await client.users.fetch('123', { force: true });

// Get from cache without API call
const cachedUser = client.users.cache.get('123');
```

### Example 3: Working with Threads

**Before (v1):**
```javascript
const threads = await client.messages.getThreads();
for (const thread of threads) {
  if (thread.unread) {
    const messages = await client.messages.getThreadMessages(thread.id);
    console.log('Unread thread:', thread.subject);
  }
}
```

**After (v2):**
```javascript
const threads = await client.threads.fetchAll();
for (const thread of threads) {
  if (thread.unread) {
    const messages = await thread.fetchMessages();
    console.log('Unread thread:', thread.subject);
    
    // Reply to the last message
    const lastMessage = messages[messages.length - 1];
    await lastMessage.reply('I saw your message!');
  }
}
```

### Example 4: Advanced Message Sending

**Before (v1):**
```javascript
await client.messages.sendMessage('thread123', 'Hello!', {
  attachment_type: 'gif',
  gif_attachment_url: 'https://example.com/gif.gif',
});
```

**After (v2):**
```javascript
import { MessageBuilder } from 'interpal-js';

// Option 1: Using builder
const message = new MessageBuilder()
  .setContent('Hello!')
  .setGif('https://example.com/gif.gif');
await client.messages.send('thread123', message);

// Option 2: Direct method
await client.messages.sendGif('thread123', 'https://example.com/gif.gif');

// Option 3: Through thread
const thread = await client.threads.fetch('thread123');
await thread.send('Hello!');
```

---

## Backward Compatibility

Most v1 code will continue to work with deprecation warnings:

### Still Supported (with warnings)

- `client.startWebSocket()` → Use `client.connect()`
- `client.stopWebSocket()` → Use `client.disconnect()`
- `client.isWebSocketConnected()` → Use `client.isConnected`
- Legacy event names (`'message'`, `'typing'`, etc.)
- Legacy API classes (`UserAPI`, `MessagesAPI`, etc.) are still exported

### Recommended Migration Path

1. **Update event listeners** - Change to new event names
2. **Switch to managers** - Use `client.users`, `client.messages`, `client.threads`
3. **Use model methods** - Take advantage of instance methods on models
4. **Add intents** - Optimize your bot with the intent system
5. **Leverage Collections** - Use Collection methods for working with cached data

---

## Support

For issues or questions about the migration:
- Check the [examples](./examples) directory
- Review the [API documentation](./docs)
- Open an issue on GitHub

Happy migrating! 🚀

