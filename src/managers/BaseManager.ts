import type { InterpalClient } from '../client/InterpalClient.js';
import type { HttpClient } from '../http/HttpClient.js';
import { Collection } from '../util/Collection.js';

/**
 * Abstract base class for all resource managers.
 * Managers are responsible for fetching, caching, and managing specific resource types.
 */
export abstract class BaseManager<K, V> {
  /**
   * Reference to the client that instantiated this manager
   */
  public readonly client: InterpalClient;

  /**
   * The cache for this manager, mapping keys to values
   */
  public readonly cache: Collection<K, V>;

  /**
   * @param client The client that instantiated this manager
   */
  constructor(client: InterpalClient) {
    this.client = client;
    this.cache = new Collection<K, V>();
  }

  /**
   * Gets the HTTP client from the main client
   * @returns The HTTP client instance
   */
  protected get http(): HttpClient {
    return (this.client as any).http;
  }

  /**
   * Resolves a data entry to a data object.
   * @param idOrInstance The id or instance of something in this manager
   * @returns The resolved value from the cache, or null if not found
   */
  resolve(idOrInstance: K | V): V | null {
    if (this.cache.has(idOrInstance as K)) {
      return this.cache.get(idOrInstance as K)!;
    }
    
    // Check if the instance is already a value
    if (this.cache.some((value) => value === idOrInstance)) {
      return idOrInstance as V;
    }
    
    return null;
  }

  /**
   * Resolves a data entry to an ID.
   * @param idOrInstance The id or instance of something in this manager
   * @returns The resolved ID
   */
  resolveId(idOrInstance: K | V): K | null {
    if (this.cache.has(idOrInstance as K)) {
      return idOrInstance as K;
    }
    
    // Try to find the key for this value
    const key = this.cache.findKey((value) => value === idOrInstance);
    return key ?? null;
  }

  /**
   * Adds an item to the cache.
   * @param key The key to cache under
   * @param value The value to cache
   * @param cache Whether to cache the item (defaults to true)
   * @returns The cached value
   */
  protected _add(key: K, value: V, cache = true): V {
    if (cache) {
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * Removes an item from the cache.
   * @param key The key to remove
   * @returns Whether the item was removed
   */
  protected _remove(key: K): boolean {
    return this.cache.delete(key);
  }
}

