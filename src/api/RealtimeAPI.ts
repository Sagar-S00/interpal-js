import { BaseAPI } from './BaseAPI.js';

export class RealtimeAPI extends BaseAPI {
  async getNotifications(limit = 20) {
    return this.http.get('/v1/realtime/notification', { limit });
  }

  async markNotificationRead(notificationId: string) {
    return this.http.put(`/v1/realtime/notification/${notificationId}/read`);
  }

  async markAllNotificationsRead() {
    return this.http.put('/v1/realtime/notification/read/all');
  }

  async deleteNotification(notificationId: string) {
    return this.http.delete(`/v1/realtime/notification/${notificationId}`);
  }

  async registerPushToken(token: string, device: string, platform: string) {
    return this.http.post('/v1/realtime/push/token', { token, device, platform });
  }

  async unregisterPushToken(token: string) {
    return this.http.post('/v1/realtime/push/token/remove', { token });
  }

  async getViews(limit = 50) {
    return this.http.get('/v1/realtime/views', { limit });
  }

  async resetViewStats() {
    return this.http.post('/v1/realtime/views/reset');
  }

  async getOnlineUsers() {
    return this.http.get('/v1/realtime/online');
  }
}

