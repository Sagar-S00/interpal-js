import { AuthManager } from '../auth/AuthManager.js';
import { SessionManager } from '../session/SessionManager.js';
import { HttpClient } from '../http/HttpClient.js';
import { InterpalState } from '../state/InterpalState.js';
import { UserAPI } from '../api/UserAPI.js';
import { MessagesAPI } from '../api/MessagesAPI.js';
import { SearchAPI } from '../api/SearchAPI.js';
import { MediaAPI } from '../api/MediaAPI.js';
import { SocialAPI } from '../api/SocialAPI.js';
import { RealtimeAPI } from '../api/RealtimeAPI.js';
import { NotificationsAPI } from '../api/NotificationsAPI.js';
import { PostsAPI } from '../api/PostsAPI.js';
import { WebSocketClient } from '../websocket/WebSocketClient.js';
import type { InterpalClientOptions, SessionPayload } from '../types/index.js';
import { DEFAULT_USER_AGENT } from '../constants.js';

export class InterpalClient {
  protected readonly auth: AuthManager;
  protected readonly http: HttpClient;
  protected readonly state: InterpalState;
  protected readonly sessionManager?: SessionManager;
  protected wsClient?: WebSocketClient;

  readonly user: UserAPI;
  readonly messages: MessagesAPI;
  readonly search: SearchAPI;
  readonly media: MediaAPI;
  readonly social: SocialAPI;
  readonly realtime: RealtimeAPI;
  readonly notifications: NotificationsAPI;
  readonly posts: PostsAPI;

  private readonly options: InterpalClientOptions;
  private readonly username?: string;
  private readonly password?: string;

  constructor(options: InterpalClientOptions = {}) {
    this.options = options;
    this.username = options.username;
    this.password = options.password;

    this.auth = new AuthManager(options.userAgent ?? DEFAULT_USER_AGENT);
    this.state = new InterpalState({
      maxMessages: options.maxMessages,
      cacheUsers: options.cacheUsers,
      cacheThreads: options.cacheThreads,
      weakReferences: options.weakReferences,
    });

    this.http = new HttpClient(this.auth);
    this.state.setHttpClient(this.http);

    if (options.persistSession) {
      this.sessionManager = new SessionManager(
        options.sessionFile,
        options.sessionExpirationHours,
      );
    }

    this.user = new UserAPI(this.http, this.state);
    this.messages = new MessagesAPI(this.http, this.state);
    this.search = new SearchAPI(this.http, this.state);
    this.media = new MediaAPI(this.http, this.state);
    this.social = new SocialAPI(this.http, this.state);
    this.realtime = new RealtimeAPI(this.http, this.state);
    this.notifications = new NotificationsAPI(this.http, this.state);
    this.posts = new PostsAPI(this.http, this.state);
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

  async startWebSocket(): Promise<void> {
    if (!this.wsClient) {
      this.wsClient = new WebSocketClient(this.auth, {}, { state: this.state });
    }
    await this.wsClient.connect();
  }

  async stopWebSocket(): Promise<void> {
    if (!this.wsClient) return;
    await this.wsClient.disconnect();
  }

  isWebSocketConnected(): boolean {
    return Boolean(this.wsClient?.isConnected);
  }

  async readMessage(threadId: string, messageId: string): Promise<void> {
    await this.messages.readMessage(threadId, messageId);
  }
}

