import type { InterpalClient } from '../client/InterpalClient.js';

/**
 * Base class for all Interpal data models (User, Message, Thread, …).
 *
 * Provides a reference to the client, identity helpers, and enforces a
 * consistent `_patch` / `toJSON` contract across every model class.
 *
 * @typeParam TData - The raw API data shape that this model wraps.
 */
export abstract class Base<TData extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Reference to the client that instantiated this model.
   */
  public readonly client: InterpalClient;

  /** @param client - The client that instantiated this model */
  constructor(client: InterpalClient) {
    this.client = client;
  }

  /**
   * Merges new raw API data into this model instance in-place.
   *
   * @param data - Raw data from the API to merge
   * @returns `this` for method chaining
   */
  abstract _patch(data: TData): this;

  /**
   * Serialises the model to a plain JSON-compatible object.
   *
   * @returns A plain representation of this model
   */
  abstract toJSON(): Record<string, unknown>;

  /**
   * When concatenated with a string, returns a human-readable identifier.
   */
  toString(): string {
    return `[${this.constructor.name}]`;
  }

  /**
   * Returns a shallow clone of this model instance.
   */
  clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  /**
   * Checks referential equality with another model.
   *
   * @param other - The model to compare against
   */
  equals(other: Base): boolean {
    return this === other;
  }
}


