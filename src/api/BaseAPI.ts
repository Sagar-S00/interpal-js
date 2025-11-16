import type { HttpClient } from '../http/HttpClient.js';
import type { InterpalState } from '../state/InterpalState.js';

export abstract class BaseAPI {
  protected readonly http: HttpClient;
  protected readonly state?: InterpalState;

  constructor(http: HttpClient, state?: InterpalState) {
    this.http = http;
    this.state = state;
  }
}

