import { BaseModel } from './BaseModel.js';
import { parseTimestamp } from '../utils/time.js';

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

export class User extends BaseModel<UserData> {
  id?: string;
  name?: string;
  username?: string;
  country?: string;
  city?: string;
  gender?: string;
  age?: number;
  lastLogin?: Date;
  avatarUrl?: string;

  constructor(data: UserData) {
    super(data);
    this.id = data.id?.toString();
    this.name = data.name as string | undefined;
    this.username = data.username as string | undefined;
    this.country = data.country as string | undefined;
    this.city = data.city as string | undefined;
    this.gender = data.gender as string | undefined;
    this.age = typeof data.age === 'number' ? data.age : undefined;
    this.lastLogin = parseTimestamp(data.last_login);
    this.avatarUrl = (data.avatar_url ?? data.avatar_thumb_medium ?? data.avatar_thumb_small) as string | undefined;
  }
}

