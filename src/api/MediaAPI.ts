import { Buffer } from 'node:buffer';
import { FormData } from 'undici';
import { BaseAPI } from './BaseAPI.js';
import type { RequestParams } from '../types/index.js';

export class MediaAPI extends BaseAPI {
  async uploadPhoto(fileBuffer: ArrayBuffer | Buffer, filename: string, caption?: string) {
    const form = new FormData();
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    form.append('file', buffer, filename);
    if (caption) {
      form.append('caption', caption);
    }
    return this.http.post('/v1/photo', form);
  }

  async getPhoto(photoId: string) {
    return this.http.get(`/v1/photo/${photoId}`);
  }

  async deletePhoto(photoId: string) {
    return this.http.delete(`/v1/photo/${photoId}`);
  }

  async getUserPhotos(userId: string, params: RequestParams = {}) {
    return this.http.get(`/v1/photo/user/${userId}`, params);
  }

  async getAlbums(userId: string) {
    return this.http.get(`/v1/album/user/${userId}`);
  }

  async createAlbum(name: string, description?: string) {
    return this.http.post('/v1/album', { name, description });
  }

  async updateAlbum(albumId: string, payload: Record<string, unknown>) {
    return this.http.put(`/v1/album/${albumId}`, payload);
  }

  async deleteAlbum(albumId: string) {
    return this.http.delete(`/v1/album/${albumId}`);
  }
}

