import { BaseAPI } from './BaseAPI.js';
import type { Notification, OnlineUser, PushTokenPayload } from '../types/index.js';

/**
 * @deprecated Use `client.notifications` (NotificationManager) for notifications.
 * This class is kept for backward compatibility.
 */
export class RealtimeAPI extends BaseAPI {
  async getNotifications(limit = 20): Promise<Notification[]> {
    return this.http.get<Notification[]>('/v1/realtime/notification', { limit });
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.http.put(`/v1/realtime/notification/${notificationId}/read`);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.http.put('/v1/realtime/notification/read/all');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.http.delete(`/v1/realtime/notification/${notificationId}`);
  }

  async registerPushToken(payload: PushTokenPayload): Promise<void> {
    await this.http.post('/v1/realtime/push/token', payload);
  }

  async unregisterPushToken(token: string): Promise<void> {
    await this.http.post('/v1/realtime/push/token/remove', { token });
  }

  async getViews(limit = 50): Promise<unknown> {
    return this.http.get('/v1/realtime/views', { limit });
  }

  async resetViewStats(): Promise<void> {
    await this.http.post('/v1/realtime/views/reset');
  }

  async getOnlineUsers(): Promise<OnlineUser[]> {
    return this.http.get<OnlineUser[]>('/v1/realtime/online');
  }
}

