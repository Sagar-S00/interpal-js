/**
 * Interpal-JS v2 Basic Bot Example
 *
 * Demonstrates the v2 manager-based API with the built-in payload-discovery
 * helper for inspecting real gateway frames.
 *
 * Environment variables:
 *   INTERPAL_USERNAME  – your Interpals username
 *   INTERPAL_PASSWORD  – your Interpals password
 *   DISCOVER_PAYLOADS  – set to "1" to record raw WS frames to a JSONL file
 *                        (useful for confirming gateway field names)
 */

import { InterpalClient, Intents, MessageBuilder } from 'interpal-js';

// ─── Client ──────────────────────────────────────────────────────────────────
const client = new InterpalClient({
  username: 'ainzz01',
  password: 'sagar890@',
  autoLogin: true,

  // Subscribe only to the events we need (reduces server load).
  intents: [
    Intents.FLAGS.MESSAGES,
    Intents.FLAGS.TYPING,
  ],

  // Set DISCOVER_PAYLOADS=1 in your environment to write every raw gateway
  // frame to `interpal-payloads.jsonl` in the current working directory.
  // Inspect that file to confirm real protocol field names, then remove this.
  discoverPayloads: true,
});


// ─── Lifecycle events ─────────────────────────────────────────────────────────
client.on('ready', () => {
  console.log('✅ Bot is ready and connected!');
  if (process.env.DISCOVER_PAYLOADS === '1') {
    console.log('🔍 Payload discovery is ON — raw frames are being written to interpal-payloads.jsonl');
  }
});

client.on('disconnect', ({ code, reason }) => {
  console.log(`❌ Disconnected: ${code} - ${reason}`);
});

client.on('error', (error) => {
  console.error('❌ Error:', error);
});

// ─── Message events ──────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  // Ignore messages from self
  const self = await client.users.fetchSelf();
  if (message.senderId === self.id) return;

  console.log(`📨 New message from ${message.author?.username}: ${message.content}`);

  if (!message.content) return;

  if (message.content === '!ping') {
    await message.reply('🏓 Pong!');
  }

  else if (message.content === '!hello') {
    const builder = new MessageBuilder()
      .setContent('👋 Hello! I\'m a bot running on Interpal-JS v2!')
      .setReplyTo(message.id);

    await client.messages.send(message.threadId, builder);
  }

  else if (message.content === '!author') {
    const author = await message.fetchAuthor();
    await message.reply(
      `👤 Author info:\n` +
      `Name: ${author.name}\n` +
      `Username: ${author.username}\n` +
      `Country: ${author.country}\n` +
      `Age: ${author.age}`
    );
  }

  else if (message.content === '!cache') {
    await message.reply(
      `📊 Cache stats:\n` +
      `Users: ${client.users.cache.size}\n` +
      `Messages: ${client.messages.cache.size}\n` +
      `Threads: ${client.threads.cache.size}`
    );
  }

  else if (message.content === '!threads') {
    const threads = await client.threads.fetchAll({ limit: 5 });
    const unread = threads.filter(t => t.unread);

    await message.reply(
      `📬 Recent threads:\n` +
      `Total: ${threads.length}\n` +
      `Unread: ${unread.length}\n` +
      threads.slice(0, 5).map(t =>
        `${t.unread ? '🔴' : '⚪'} ${t.subject || 'No subject'}`
      ).join('\n')
    );
  }

  else if (message.content === '!help') {
    await message.reply(
      `🤖 Available commands:\n` +
      `!ping    – Check if bot is responsive\n` +
      `!hello   – Get a greeting\n` +
      `!author  – Get info about message author\n` +
      `!cache   – View cache statistics\n` +
      `!threads – List recent threads\n` +
      `!help    – Show this message`
    );
  }
});

// ─── Typing events ───────────────────────────────────────────────────────────
client.on('typingStart', (data) => {
  console.log('⌨️  Someone is typing in thread', data.threadId ?? data.thread_id ?? '(unknown)');
});

// ─── Notification events ─────────────────────────────────────────────────────
client.on('notificationUpdate', (data) => {
  console.log('🔔 Counter update:', data);
});

// ─── Profile view events ─────────────────────────────────────────────────────
client.on('profileView', (data) => {
  console.log('👁️  Profile viewed by:', data.username ?? data.viewer ?? '(unknown)');
});

// ─── Raw dispatch (advanced) ─────────────────────────────────────────────────
// Fires for every gateway event *before* it is routed to the named handlers
// above.  Useful for handling event types that don't have a dedicated listener.
client.on('dispatch', (eventType, data) => {
  // Only log unhandled events to avoid noise.
  const handled = new Set(['THREAD_NEW_MESSAGE', 'THREAD_TYPING', 'COUNTER_UPDATE', 'PROFILE_VIEW']);
  if (!handled.has(eventType)) {
    console.log(`[dispatch] Unknown event type: ${eventType}`, data);
  }
});

// ─── Start / shutdown ────────────────────────────────────────────────────────
async function start() {
  try {
    await client.initialize();
    await client.connect();
    console.log('🚀 Bot started successfully!');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await client.disconnect();
  process.exit(0);
});

start();

