export const API_BASE_URL =
  'https://yes.trl0z2le.workers.dev/proxy?proxyUrl=https://api.interpals.net';

/**
 * Default headers for JSON API requests.
 * Passed as a base when constructing requests with a JSON body.
 */
export const HTTP_DEFAULT_HEADERS: Readonly<Record<string, string>> = {
  'Content-Type': 'application/json',
};

export const DEFAULT_USER_AGENT = 'interpal-js/0.1.0';

export const DEFAULT_SESSION_FILE = '.interpals_session.json';

export const WEBSOCKET_URL = 'wss://api.interpals.net/v1/ws';

