/**
 * Interpal-JS v2 Basic Bot Example
 * 
 * This example demonstrates the new v2 API architecture.
 */

import { InterpalClient, Intents, MessageBuilder } from 'interpal-js';

// Create client with intents
const client = new InterpalClient({
  username: process.env.INTERPAL_USERNAME,
  password: process.env.INTERPAL_PASSWORD,
  autoLogin: true,
  // Only subscribe to events we need
  intents: [
    Intents.FLAGS.MESSAGES,
    Intents.FLAGS.TYPING,
  ],
});

// Lifecycle events
client.on('ready', () => {
  console.log('✅ Bot is ready and connected!');
});

client.on('disconnect', ({ code, reason }) => {
  console.log(`❌ Disconnected: ${code} - ${reason}`);
});

client.on('error', (error) => {
  console.error('❌ Error:', error);
});

// Message event
client.on('messageCreate', async (message) => {
  // Ignore messages from self
  const self = await client.users.fetchSelf();
  if (message.senderId === self.id) return;

  console.log(`📨 New message from ${message.author?.username}: ${message.content}`);

  // Command handling
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
      `!ping - Check if bot is responsive\n` +
      `!hello - Get a greeting\n` +
      `!author - Get author information\n` +
      `!cache - View cache statistics\n` +
      `!threads - List recent threads\n` +
      `!help - Show this message`
    );
  }
});

// Typing event
client.on('typingStart', (data) => {
  console.log('⌨️ Someone is typing...');
});

// Start the bot
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await client.disconnect();
  process.exit(0);
});

start();

