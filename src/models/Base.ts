import type { InterpalClient } from '../client/InterpalClient.js';

/**
 * Base class for all Interpal data models.
 * Provides a common interface and access to the client instance.
 */
export abstract class Base {
  /**
   * Reference to the client that instantiated this model
   */
  public readonly client: InterpalClient;

  /**
   * @param client The client that instantiated this model
   */
  constructor(client: InterpalClient) {
    this.client = client;
  }

  /**
   * Updates this object with new data.
   * @param data The raw data to patch this object with
   * @returns This object for chaining
   */
  abstract _patch(data: any): this;

  /**
   * Converts this object to a plain JSON object.
   * @returns The JSON representation of this object
   */
  abstract toJSON(): Record<string, any>;

  /**
   * When concatenated with a string, this automatically returns the object's name or ID.
   * @returns A string representation of this object
   */
  toString(): string {
    return `[${this.constructor.name}]`;
  }

  /**
   * Returns a shallow clone of this object.
   * @returns A new instance with the same data
   */
  clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  /**
   * Checks if this object is equal to another object.
   * @param other The object to compare with
   * @returns Whether the objects are considered equal
   */
  equals(other: Base): boolean {
    return this === other;
  }
}

