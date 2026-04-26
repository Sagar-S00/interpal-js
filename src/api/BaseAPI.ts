import type { HttpClient } from '../http/HttpClient.js';
import type { InterpalState } from '../state/InterpalState.js';
import type { InterpalClient } from '../client/InterpalClient.js';

/**
 * Abstract base class for all legacy API endpoint wrappers.
 *
 * @deprecated Use the manager-based API (`client.users`, `client.messages`,
 *   `client.threads`, `client.notifications`) instead. Legacy API classes are
 *   kept for backward compatibility but will not receive new features.
 */
export abstract class BaseAPI {
  protected readonly http: HttpClient;
  protected readonly state?: InterpalState;
  protected readonly client?: InterpalClient;

  constructor(http: HttpClient, state?: InterpalState, client?: InterpalClient) {
    this.http = http;
    this.state = state;
    this.client = client;
  }
}

