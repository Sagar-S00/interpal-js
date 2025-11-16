import { Base } from './Base.js';
import { parseTimestamp } from '../utils/time.js';
import type { InterpalClient } from '../client/InterpalClient.js';

export interface UserData {
  id?: string | number;
  name?: string;
  username?: string;
  country?: string;
  city?: string;
  gender?: string;
  age?: number;
  last_login?: string | number | Date;
  avatar_url?: string;
  avatar_thumb_small?: string;
  avatar_thumb_medium?: string;
  avatar_thumb_large?: string;
  [key: string]: unknown;
}

export class User extends Base {
  id?: string;
  name?: string;
  username?: string;
  country?: string;
  city?: string;
  gender?: string;
  age?: number;
  lastLogin?: Date;
  avatarUrl?: string;
  isSelf = false;

  private _rawData: UserData;

  constructor(client: InterpalClient, data: UserData) {
    super(client);
    this._rawData = data;
    this._patch(data);
  }

  _patch(data: UserData): this {
    this._rawData = { ...this._rawData, ...data };
    
    if (data.id !== undefined) this.id = data.id?.toString();
    if (data.name !== undefined) this.name = data.name as string | undefined;
    if (data.username !== undefined) this.username = data.username as string | undefined;
    if (data.country !== undefined) this.country = data.country as string | undefined;
    if (data.city !== undefined) this.city = data.city as string | undefined;
    if (data.gender !== undefined) this.gender = data.gender as string | undefined;
    if (data.age !== undefined) this.age = typeof data.age === 'number' ? data.age : undefined;
    if (data.last_login !== undefined) this.lastLogin = parseTimestamp(data.last_login);
    if (data.avatar_url !== undefined || data.avatar_thumb_medium !== undefined || data.avatar_thumb_small !== undefined) {
      this.avatarUrl = (data.avatar_url ?? data.avatar_thumb_medium ?? data.avatar_thumb_small) as string | undefined;
    }

    return this;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      country: this.country,
      city: this.city,
      gender: this.gender,
      age: this.age,
      lastLogin: this.lastLogin?.toISOString(),
      avatarUrl: this.avatarUrl,
    };
  }

  toString(): string {
    return this.username ?? this.name ?? `User${this.id ? `[${this.id}]` : ''}`;
  }

  /**
   * Fetches the latest data for this user from the API.
   * @returns This user with updated data
   */
  async fetch(): Promise<this> {
    if (!this.id) {
      throw new Error('Cannot fetch a user without an ID');
    }
    const updated = await this.client.users.fetch(this.id, { force: true });
    this._patch(updated._rawData);
    return this;
  }
}

