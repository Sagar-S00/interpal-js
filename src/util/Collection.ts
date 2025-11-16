/**
 * A Map with additional utility methods inspired by discord.js Collections.
 * This class extends the native JavaScript Map and provides array-like iteration methods.
 */
export class Collection<K, V> extends Map<K, V> {
  /**
   * Identical to Array.find().
   * Searches for a single item where the given function returns true.
   * @param fn The function to test with (should return boolean)
   * @returns The first matching value, or undefined if no match
   */
  find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }
    return undefined;
  }

  /**
   * Searches for the key of a single item where the given function returns true.
   * @param fn The function to test with (should return boolean)
   * @returns The key of the first matching value, or undefined if no match
   */
  findKey(fn: (value: V, key: K, collection: this) => boolean): K | undefined {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return key;
    }
    return undefined;
  }

  /**
   * Identical to Array.filter().
   * Returns a new collection containing only the items where the function returned true.
   * @param fn The function to test with (should return boolean)
   * @returns A new Collection with the filtered items
   */
  filter(fn: (value: V, key: K, collection: this) => boolean): Collection<K, V> {
    const results = new Collection<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }

  /**
   * Identical to Array.map().
   * Creates an ordered array of the results of running each element in the collection through the function.
   * @param fn Function that produces an element of the new array
   * @returns An array of the mapped values
   */
  map<T>(fn: (value: V, key: K, collection: this) => T): T[] {
    const arr: T[] = [];
    for (const [key, val] of this) {
      arr.push(fn(val, key, this));
    }
    return arr;
  }

  /**
   * Maps each item to another value into a collection. Identical to Array.map().
   * @param fn Function that produces an element of the new collection
   * @returns A new Collection with the mapped values
   */
  mapValues<T>(fn: (value: V, key: K, collection: this) => T): Collection<K, T> {
    const coll = new Collection<K, T>();
    for (const [key, val] of this) {
      coll.set(key, fn(val, key, this));
    }
    return coll;
  }

  /**
   * Identical to Array.some().
   * Checks if there exists an item that passes the test implemented by the provided function.
   * @param fn Function used to test (should return a boolean)
   * @returns True if at least one element passes the test
   */
  some(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return true;
    }
    return false;
  }

  /**
   * Identical to Array.every().
   * Checks if all items pass the test implemented by the provided function.
   * @param fn Function used to test (should return a boolean)
   * @returns True if all elements pass the test
   */
  every(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (!fn(val, key, this)) return false;
    }
    return true;
  }

  /**
   * Identical to Array.reduce().
   * Applies a function against an accumulator and each element in the collection.
   * @param fn Function to execute on each element in the collection
   * @param initialValue Value to use as the first argument to the first call of the function
   * @returns The value that results from the reduction
   */
  reduce<T>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initialValue?: T): T {
    let accumulator: T = initialValue as T;
    let first = initialValue === undefined;

    for (const [key, val] of this) {
      if (first) {
        accumulator = val as unknown as T;
        first = false;
        continue;
      }
      accumulator = fn(accumulator, val, key, this);
    }

    if (first) {
      throw new TypeError('Reduce of empty collection with no initial value');
    }

    return accumulator;
  }

  /**
   * Obtains the first value(s) in this collection.
   * @param count Number of values to obtain from the beginning
   * @returns A single value if no count is provided or an array of values
   */
  first(): V | undefined;
  first(count: number): V[];
  first(count?: number): V | V[] | undefined {
    if (count === undefined) return this.values().next().value;
    if (count < 0) return this.last(count * -1);
    count = Math.min(this.size, count);
    const iter = this.values();
    return Array.from({ length: count }, (): V => iter.next().value as V);
  }

  /**
   * Obtains the first key(s) in this collection.
   * @param count Number of keys to obtain from the beginning
   * @returns A single key if no count is provided or an array of keys
   */
  firstKey(): K | undefined;
  firstKey(count: number): K[];
  firstKey(count?: number): K | K[] | undefined {
    if (count === undefined) return this.keys().next().value;
    if (count < 0) return this.lastKey(count * -1);
    count = Math.min(this.size, count);
    const iter = this.keys();
    return Array.from({ length: count }, (): K => iter.next().value as K);
  }

  /**
   * Obtains the last value(s) in this collection.
   * @param count Number of values to obtain from the end
   * @returns A single value if no count is provided or an array of values
   */
  last(): V | undefined;
  last(count: number): V[];
  last(count?: number): V | V[] | undefined {
    const arr = [...this.values()];
    if (count === undefined) return arr[arr.length - 1];
    if (count < 0) return this.first(count * -1);
    if (!count) return [];
    return arr.slice(-count);
  }

  /**
   * Obtains the last key(s) in this collection.
   * @param count Number of keys to obtain from the end
   * @returns A single key if no count is provided or an array of keys
   */
  lastKey(): K | undefined;
  lastKey(count: number): K[];
  lastKey(count?: number): K | K[] | undefined {
    const arr = [...this.keys()];
    if (count === undefined) return arr[arr.length - 1];
    if (count < 0) return this.firstKey(count * -1);
    if (!count) return [];
    return arr.slice(-count);
  }

  /**
   * Obtains random value(s) from this collection.
   * @param count Number of values to obtain randomly
   * @returns A single value if no count is provided or an array of values
   */
  random(): V | undefined;
  random(count: number): V[];
  random(count?: number): V | V[] | undefined {
    const arr = [...this.values()];
    if (count === undefined) return arr[Math.floor(Math.random() * arr.length)];
    if (!arr.length || !count) return [];
    return Array.from(
      { length: Math.min(count, arr.length) },
      (): V => arr.splice(Math.floor(Math.random() * arr.length), 1)[0]
    );
  }

  /**
   * Obtains random key(s) from this collection.
   * @param count Number of keys to obtain randomly
   * @returns A single key if no count is provided or an array of keys
   */
  randomKey(): K | undefined;
  randomKey(count: number): K[];
  randomKey(count?: number): K | K[] | undefined {
    const arr = [...this.keys()];
    if (count === undefined) return arr[Math.floor(Math.random() * arr.length)];
    if (!arr.length || !count) return [];
    return Array.from(
      { length: Math.min(count, arr.length) },
      (): K => arr.splice(Math.floor(Math.random() * arr.length), 1)[0]
    );
  }

  /**
   * Obtains unique random value(s) from this collection.
   * @param count Number of values to obtain randomly
   * @returns A single value if no count is provided or an array of unique random values
   */
  ensure(key: K, defaultValueGenerator: (key: K, collection: this) => V): V {
    if (this.has(key)) return this.get(key)!;
    const value = defaultValueGenerator(key, this);
    this.set(key, value);
    return value;
  }

  /**
   * Checks if this collection shares identical items with another.
   * @param collection Collection to compare with
   * @returns Whether the collections have identical contents
   */
  equals(collection: Collection<K, V>): boolean {
    if (this === collection) return true;
    if (this.size !== collection.size) return false;
    for (const [key, value] of this) {
      if (!collection.has(key) || collection.get(key) !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Sorts the items of a collection in place and returns it.
   * @param compareFunction Specifies a function that defines the sort order
   * @returns The sorted collection
   */
  sort(compareFunction: (a: V, b: V, keyA?: K, keyB?: K) => number = (a, b) => Number(a > b) - Number(a < b)): this {
    const entries = [...this.entries()];
    entries.sort((a, b) => compareFunction(a[1], b[1], a[0], b[0]));
    this.clear();
    for (const [k, v] of entries) {
      this.set(k, v);
    }
    return this;
  }

  /**
   * Combines this collection with others into a new collection. None of the source collections are modified.
   * @param collections Collections to merge
   * @returns The merged collection
   */
  concat(...collections: Collection<K, V>[]): Collection<K, V> {
    const newColl = this.clone();
    for (const coll of collections) {
      for (const [key, val] of coll) newColl.set(key, val);
    }
    return newColl;
  }

  /**
   * Creates an identical shallow copy of this collection.
   * @returns A new collection with the same entries
   */
  clone(): Collection<K, V> {
    return new Collection<K, V>(this);
  }

  /**
   * Partitions the collection into two collections where the first collection contains items
   * that passed the filter function and the second contains the items that did not.
   * @param fn Function used to test (should return a boolean)
   * @returns A tuple of two collections
   */
  partition(fn: (value: V, key: K, collection: this) => boolean): [Collection<K, V>, Collection<K, V>] {
    const passed = new Collection<K, V>();
    const failed = new Collection<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        passed.set(key, val);
      } else {
        failed.set(key, val);
      }
    }
    return [passed, failed];
  }

  /**
   * Identical to Array.at().
   * Returns the item at a given index, allowing for positive and negative integers.
   * Negative integers count back from the last item in the collection.
   * @param index The index of the element to return
   * @returns The element at the given index or undefined
   */
  at(index: number): V | undefined {
    index = Math.floor(index);
    const arr = [...this.values()];
    return arr.at(index);
  }

  /**
   * Returns the key at a given index, allowing for positive and negative integers.
   * Negative integers count back from the last item in the collection.
   * @param index The index of the key to return
   * @returns The key at the given index or undefined
   */
  keyAt(index: number): K | undefined {
    index = Math.floor(index);
    const arr = [...this.keys()];
    return arr.at(index);
  }

  /**
   * Obtains the value of the given key, or inserts a new value if the key does not exist.
   * @param key The key to get if it exists, or set otherwise
   * @param defaultValue The value to set if the key does not exist
   * @returns The existing value if present, or the default value
   */
  sweep(fn: (value: V, key: K, collection: this) => boolean): number {
    const previousSize = this.size;
    for (const [key, val] of this) {
      if (fn(val, key, this)) this.delete(key);
    }
    return previousSize - this.size;
  }

  /**
   * Identical to Array.forEach(), but returns the collection instead of undefined.
   * @param fn Function to execute for each element
   * @returns The collection
   */
  each(fn: (value: V, key: K, collection: this) => void): this {
    this.forEach(fn as (value: V, key: K, map: Map<K, V>) => void);
    return this;
  }

  /**
   * Runs a function on the collection and returns the collection.
   * @param fn Function to execute
   * @returns The collection
   */
  tap(fn: (collection: this) => void): this {
    fn(this);
    return this;
  }

  /**
   * Converts this collection to a JSON object.
   * @returns The JSON representation
   */
  toJSON(): Record<string, V> {
    const json: Record<string, V> = {};
    for (const [key, value] of this) {
      json[String(key)] = value;
    }
    return json;
  }
}

