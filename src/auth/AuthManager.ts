import axios, { type AxiosInstance } from 'axios';
import type { LoginResult, SessionPayload } from '../types/index.js';
import { API_BASE_URL, DEFAULT_USER_AGENT } from '../constants.js';
import {
  AuthenticationError,
  ValidationError,
} from '../errors.js';
import { randomUserAgent } from '../utils/randomUserAgent.js';

export class AuthManager {
  private sessionCookie: string | null = null;
  private authToken: string | null = null;
  private botId: string | null = null;
  private readonly userAgent: string;
  private readonly session: AxiosInstance;

  constructor(userAgent: string = DEFAULT_USER_AGENT) {
    this.userAgent = userAgent;
    this.session = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'User-Agent': userAgent,
      },
    });
  }

  async login(username: string, password: string): Promise<LoginResult> {
    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    try {
      const response = await this.session.post(
        '/v1/token',
        new URLSearchParams({
          username,
          password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': randomUserAgent({ base: this.userAgent }),
          },
          withCredentials: true,
        },
      );

      const setCookie = response.headers['set-cookie'] ?? [];
      const cookie = this.findCookie(Array.isArray(setCookie) ? setCookie : [setCookie], 'interpals_sessid');

      if (!cookie) {
        throw new AuthenticationError('Login successful but session cookie not found', { statusCode: 500 });
      }

      this.sessionCookie = cookie;
      this.authToken = response.data?.auth_token ?? response.data?.token ?? null;
      this.botId = this.extractBotId(response.data);

      return {
        sessionCookie: this.sessionCookie,
        authToken: this.authToken,
        botId: this.botId,
        username,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          throw new AuthenticationError('Invalid username or password', { statusCode: 401 });
        }
        if (status === 429) {
          throw new AuthenticationError('Too many login attempts. Please try again later.', { statusCode: 429 });
        }

        throw new AuthenticationError(
          `Login failed with status ${status ?? 'unknown'}`,
          { statusCode: status, response: error.response?.data },
        );
      }

      throw new AuthenticationError(`Network error during login: ${(error as Error).message}`);
    }
  }

  importSession(sessionCookie: string, authToken?: string | null, botId?: string | null): void {
    if (!sessionCookie) {
      throw new ValidationError('Session cookie cannot be empty');
    }

    if (sessionCookie.includes('interpals_sessid=')) {
      const extracted = this.extractFromCookieString(sessionCookie, 'interpals_sessid');
      if (!extracted) {
        throw new ValidationError('Could not extract interpals_sessid from cookie string');
      }
      this.sessionCookie = extracted;
    } else {
      this.sessionCookie = sessionCookie;
    }

    this.authToken = authToken ?? null;
    this.botId = botId ?? null;
  }

  exportSession(): SessionPayload {
    return {
      sessionCookie: this.sessionCookie ?? '',
      authToken: this.authToken,
      botId: this.botId,
    };
  }

  async validateSession(): Promise<boolean> {
    if (!this.sessionCookie) {
      throw new AuthenticationError('No session cookie set');
    }

    try {
      const response = await this.session.get('/v1/account/self', {
        headers: this.getHeaders(),
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
    };

    if (this.sessionCookie) {
      headers.Cookie = `interpals_sessid=${this.sessionCookie}`;
    }

    if (this.authToken) {
      headers['X-Auth-Token'] = this.authToken;
    }

    return headers;
  }

  clearSession(): void {
    this.sessionCookie = null;
    this.authToken = null;
    this.botId = null;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.sessionCookie);
  }

  get botIdentifier(): string | null {
    return this.botId;
  }

  get userAgentString(): string {
    return this.userAgent;
  }

  private extractFromCookieString(cookieString: string, cookieName: string): string | null {
    return (
      cookieString
        .split(';')
        .map((entry) => entry.trim())
        .map((entry) => entry.split('='))
        .find(([name]) => name === cookieName)?.[1] ?? null
    );
  }

  private findCookie(cookies: string[], name: string): string | null {
    for (const cookie of cookies) {
      const value = this.extractFromCookieString(cookie, name);
      if (value) return value;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractBotId(payload: any): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const candidateKeys = ['bot_id', 'botId', 'id', 'uid', 'user_id', 'userId', 'account_id', 'accountId'];

    for (const key of candidateKeys) {
      const value = payload[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }

    const nestedKeys = ['bot', 'user', 'account', 'profile', 'data'];
    for (const nestedKey of nestedKeys) {
      if (payload[nestedKey]) {
        const nestedValue = this.extractBotId(payload[nestedKey]);
        if (nestedValue) {
          return nestedValue;
        }
      }
    }

    return null;
  }
}

