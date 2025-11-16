import { EventEmitter } from 'node:events';
import { AuthManager } from '../auth/AuthManager.js';
import { SessionManager } from '../session/SessionManager.js';
import { HttpClient } from '../http/HttpClient.js';
import { InterpalState } from '../state/InterpalState.js';
import { WebSocketClient } from '../websocket/WebSocketClient.js';
import { UserManager } from '../managers/UserManager.js';
import { MessageManager } from '../managers/MessageManager.js';
import { ThreadManager } from '../managers/ThreadManager.js';
import { NotificationManager } from '../managers/NotificationManager.js';
import type { InterpalClientOptions, SessionPayload } from '../types/index.js';
import { DEFAULT_USER_AGENT } from '../constants.js';
import { Intents } from '../util/Intents.js';

// Legacy API imports for backward compatibility
import { SearchAPI } from '../api/SearchAPI.js';
import { MediaAPI } from '../api/MediaAPI.js';
import { SocialAPI } from '../api/SocialAPI.js';
import { RealtimeAPI } from '../api/RealtimeAPI.js';
import { PostsAPI } from '../api/PostsAPI.js';

/**
 * The main client for interacting with Interpal.
 * Extends EventEmitter to provide event-driven architecture.
 */
export class InterpalClient extends EventEmitter {
  protected readonly auth: AuthManager;
  protected readonly http: HttpClient;
  protected readonly state: InterpalState;
  protected readonly sessionManager?: SessionManager;
  protected wsClient?: WebSocketClient;

  // New manager-based API (v2)
  readonly users: UserManager;
  readonly messages: MessageManager;
  readonly threads: ThreadManager;
  readonly notifications: NotificationManager;

  // Legacy API endpoints (for backward compatibility)
  readonly search: SearchAPI;
  readonly media: MediaAPI;
  readonly social: SocialAPI;
  readonly realtime: RealtimeAPI;
  readonly posts: PostsAPI;

  private readonly options: InterpalClientOptions;
  private readonly username?: string;
  private readonly password?: string;
  private readonly intents: number;

  constructor(options: InterpalClientOptions = {}) {
    super();
    
    this.options = options;
    this.username = options.username;
    this.password = options.password;

    // Resolve intents
    if (options.intents !== undefined) {
      this.intents = Intents.resolve(options.intents);
    } else {
      this.intents = Intents.DEFAULT;
    }

    this.auth = new AuthManager(options.userAgent ?? DEFAULT_USER_AGENT);
    this.state = new InterpalState({
      maxMessages: options.maxMessages,
      cacheUsers: options.cacheUsers,
      cacheThreads: options.cacheThreads,
      weakReferences: options.weakReferences,
    });

    this.http = new HttpClient(this.auth);
    this.state.setHttpClient(this.http);
    this.state.setClient(this);

    if (options.persistSession) {
      this.sessionManager = new SessionManager(
        options.sessionFile,
        options.sessionExpirationHours,
      );
    }

    // Initialize new managers
    this.users = new UserManager(this);
    this.messages = new MessageManager(this);
    this.threads = new ThreadManager(this);
    this.notifications = new NotificationManager(this);

    // Initialize legacy APIs
    this.search = new SearchAPI(this.http, this.state, this);
    this.media = new MediaAPI(this.http, this.state, this);
    this.social = new SocialAPI(this.http, this.state, this);
    this.realtime = new RealtimeAPI(this.http, this.state, this);
    this.posts = new PostsAPI(this.http, this.state, this);
  }

  async initialize(): Promise<void> {
    if (this.sessionManager) {
      const savedSession = await this.sessionManager.loadSession();
      if (savedSession) {
        this.auth.importSession(savedSession.sessionCookie, savedSession.authToken, savedSession.botId);
        const isValid = await this.auth.validateSession();
        if (isValid) {
          return;
        }
        await this.sessionManager.clearSession();
      }
    }

    if (this.options.sessionCookie) {
      this.auth.importSession(this.options.sessionCookie, this.options.authToken);
    }

    if (this.options.autoLogin && this.username && this.password) {
      await this.login();
    }
  }

  async login(username?: string, password?: string): Promise<SessionPayload> {
    const user = username ?? this.username;
    const pwd = password ?? this.password;
    if (!user || !pwd) {
      throw new Error('Username and password required for login');
    }

    const session = await this.auth.login(user, pwd);
    if (this.sessionManager) {
      await this.sessionManager.saveSession({
        sessionCookie: session.sessionCookie,
        authToken: session.authToken,
        botId: session.botId,
        username: user,
      });
    }

    return session;
  }

  importSession(sessionCookie: string, authToken?: string | null, botId?: string | null): void {
    this.auth.importSession(sessionCookie, authToken, botId);
  }

  exportSession(): SessionPayload {
    return this.auth.exportSession();
  }

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated;
  }

  /**
   * Connects to the Interpal WebSocket gateway.
   * Events from the gateway will be emitted on this client.
   */
  async connect(): Promise<void> {
    if (!this.wsClient) {
      this.wsClient = new WebSocketClient(this.auth, { intents: this.intents }, { state: this.state });
      this._setupWebSocketListeners();
    }
    await this.wsClient.connect();
  }

  /**
   * Disconnects from the WebSocket gateway.
   */
  async disconnect(): Promise<void> {
    if (!this.wsClient) return;
    await this.wsClient.disconnect();
  }

  /**
   * Checks if the WebSocket is connected.
   */
  get isConnected(): boolean {
    return Boolean(this.wsClient?.isConnected);
  }

  /**
   * Sets up event listeners for the WebSocket client.
   * This proxies WebSocket events to the InterpalClient for the developer.
   * @private
   */
  private _setupWebSocketListeners(): void {
    if (!this.wsClient) return;

    // Lifecycle events
    this.wsClient.on('ready', () => {
      this.emit('ready');
    });

    this.wsClient.on('disconnect', (data) => {
      this.emit('disconnect', data);
    });

    this.wsClient.on('error', (error) => {
      this.emit('error', error);
    });

    this.wsClient.on('sequenceGap', (gap) => {
      this.emit('sequenceGap', gap);
    });

    // Raw event for debugging
    this.wsClient.on('raw', (data) => {
      this.emit('raw', data);
    });

    // Dispatch event - central handler for all gateway events
    this.wsClient.on('dispatch', (event, data) => {
      this._handleDispatch(event, data);
    });

    // Legacy event mappings for backward compatibility
    this.wsClient.on('message', (data) => {
      this.emit('message', data);
    });

    this.wsClient.on('typing', (data) => {
      this.emit('typing', data);
    });

    this.wsClient.on('notification', (data) => {
      this.emit('notification', data);
    });

    this.wsClient.on('profileView', (data) => {
      this.emit('profileView', data);
    });
  }

  /**
   * Handles dispatch events from the WebSocket.
   * This method processes raw events and calls appropriate managers.
   * @param event The event type
   * @param data The event data
   * @private
   */
  private _handleDispatch(event: string, data: any): void {
    try {
      switch (event) {
        case 'THREAD_NEW_MESSAGE':
          const message = this.messages._handleMessageCreate(data);
          this.emit('messageCreate', message);
          break;

        case 'THREAD_TYPING':
          this.emit('typingStart', data);
          break;

        case 'COUNTER_UPDATE':
          this.emit('notificationUpdate', data);
          break;

        case 'PROFILE_VIEW':
          this.emit('profileView', data);
          break;

        default:
          // Emit unknown events with their raw data
          this.emit(event.toLowerCase(), data);
      }
    } catch (error) {
      this.emit('error', new Error(`Error handling dispatch event ${event}: ${error}`));
    }
  }

  // Legacy methods for backward compatibility

  /**
   * @deprecated Use connect() instead
   */
  async startWebSocket(): Promise<void> {
    return this.connect();
  }

  /**
   * @deprecated Use disconnect() instead
   */
  async stopWebSocket(): Promise<void> {
    return this.disconnect();
  }

  /**
   * @deprecated Use isConnected property instead
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * @deprecated Use messages.markAsRead() instead
   */
  async readMessage(threadId: string, messageId: string): Promise<void> {
    await this.messages.markAsRead(threadId, messageId);
  }
}
