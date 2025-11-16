import type {
  CounterUpdateEvent,
  InterpalClientOptions,
  ThreadNewMessageEvent,
  ThreadTypingEvent,
} from '../../types/index.js';
import { AsyncInterpalClient } from '../../client/AsyncInterpalClient.js';

export type CommandHandler = (ctx: CommandContext, ...args: string[]) => Promise<void>;

export interface CommandContext {
  bot: Bot;
  threadId?: string;
  senderId?: string;
  senderName?: string;
  content?: string;
  raw: Record<string, unknown>;
}

export interface CommandDefinition {
  name: string;
  aliases: string[];
  handler: CommandHandler;
  help?: string;
}

type BotEventMap = {
  on_ready: void;
  on_message: ThreadNewMessageEvent;
  on_typing: ThreadTypingEvent;
  on_user_typing: ThreadTypingEvent;
  on_notification: CounterUpdateEvent;
  on_disconnect: { code: number; reason?: string };
  on_error: Error;
};

type EventCallback<T = unknown> = (payload: T) => void | Promise<void>;

export class Bot extends AsyncInterpalClient {
  private readonly commands = new Map<string, CommandDefinition>();
  private commandPrefix: string[];
  private readonly eventHandlers = new Map<string, Set<EventCallback>>();

  constructor(options: InterpalClientOptions & { commandPrefix?: string | string[] } = {}) {
    super(options);
    const prefix = options.commandPrefix ?? '!';
    this.commandPrefix = Array.isArray(prefix) ? prefix : [prefix];
  }

  override async startWebSocket(): Promise<void> {
    await super.startWebSocket();
    this.attachRegisteredHandlers();
  }

  command(name: string, handler: CommandHandler, aliases: string[] = [], help?: string): void {
    const definition: CommandDefinition = { name, aliases, handler, help };
    this.commands.set(name, definition);
    aliases.forEach((alias) => this.commands.set(alias, definition));
  }

  event<K extends keyof BotEventMap>(name: K): (handler: EventCallback<BotEventMap[K]>) => void;
  event(name: string): (handler: EventCallback) => void;
  event(name: string) {
    const wsEvent = this.mapBotEvent(name);
    return (handler: EventCallback): void => {
      this.registerHandler(wsEvent, handler);
    };
  }

  async bindWebSocket(): Promise<void> {
    await this.startWebSocket();
    this.wsClient?.on('message', async (payload: Record<string, unknown>) => {
      await this.handleMessage(payload);
    });
  }

  private async handleMessage(payload: Record<string, unknown>): Promise<void> {
    const data = payload.data as Record<string, unknown> | undefined;
    const message = data?.message as string | undefined;
    if (!message) return;

    const prefix = this.commandPrefix.find((p) => message.startsWith(p));
    if (!prefix) return;

    const content = message.slice(prefix.length).trim();
    const [name, ...args] = content.split(/\s+/);
    const definition = this.commands.get(name.toLowerCase());
    if (!definition) return;

    const ctx: CommandContext = {
      bot: this,
      threadId: data?.thread_id?.toString(),
      senderId: data?.sender_id?.toString(),
      senderName: (payload.sender as Record<string, unknown>)?.name as string | undefined,
      content: message,
      raw: payload,
    };

    await definition.handler(ctx, ...args);
  }

  private mapBotEvent(name: string): string {
    if (!name) return '';
    const predefined: Record<string, string> = {
      on_ready: 'ready',
      on_message: 'message',
      on_typing: 'typing',
      on_user_typing: 'typing',
      on_notification: 'notification',
      on_disconnect: 'disconnect',
      on_error: 'error',
    };
    return predefined[name] ?? name.replace(/^on_/, '') ?? name;
  }

  private registerHandler(event: string, handler: EventCallback): void {
    if (!event || typeof handler !== 'function') {
      return;
    }
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    const handlers = this.eventHandlers.get(event)!;
    if (handlers.has(handler)) {
      return;
    }
    handlers.add(handler);
    if (this.wsClient) {
      this.wsClient.on(event, handler as EventCallback);
    }
  }

  private attachRegisteredHandlers(): void {
    if (!this.wsClient) {
      return;
    }
    for (const [event, handlers] of this.eventHandlers.entries()) {
      for (const handler of handlers) {
        this.wsClient.on(event, handler as EventCallback);
      }
    }
  }
}

