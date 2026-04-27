import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { WEBSOCKET_URL } from '../constants.js';
import {
  WebSocketAuthenticationError,
  WebSocketConnectionError,
  WebSocketError,
  WebSocketTimeoutError,
} from '../errors.js';
import {
  CounterUpdateEvent,
  ProfileViewEvent,
  ThreadNewMessageEvent,
  ThreadTypingEvent,
} from '../models/events.js';
import type { AuthManager } from '../auth/AuthManager.js';
import type { InterpalState } from '../state/InterpalState.js';
import { PayloadDiscovery } from '../utils/payloadDiscovery.js';

export interface WebSocketConfig {
  connectTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  pongTimeoutMs?: number;
  reconnectDelayMs?: number;
  intents?: number;
  /**
   * When set, every raw gateway frame is appended to a JSONL file so you can
   * discover the exact field names the server sends.  Pass `true` for the
   * default path (`interpal-payloads.jsonl`) or a custom path string.
   */
  discoverPayloads?: boolean | string;
}

/**
 * The confirmed shape of a parsed Interpals gateway frame.
 * Field names confirmed from live payload discovery.
 */
type GatewayMessage = {
  /** Event type: 'THREAD_NEW_MESSAGE' | 'THREAD_SYNC_MESSAGE' | 'THREAD_TYPING' | 'THREAD_VIEWED' | 'COUNTER_UPDATE' | … */
  type?: string;
  /** Inner event payload (message data, typing data, etc.). */
  data?: Record<string, unknown>;
  /** Sender user object (THREAD_NEW_MESSAGE, THREAD_TYPING, THREAD_VIEWED). */
  sender?: Record<string, unknown>;
  /** Contact user object (THREAD_SYNC_MESSAGE). */
  contact?: Record<string, unknown>;
  /** Counter entity — { id: string, value: number } (COUNTER_UPDATE). */
  entity?: Record<string, unknown>;
  /** Unread counters snapshot (THREAD_NEW_MESSAGE). */
  counters?: Record<string, unknown>;
  /** Click URL (THREAD_NEW_MESSAGE). */
  click_url?: string;
};

const PING_INTERVAL_MS = 25_000;
const PONG_TIMEOUT_MS  = 8_000;

export class WebSocketClient extends EventEmitter {
  private readonly auth: AuthManager;
  private readonly state: InterpalState | null;
  private readonly connectTimeout: number;
  private pingInterval: number;
  private readonly pongTimeout: number;
  private readonly reconnectDelay: number;
  private readonly intents?: number;
  private readonly discovery: PayloadDiscovery;

  private ws: WebSocket | null = null;
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;
  private pongTimer?: NodeJS.Timeout;

  private lastSeq = 0;
  private manualClose = false;

  constructor(
    auth: AuthManager,
    config: WebSocketConfig = {},
    options: { state?: InterpalState | null } = {},
  ) {
    super();
    this.auth      = auth;
    this.state     = options.state ?? null;
    this.discovery = new PayloadDiscovery(config.discoverPayloads);

    this.connectTimeout = config.connectTimeoutMs  ?? 10_000;
    this.pingInterval   = config.heartbeatIntervalMs ?? PING_INTERVAL_MS;
    this.pongTimeout    = config.pongTimeoutMs     ?? PONG_TIMEOUT_MS;
    this.reconnectDelay = config.reconnectDelayMs  ?? 0;
    this.intents        = config.intents;
  }

  async connect(): Promise<void> {
    if (!this.auth.isAuthenticated) {
      throw new WebSocketAuthenticationError('Not authenticated');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new WebSocketAuthenticationError(
        'No auth token available. Call login() before connecting â€” the gateway ' +
        'requires an authToken, not a session cookie.',
      );
    }

    this.manualClose = false;
    let url = `${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`;
    if (this.intents !== undefined) {
      url += `&intents=${this.intents}`;
    }

    await this.openSocket(url, this.auth.getHeaders());
  }

  async disconnect(): Promise<void> {
    this.manualClose = true;
    this.clearTimers();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (!this.ws) return;
    await new Promise<void>((resolve) => {
      this.ws?.once('close', () => resolve());
      this.ws?.close();
    });
    this.ws = null;
  }

  async send(payload: Record<string, unknown>): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new WebSocketError('WebSocket not connected');
    }
    await new Promise<void>((resolve, reject) => {
      this.ws?.send(JSON.stringify(payload), (error) => {
        if (error) reject(new WebSocketError(error.message));
        else resolve();
      });
    });
  }

  get isConnected(): boolean {
    return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN);
  }

  private async openSocket(url: string, headers: Record<string, string | undefined>) {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url, { headers });
      let connectionTimeout: NodeJS.Timeout | undefined = setTimeout(() => {
        ws.terminate();
        reject(new WebSocketTimeoutError('Connection timeout'));
      }, this.connectTimeout);

      ws.on('open', () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = undefined;
        }
        this.ws = ws;
        this.clearTimers();
        this.startPingLoop();
        this.emit('ready');
        resolve();
      });

      ws.on('pong', () => this.resetPongTimer());

      ws.on('message', (raw) => this.handleMessage(raw));

      ws.on('error', (error) => this.reportError(error));

      ws.on('close', (code, reason) => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = undefined;
        }
        this.clearTimers();
        this.ws = null;
        this.emit('disconnect', { code, reason: reason?.toString() });
        if (!this.manualClose) this.scheduleReconnect();
      });
    });
  }

  private startPingLoop() {
    this.clearTimers();
    this.pingTimer = setInterval(() => this.sendPing(), this.pingInterval);
  }

  private sendPing() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.ping();
    } catch {
      // ignore; close handler will reconnect
    }
    this.resetPongTimer();
  }

  private resetPongTimer() {
    if (this.pongTimer) clearTimeout(this.pongTimer);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pongTimer = undefined;
      return;
    }
    this.pongTimer = setTimeout(() => {
      this.reportError(new WebSocketTimeoutError('Ping timeout'));
      try {
        this.ws?.terminate();
      } catch {
        // ignore; close handler will reconnect
      }
    }, this.pongTimeout);
  }

  private clearTimers() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.manualClose) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect().catch((error) => {
        this.reportError(new WebSocketConnectionError((error as Error).message));
      });
    }, this.reconnectDelay);
  }

  private handleMessage(raw: WebSocket.Data) {
    let payload: GatewayMessage;
    try {
      payload = JSON.parse(raw.toString()) as GatewayMessage;
    } catch {
      this.emit('raw', raw);
      return;
    }

    void this.discovery.record('raw_frame', payload);

    const type = payload.type;
    if (!type) {
      void this.discovery.record('unknown_frame', payload);
      return;
    }

    // Build enriched data: inner payload + context fields so that
    // InterpalClient._handleDispatch can cache users without needing the
    // full frame reference.
    const innerData: Record<string, unknown> = payload.data ?? {};
    const sender = payload.sender ?? payload.contact;
    const enriched: Record<string, unknown> = { ...innerData };
    if (sender)           enriched._sender   = sender;
    if (payload.entity)   enriched._entity   = payload.entity;
    if (payload.counters) enriched._counters = payload.counters;

    this.handleEvent(type, enriched);
  }

  private handleEvent(type: string, data: Record<string, unknown>) {
    // Emit a typed dispatch event for the client to handle.
    this.emit('dispatch', type, data);

    // Also emit legacy mapped events for backward compatibility.
    const eventName = this.mapEvent(type);
    const enriched  = this.transformPayload(type, { ...data, event: type, type });
    this.emit(eventName, enriched);
  }

  private mapEvent(type: string): string {
    switch (type) {
      case 'THREAD_NEW_MESSAGE': return 'message';
      case 'THREAD_TYPING':      return 'typing';
      case 'COUNTER_UPDATE':     return 'notification';
      case 'PROFILE_VIEW':       return 'profileView';
      default:                   return type.toLowerCase();
    }
  }

  private transformPayload(type: string, data: Record<string, unknown>): unknown {
    // Extract internal bookkeeping fields added by handleMessage.
    // `_sender`   — the full sender/contact user object
    // `_counters` — the unread counters snapshot
    // `_entity`   — the entity object (COUNTER_UPDATE)
    // The remaining `innerData` fields are the per-event payload fields
    // (id, thread_id, message, …) from the original `payload.data` object.
    const { _sender, _counters, _entity, event: _ev, type: _t, ...innerData } = data;

    switch (type) {
      case 'THREAD_NEW_MESSAGE':
        return new ThreadNewMessageEvent(
          {
            type,
            data: innerData,
            sender: _sender as Record<string, unknown> | undefined,
            counters: _counters as Record<string, unknown> | undefined,
          },
          { state: this.state ?? undefined },
        );
      case 'THREAD_TYPING':
        return new ThreadTypingEvent(
          {
            type,
            thread_id: innerData.thread_id as string | number | undefined,
            user: _sender as Record<string, unknown> | undefined,
          },
          { state: this.state ?? undefined },
        );
      case 'COUNTER_UPDATE':
        return new CounterUpdateEvent({
          type,
          data: _entity as Record<string, unknown> | undefined,
        });
      case 'PROFILE_VIEW':
        return new ProfileViewEvent(
          { type, sender: _sender as Record<string, unknown> | undefined },
          { state: this.state ?? undefined },
        );
      default:
        return innerData;
    }
  }

  private reportError(error: unknown) {
    if (this.listenerCount('error') > 0) {
      super.emit('error', error);
    } else {
      console.error('[interpal-js][WebSocket] error:', error);
    }
  }

  /**
   * Returns the auth token used as the `?token=` query parameter.
   *
   * Only `authToken` is valid here — the session cookie is a browser cookie,
   * not a gateway token.  If `authToken` is absent, `connect()` will throw
   * a `WebSocketAuthenticationError` with a clear message.
   */
  private getAuthToken(): string | null {
    return this.auth.exportSession().authToken ?? null;
  }
}
