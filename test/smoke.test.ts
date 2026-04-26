import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// normalizeList
// ─────────────────────────────────────────────────────────────────────────────
import { normalizeList } from '../src/utils/normalize.js';

describe('normalizeList', () => {
  it('returns a plain array as-is', () => {
    expect(normalizeList([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('extracts array from wrapper object using default key "results"', () => {
    expect(normalizeList({ results: ['a', 'b'] })).toEqual(['a', 'b']);
  });

  it('extracts array from wrapper object using a custom key', () => {
    expect(normalizeList({ messages: [{ id: '1' }] }, 'messages')).toEqual([{ id: '1' }]);
  });

  it('returns [] for null', () => {
    expect(normalizeList(null)).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(normalizeList(undefined)).toEqual([]);
  });

  it('returns [] when key is missing from object', () => {
    expect(normalizeList({ other: [1, 2] }, 'results')).toEqual([]);
  });

  it('returns [] when value at key is not an array', () => {
    expect(normalizeList({ results: 'not-an-array' })).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseTimestamp
// ─────────────────────────────────────────────────────────────────────────────
import { parseTimestamp } from '../src/utils/time.js';

describe('parseTimestamp', () => {
  it('returns undefined for null', () => {
    expect(parseTimestamp(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(parseTimestamp(undefined)).toBeUndefined();
  });

  it('returns undefined for an invalid string', () => {
    expect(parseTimestamp('not-a-date')).toBeUndefined();
  });

  it('passes a Date instance through unchanged', () => {
    const d = new Date('2024-01-01T00:00:00Z');
    expect(parseTimestamp(d)).toBe(d);
  });

  it('treats a small number as Unix seconds', () => {
    const result = parseTimestamp(1_700_000_000); // ~Nov 2023
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2023);
  });

  it('treats a large number (>1e10) as milliseconds', () => {
    const ms = 1_700_000_000_000; // same moment in ms
    const result = parseTimestamp(ms);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2023);
  });

  it('parses an ISO string', () => {
    const result = parseTimestamp('2024-06-15T12:00:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result!.getUTCFullYear()).toBe(2024);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MessageBuilder
// ─────────────────────────────────────────────────────────────────────────────
import { MessageBuilder } from '../src/builders/MessageBuilder.js';

describe('MessageBuilder', () => {
  it('builds a minimal payload', () => {
    const payload = new MessageBuilder('hello').build();
    expect(payload.message).toBe('hello');
  });

  it('chaining methods return the same instance', () => {
    const builder = new MessageBuilder();
    expect(builder.setContent('hi')).toBe(builder);
    expect(builder.setThreadId('t1')).toBe(builder);
  });

  it('setThreadId appears in payload', () => {
    const payload = new MessageBuilder('hi').setThreadId('t42').build();
    expect(payload.thread_id).toBe('t42');
  });

  it('setGif sets attachment_type to gif', () => {
    const payload = new MessageBuilder().setGif('https://example.com/a.gif').build();
    expect(payload.attachment_type).toBe('gif');
    expect(payload.gif_attachment_url).toBe('https://example.com/a.gif');
  });

  it('setReplyTo appears in payload', () => {
    const payload = new MessageBuilder('reply').setReplyTo('msg-1').build();
    expect(payload.reply_to).toBe('msg-1');
  });

  it('addExtra merges additional keys', () => {
    const payload = new MessageBuilder('x').setExtra({ custom: 'value' }).build();
    expect((payload as Record<string, unknown>).custom).toBe('value');
  });

  it('threadId getter reflects setThreadId', () => {
    const builder = new MessageBuilder().setThreadId('abc');
    expect(builder.threadId).toBe('abc');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Intents
// ─────────────────────────────────────────────────────────────────────────────
import { Intents } from '../src/util/Intents.js';

describe('Intents', () => {
  it('FLAGS has expected keys', () => {
    expect(Intents.FLAGS).toHaveProperty('MESSAGES');
    expect(Intents.FLAGS).toHaveProperty('NOTIFICATIONS');
    expect(Intents.FLAGS).toHaveProperty('TYPING');
  });

  it('ALL includes all flags', () => {
    const allCombined = Object.values(Intents.FLAGS).reduce((a, b) => a | b, 0);
    expect(Intents.ALL).toBe(allCombined);
  });

  it('resolve(number) returns the number', () => {
    expect(Intents.resolve(7)).toBe(7);
  });

  it('resolve(string) returns the matching flag', () => {
    expect(Intents.resolve('MESSAGES')).toBe(Intents.FLAGS.MESSAGES);
  });

  it('resolve(array) combines flags', () => {
    const combined = Intents.FLAGS.MESSAGES | Intents.FLAGS.TYPING;
    expect(Intents.resolve(['MESSAGES', 'TYPING'])).toBe(combined);
  });

  it('has() returns true when flag is set', () => {
    expect(Intents.has(Intents.ALL, 'MESSAGES')).toBe(true);
  });

  it('has() returns false when flag is not set', () => {
    expect(Intents.has(0, 'MESSAGES')).toBe(false);
  });

  it('add() sets a flag', () => {
    const result = Intents.add(0, 'NOTIFICATIONS');
    expect(Intents.has(result, 'NOTIFICATIONS')).toBe(true);
  });

  it('remove() clears a flag', () => {
    const base = Intents.FLAGS.MESSAGES | Intents.FLAGS.NOTIFICATIONS;
    const result = Intents.remove(base, 'NOTIFICATIONS');
    expect(Intents.has(result, 'MESSAGES')).toBe(true);
    expect(Intents.has(result, 'NOTIFICATIONS')).toBe(false);
  });

  it('toArray() lists flag names', () => {
    const arr = Intents.toArray(Intents.FLAGS.MESSAGES | Intents.FLAGS.TYPING);
    expect(arr).toContain('MESSAGES');
    expect(arr).toContain('TYPING');
    expect(arr).not.toContain('NOTIFICATIONS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Collection
// ─────────────────────────────────────────────────────────────────────────────
import { Collection } from '../src/util/Collection.js';

describe('Collection', () => {
  function makeCollection(): Collection<string, number> {
    const c = new Collection<string, number>();
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    return c;
  }

  it('find returns the matching value', () => {
    expect(makeCollection().find((v) => v === 2)).toBe(2);
  });

  it('find returns undefined when nothing matches', () => {
    expect(makeCollection().find((v) => v === 99)).toBeUndefined();
  });

  it('filter returns a Collection of matching entries', () => {
    const filtered = makeCollection().filter((v) => v > 1);
    expect(filtered.size).toBe(2);
    expect(filtered.has('b')).toBe(true);
    expect(filtered.has('c')).toBe(true);
  });

  it('map transforms values', () => {
    expect(makeCollection().map((v) => v * 2)).toEqual([2, 4, 6]);
  });

  it('some returns true when predicate matches', () => {
    expect(makeCollection().some((v) => v === 3)).toBe(true);
  });

  it('every returns false when not all match', () => {
    expect(makeCollection().every((v) => v > 1)).toBe(false);
  });

  it('first() returns the first value', () => {
    expect(makeCollection().first()).toBe(1);
  });

  it('clone produces an independent copy', () => {
    const original = makeCollection();
    const clone = original.clone();
    clone.set('d', 4);
    expect(original.has('d')).toBe(false);
    expect(clone.size).toBe(4);
  });

  it('ensure sets and returns the default when key is missing', () => {
    const c = makeCollection();
    const val = c.ensure('z', () => 99);
    expect(val).toBe(99);
    expect(c.get('z')).toBe(99);
  });
});


