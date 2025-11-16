/**
 * Custom error hierarchy mirroring the Python library.
 */

export class InterpalError extends Error {
  public readonly statusCode?: number;
  public readonly response?: unknown;

  constructor(message: string, options: { statusCode?: number; response?: unknown } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.response = options.response;
  }
}

export class AuthenticationError extends InterpalError {}

export class APIError extends InterpalError {}

export class RateLimitError extends APIError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, { statusCode: 429 });
    this.retryAfter = retryAfter;
  }
}

export class WebSocketError extends InterpalError {}
export class WebSocketConnectionError extends WebSocketError {}
export class WebSocketTimeoutError extends WebSocketError {}
export class WebSocketAuthenticationError extends WebSocketError {}
export class WebSocketRateLimitError extends WebSocketError {
  public readonly retryAfter?: number;

  constructor(message = 'WebSocket rate limit exceeded', retryAfter?: number) {
    super(message);
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends InterpalError {}
export class NotFoundError extends APIError {}
export class PermissionError extends APIError {}

