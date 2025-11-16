import axios, { type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import Bottleneck from 'bottleneck';
import { API_BASE_URL } from '../constants.js';
import { randomUserAgent } from '../utils/randomUserAgent.js';
import {
  APIError,
  AuthenticationError,
  RateLimitError,
} from '../errors.js';
import type { RequestOptions } from '../types/index.js';
import { AuthManager } from '../auth/AuthManager.js';

export interface HttpClientOptions {
  maxRetries?: number;
  minRequestIntervalMs?: number;
}

export class HttpClient {
  private readonly auth: AuthManager;
  private readonly axiosInstance: AxiosInstance;
  private readonly limiter: Bottleneck;

  constructor(auth: AuthManager, options: HttpClientOptions = {}) {
    this.auth = auth;
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30_000,
    });

    axiosRetry(this.axiosInstance, {
      retries: options.maxRetries ?? 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 ||
        error.response?.status === 503,
    });

    this.limiter = new Bottleneck({
      minTime: options.minRequestIntervalMs ?? 1_000,
      maxConcurrent: 1,
    });
  }

  async request<T = unknown>({
    method = 'GET',
    endpoint,
    data,
    params,
    headers,
  }: RequestOptions): Promise<T> {
    const run = async () => {
      const finalHeaders: Record<string, string> = {
        ...this.auth.getHeaders(),
        ...(headers ?? {}),
      };

      if (!finalHeaders['User-Agent'] || finalHeaders['User-Agent'] === this.auth.userAgentString) {
        finalHeaders['User-Agent'] = randomUserAgent({ base: this.auth.userAgentString });
      }

      try {
        console.log('requesting', method, endpoint, data, params, finalHeaders);
        const response = await this.axiosInstance.request<T>({
          method,
          url: endpoint,
          data,
          params,
          headers: finalHeaders,
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          if (status === 401) {
            throw new AuthenticationError('Unauthorized - invalid or expired session', { statusCode: 401 });
          }

          if (status === 429) {
            const retryAfterHeader = error.response?.headers?.['retry-after'];
            const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
            throw new RateLimitError('Rate limit exceeded', retryAfter);
          }

          if (status === 403) {
            throw new APIError('Forbidden - insufficient permissions', {
              statusCode: 403,
              response: error.response?.data,
            });
          }

          if (status === 404) {
            throw new APIError('Resource not found', {
              statusCode: 404,
              response: error.response?.data,
            });
          }

          throw new APIError(
            `API request failed with status ${status ?? 'unknown'}`,
            {
              statusCode: status,
              response: error.response?.data,
            },
          );
        }

        throw error;
      }
    };

    return this.limiter.schedule(run);
  }

  get<T = unknown>(endpoint: string, params?: RequestOptions['params']) {
    return this.request<T>({ method: 'GET', endpoint, params });
  }

  post<T = unknown>(endpoint: string, data?: RequestOptions['data'], headers?: Record<string, string>) {
    return this.request<T>({ method: 'POST', endpoint, data, headers });
  }

  put<T = unknown>(endpoint: string, data?: RequestOptions['data']) {
    return this.request<T>({ method: 'PUT', endpoint, data });
  }

  delete<T = unknown>(endpoint: string) {
    return this.request<T>({ method: 'DELETE', endpoint });
  }
}

