import { BaseAPI } from './BaseAPI.js';

export class NotificationsAPI extends BaseAPI {
  async getNotifications(limit = 20, offset = 0) {
    return this.http.get('/v1/notification', { limit, offset });
  }

  async markNotificationRead(notificationId: string) {
    return this.http.put(`/v1/notification/${notificationId}/read`);
  }

  async markAllRead() {
    return this.http.put('/v1/notification/read/all');
  }

  async deleteNotification(notificationId: string) {
    return this.http.delete(`/v1/notification/${notificationId}`);
  }
}

