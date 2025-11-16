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

export interface WebSocketConfig {
  connectTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  pongTimeoutMs?: number;
  reconnectDelayMs?: number;
  intents?: number;
}

type GatewayMessage = {
  op?: string | number;
  t?: string;
  type?: string;
  event?: string;
  s?: number;
  seq?: number;
  offset?: number;
  d?: Record<string, unknown>;
};

const OP = {
  HEARTBEAT: 'HEARTBEAT',
  HEARTBEAT_ACK: 'HEARTBEAT_ACK',
  HELLO: 'HELLO',
  DISPATCH: 'DISPATCH',
  INVALID_SESSION: 'INVALID_SESSION',
} as const;

const PING_INTERVAL_MS = 25_000;
const PONG_TIMEOUT_MS = 8_000;

export class WebSocketClient extends EventEmitter {
  private readonly auth: AuthManager;
  private readonly state: InterpalState | null;
  private readonly connectTimeout: number;
  private pingInterval: number;
  private readonly pongTimeout: number;
  private readonly reconnectDelay: number;
  private readonly intents?: number;

  private ws: WebSocket | null = null;
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;
  private pongTimer?: NodeJS.Timeout;

  private lastSeq = 0;
  private manualClose = false;

  constructor(auth: AuthManager, config: WebSocketConfig = {}, options: { state?: InterpalState | null } = {}) {
    super();
    this.auth = auth;
    this.state = options.state ?? null;

    this.connectTimeout = config.connectTimeoutMs ?? 10_000;
    this.pingInterval = config.heartbeatIntervalMs ?? PING_INTERVAL_MS;
    this.pongTimeout = config.pongTimeoutMs ?? PONG_TIMEOUT_MS;
    this.reconnectDelay = config.reconnectDelayMs ?? 0;
    this.intents = config.intents;
  }

  async connect(): Promise<void> {
    if (!this.auth.isAuthenticated) {
      throw new WebSocketAuthenticationError('Not authenticated');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new WebSocketAuthenticationError('No authentication token available');
    }

    this.manualClose = false;
    let url = `${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`;
    
    // Add intents to URL if specified
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
    if (!this.ws) {
      return;
    }
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
        if (error) {
          reject(new WebSocketError(error.message));
        } else {
          resolve();
        }
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

      ws.on('pong', () => {
        this.resetPongTimer();
      });

      ws.on('message', (raw) => {
        this.handleMessage(raw);
      });

      ws.on('error', (error) => {
        this.reportError(error);
      });

      ws.on('close', (code, reason) => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = undefined;
        }
        this.clearTimers();
        this.ws = null;
        this.emit('disconnect', { code, reason: reason?.toString() });
        if (!this.manualClose) {
          this.scheduleReconnect();
        }
      });
    });
  }

  private startPingLoop() {
    this.clearTimers();
    this.pingTimer = setInterval(() => this.sendPing(), this.pingInterval);
  }

  private sendPing() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.ws.ping();
    } catch {
      // ignore ping errors; termination handled below
    }

    this.resetPongTimer();
  }

  private resetPongTimer() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
    }
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pongTimer = undefined;
      return;
    }

    this.pongTimer = setTimeout(() => {
      this.reportError(new WebSocketTimeoutError('Ping timeout'));
      try {
        this.ws?.terminate();
      } catch {
        // ignore, close handler will reconnect
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
    if (this.reconnectTimer || this.manualClose) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect().catch((error) => {
        this.reportError(new WebSocketConnectionError(error.message));
      });
    }, this.reconnectDelay);
  }

  private handleMessage(raw: WebSocket.Data) {
    // console.log('handleMessage', raw);
    let payload: GatewayMessage;

    try {
      payload = JSON.parse(raw.toString());
      // console.log('payload', payload);
    } catch {
      this.emit('raw', raw);
      return;
    }

    const op = payload.op ?? OP.DISPATCH;
    const event =
      payload.t ??
      payload.type ??
      payload.event ??
      (typeof op === 'string' ? op : undefined) ??
      'unknown';
    const seq = payload.s ?? payload.seq ?? payload.offset;

    if (typeof seq === 'number') {
      if (this.lastSeq && seq !== this.lastSeq + 1) {
        const gap = { expected: this.lastSeq + 1, got: seq };
        this.emit('sequenceGap', gap);
      }
      this.lastSeq = seq;
    }

    switch (op) {
      case OP.HELLO:
        const pingInterval = (payload.d as { heartbeat_interval?: number } | undefined)?.heartbeat_interval;
        if (typeof pingInterval === 'number' && Number.isFinite(pingInterval)) {
          this.pingInterval = pingInterval;
          this.startPingLoop();
        }
        break;
      case OP.HEARTBEAT_ACK:
        this.resetPongTimer();
        break;
      case OP.INVALID_SESSION:
        this.lastSeq = 0;
        break;
      case OP.DISPATCH:
      case 0:
        this.handleEvent(event, ((payload.d ?? payload) as Record<string, unknown>) ?? {});
        break;
      default:
        this.handleEvent(event, ((payload.d ?? payload) as Record<string, unknown>) ?? {});
    }
  }

  private handleEvent(type: string, data: Record<string, unknown>) {
    if (type === 'HEARTBEAT_ACK') {
      this.resetPongTimer();
      return;
    }

    // Emit a generic dispatch event for the client to handle
    this.emit('dispatch', type, data);

    // Also emit the legacy mapped events for backward compatibility
    const eventName = this.mapEvent(type);
    const payload = { ...data, event: type, type };
    const enriched = this.transformPayload(type, payload);
    this.emit(eventName, enriched);
  }

  private getStringField(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  }

  private mapEvent(type: string): string {
    switch (type) {
      case 'THREAD_NEW_MESSAGE':
        return 'message';
      case 'THREAD_TYPING':
        return 'typing';
      case 'COUNTER_UPDATE':
        return 'notification';
      case 'PROFILE_VIEW':
        return 'profileView';
      default:
        return type.toLowerCase();
    }
  }

  private transformPayload(type: string, data: Record<string, unknown>): unknown {
    switch (type) {
      case 'THREAD_NEW_MESSAGE':
        // console.log('THREAD_NEW_MESSAGE', data);
        return new ThreadNewMessageEvent(data, { state: this.state ?? undefined });
      case 'THREAD_TYPING':
        return new ThreadTypingEvent(data, { state: this.state ?? undefined });
      case 'COUNTER_UPDATE':
        return new CounterUpdateEvent(data);
      case 'PROFILE_VIEW':
        return new ProfileViewEvent(data, { state: this.state ?? undefined });
      default:
        return data;
    }
  }

  private reportError(error: unknown) {
    if (this.listenerCount('error') > 0) {
      super.emit('error', error);
    } else {
      console.error('[interpal-js][WebSocket] error:', error);
    }
  }

  private getAuthToken(): string | null {
    const session = this.auth.exportSession();
    return session.authToken ?? session.sessionCookie ?? null;
  }
}

