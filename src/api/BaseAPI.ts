import type { HttpClient } from '../http/HttpClient.js';
import type { InterpalState } from '../state/InterpalState.js';
import type { InterpalClient } from '../client/InterpalClient.js';

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

