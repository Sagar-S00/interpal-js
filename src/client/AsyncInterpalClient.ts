import { InterpalClient } from './InterpalClient.js';
import type { InterpalClientOptions } from '../types/index.js';

export class AsyncInterpalClient extends InterpalClient {
  private _initialized = false;

  constructor(options: InterpalClientOptions = {}) {
    super(options);
  }

  async run(): Promise<void> {
    if (!this._initialized) {
      await this.initialize();
      this._initialized = true;
    }

    if (
      !this.isAuthenticated &&
      this['options'].autoLogin &&
      this['options'].username &&
      this['options'].password
    ) {
      await this.login(this['options'].username, this['options'].password);
    }

    if (!this.wsClient || !this.wsClient.isConnected) {
      await this.startWebSocket();
    }

    // Keep the process alive while the WebSocket client manages reconnections internally.
    await new Promise<void>(() => {
      /* never resolve */
    });
  }
}

