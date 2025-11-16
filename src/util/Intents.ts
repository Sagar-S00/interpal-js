/**
 * Bitfield representing the different gateway intents for the Interpal WebSocket connection.
 * Intents allow you to subscribe only to the events you need, reducing unnecessary data transfer.
 */
export class Intents {
  /**
   * Bitfield flags for each intent category
   */
  static FLAGS = {
    /** Subscribe to message-related events (THREAD_NEW_MESSAGE, etc.) */
    MESSAGES: 1 << 0,
    
    /** Subscribe to typing indicator events (THREAD_TYPING) */
    TYPING: 1 << 1,
    
    /** Subscribe to notification and counter events (COUNTER_UPDATE) */
    NOTIFICATIONS: 1 << 2,
    
    /** Subscribe to profile view events (PROFILE_VIEW) */
    PROFILE_VIEWS: 1 << 3,
    
    /** Subscribe to presence/online status events */
    PRESENCE: 1 << 4,
    
    /** Subscribe to thread/conversation events */
    THREADS: 1 << 5,
    
    /** Subscribe to social interaction events (likes, follows, etc.) */
    SOCIAL: 1 << 6,
  } as const;

  /**
   * All available intents combined
   */
  static ALL = Object.values(Intents.FLAGS).reduce((acc, flag) => acc | flag, 0);

  /**
   * Default intents (messages, notifications, and threads)
   */
  static DEFAULT = Intents.FLAGS.MESSAGES | Intents.FLAGS.NOTIFICATIONS | Intents.FLAGS.THREADS;

  /**
   * Resolves an intent resolvable to a bitfield number
   * @param intents The intent(s) to resolve
   * @returns The resolved bitfield
   */
  static resolve(intents: IntentResolvable): number {
    if (typeof intents === 'number') {
      return intents;
    }

    if (Array.isArray(intents)) {
      return intents.reduce<number>((acc, intent) => {
        const resolved = Intents.resolve(intent);
        return acc | resolved;
      }, 0);
    }

    if (typeof intents === 'string') {
      const flag = Intents.FLAGS[intents as keyof typeof Intents.FLAGS];
      if (flag === undefined) {
        throw new Error(`Unknown intent: ${intents}`);
      }
      return flag;
    }

    throw new Error(`Invalid intent type: ${typeof intents}`);
  }

  /**
   * Checks if a bitfield has a specific intent
   * @param bitfield The bitfield to check
   * @param intent The intent to check for
   * @returns Whether the bitfield has the intent
   */
  static has(bitfield: number, intent: IntentResolvable): boolean {
    const resolved = Intents.resolve(intent);
    return (bitfield & resolved) === resolved;
  }

  /**
   * Adds an intent to a bitfield
   * @param bitfield The current bitfield
   * @param intent The intent to add
   * @returns The new bitfield
   */
  static add(bitfield: number, intent: IntentResolvable): number {
    return bitfield | Intents.resolve(intent);
  }

  /**
   * Removes an intent from a bitfield
   * @param bitfield The current bitfield
   * @param intent The intent to remove
   * @returns The new bitfield
   */
  static remove(bitfield: number, intent: IntentResolvable): number {
    return bitfield & ~Intents.resolve(intent);
  }

  /**
   * Gets an array of intent names from a bitfield
   * @param bitfield The bitfield to decompose
   * @returns Array of intent names
   */
  static toArray(bitfield: number): string[] {
    const intents: string[] = [];
    for (const [name, flag] of Object.entries(Intents.FLAGS)) {
      if ((bitfield & flag) === flag) {
        intents.push(name);
      }
    }
    return intents;
  }
}

/**
 * Type representing values that can be resolved to an intent bitfield
 */
export type IntentResolvable = 
  | number 
  | keyof typeof Intents.FLAGS 
  | (number | keyof typeof Intents.FLAGS)[];

