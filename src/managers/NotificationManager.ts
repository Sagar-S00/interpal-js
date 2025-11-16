import { BaseManager } from './BaseManager.js';
import type { InterpalClient } from '../client/InterpalClient.js';

export interface Notification {
  id?: string;
  [key: string]: unknown;
}

/**
 * Manages notification data and operations.
 */
export class NotificationManager extends BaseManager<string, Notification> {
  constructor(client: InterpalClient) {
    super(client);
  }

  /**
   * Fetches notifications.
   * @param options Fetch options
   * @returns Array of notifications
   */
  async fetch(options: { limit?: number; offset?: number } = {}): Promise<Notification[]> {
    const { limit = 20, offset = 0 } = options;
    const data = await this.http.get<Notification[]>('/v1/notification', { limit, offset });
    return Array.isArray(data) ? data : [];
  }

  /**
   * Marks a notification as read.
   * @param notificationId The ID of the notification
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.http.put(`/v1/notification/${notificationId}/read`);
  }

  /**
   * Marks all notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    await this.http.put('/v1/notification/read/all');
  }

  /**
   * Deletes a notification.
   * @param notificationId The ID of the notification
   */
  async delete(notificationId: string): Promise<void> {
    await this.http.delete(`/v1/notification/${notificationId}`);
    this._remove(notificationId);
  }
}

