import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DEFAULT_SESSION_FILE } from '../constants.js';
import type { SessionInfo, SessionPayload, SessionPersistencePayload } from '../types/index.js';

export class SessionManager {
  private readonly sessionFile: string;
  private readonly expirationHours: number;

  constructor(sessionFile = DEFAULT_SESSION_FILE, expirationHours = 24) {
    this.sessionFile = resolve(sessionFile);
    this.expirationHours = expirationHours;
  }

  async saveSession(payload: SessionPayload & { username?: string }): Promise<void> {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.expirationHours * 60 * 60 * 1000);

    const data: SessionPersistencePayload = {
      sessionCookie: payload.sessionCookie,
      authToken: payload.authToken,
      botId: payload.botId,
      username: payload.username,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await fs.mkdir(dirname(this.sessionFile), { recursive: true });
    await fs.writeFile(this.sessionFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  async loadSession(): Promise<SessionPersistencePayload | null> {
    try {
      const raw = await fs.readFile(this.sessionFile, 'utf-8');
      const payload = JSON.parse(raw) as SessionPersistencePayload;
      if (this.isExpired(payload)) {
        await this.clearSession();
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }

  async clearSession(): Promise<void> {
    try {
      await fs.unlink(this.sessionFile);
    } catch {
      // ignore
    }
  }

  isExpired(payload: SessionPersistencePayload): boolean {
    const expires = new Date(payload.expiresAt);
    return Number.isNaN(expires.getTime()) || Date.now() >= expires.getTime();
  }

  async getSessionInfo(): Promise<SessionInfo | null> {
    const data = await this.loadSession();
    if (!data) return null;

    const createdAt = new Date(data.createdAt);
    const expiresAt = new Date(data.expiresAt);
    const now = Date.now();
    const timeRemainingMs = Math.max(0, expiresAt.getTime() - now);

    return {
      username: data.username ?? undefined,
      botId: data.botId ?? undefined,
      createdAt,
      expiresAt,
      timeRemainingMs,
      isExpired: this.isExpired(data),
    };
  }
}

