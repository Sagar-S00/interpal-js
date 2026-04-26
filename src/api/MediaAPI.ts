import { Buffer } from 'node:buffer';
import { FormData } from 'undici';
import { BaseAPI } from './BaseAPI.js';
import type { RequestParams } from '../types/index.js';
import type { Photo, Album } from '../types/index.js';

/**
 * @deprecated Use direct HTTP requests or a future MediaManager instead.
 * This class is kept for backward compatibility.
 */
export class MediaAPI extends BaseAPI {
  async uploadPhoto(fileBuffer: ArrayBuffer | Buffer, filename: string, caption?: string): Promise<Photo> {
    const form = new FormData();
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    form.append('file', buffer, filename);
    if (caption) {
      form.append('caption', caption);
    }
    return this.http.post<Photo>('/v1/photo', form);
  }

  async getPhoto(photoId: string): Promise<Photo> {
    return this.http.get<Photo>(`/v1/photo/${photoId}`);
  }

  async deletePhoto(photoId: string): Promise<void> {
    await this.http.delete(`/v1/photo/${photoId}`);
  }

  async getUserPhotos(userId: string, params: RequestParams = {}): Promise<Photo[]> {
    return this.http.get<Photo[]>(`/v1/photo/user/${userId}`, params);
  }

  async getAlbums(userId: string): Promise<Album[]> {
    return this.http.get<Album[]>(`/v1/album/user/${userId}`);
  }

  async createAlbum(name: string, description?: string): Promise<Album> {
    return this.http.post<Album>('/v1/album', { name, description });
  }

  async updateAlbum(albumId: string, payload: Record<string, unknown>): Promise<Album> {
    return this.http.put<Album>(`/v1/album/${albumId}`, payload);
  }

  async deleteAlbum(albumId: string): Promise<void> {
    await this.http.delete(`/v1/album/${albumId}`);
  }
}

