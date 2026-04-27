import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/**
 * Records raw WebSocket gateway frames to a JSONL file so you can discover
 * the exact field names the Interpals server actually sends.
 *
 * ## Usage
 *
 * Pass `discoverPayloads: true` (or a custom file path) in `InterpalClientOptions`:
 *
 * ```ts
 * const client = new InterpalClient({
 *   username: 'me',
 *   password: 'secret',
 *   discoverPayloads: 'gateway-payloads.jsonl', // or just: true
 * });
 * await client.run(); // interact normally, then stop and open the file
 * ```
 *
 * Every raw frame is appended as one JSON line:
 * ```json
 * {"ts":"2026-04-26T12:00:00.000Z","label":"raw_frame","data":{"op":"DISPATCH","t":"THREAD_NEW_MESSAGE","s":1,"d":{...}}}
 * {"ts":"2026-04-26T12:00:01.000Z","label":"unknown_op","data":{"op":99}}
 * ```
 *
 * Inspect the file to learn the real field names, then update
 * `WebSocketClient` accordingly and remove `discoverPayloads` from your config.
 */
export class PayloadDiscovery {
  /** Absolute path of the output JSONL file. */
  readonly filePath: string;

  /** Whether recording is active. */
  readonly enabled: boolean;

  private dirEnsured = false;

  constructor(option?: string | boolean) {
    this.enabled = Boolean(option);
    this.filePath =
      typeof option === 'string' ? resolve(option) : resolve('interpal-payloads.jsonl');
  }

  /**
   * Appends one entry to the JSONL file.
   *
   * Errors are silently swallowed — discovery never interrupts normal operation.
   *
   * @param label - Short tag describing the frame type (e.g. `'raw_frame'`, `'unknown_op'`)
   * @param data  - The raw payload to record
   */
  async record(label: string, data: unknown): Promise<void> {
    if (!this.enabled) return;
    try {
      if (!this.dirEnsured) {
        await mkdir(dirname(this.filePath), { recursive: true });
        this.dirEnsured = true;
      }
      const line = JSON.stringify({ ts: new Date().toISOString(), label, data }) + '\n';
      await appendFile(this.filePath, line, 'utf-8');
    } catch {
      // Discovery must never crash the main process.
    }
  }
}
