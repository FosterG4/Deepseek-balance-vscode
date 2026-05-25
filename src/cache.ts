/**
 * In-memory cache for DeepSeek balance data with staleness tracking.
 * Prevents redundant API calls and preserves data across refresh cycles.
 */

import type { BalanceResponse } from './deepseekApi';

interface CacheEntry<T> {
  data: T;
  lastFetchedAt: number;
  isStale: boolean;
}

export class BalanceCache {
  private entry: CacheEntry<BalanceResponse> | null = null;
  private fetching = false;

  /**
   * Returns cached balance data, or `null` if no cache exists.
   */
  get(): BalanceResponse | null {
    return this.entry?.data ?? null;
  }

  /**
   * Store new balance data with the current timestamp.
   */
  set(data: BalanceResponse): void {
    this.entry = {
      data,
      lastFetchedAt: Date.now(),
      isStale: false,
    };
  }

  /**
   * Mark the cached data as stale (e.g. after a failed refresh).
   * The stale data is still displayed but the tooltip warns the user.
   */
  markStale(): void {
    if (this.entry) {
      this.entry.isStale = true;
    }
  }

  /**
   * Clear the cache entirely.
   */
  clear(): void {
    this.entry = null;
  }

  /**
   * Check whether the cached entry has exceeded the given TTL (ms).
   */
  isExpired(ttlMs: number): boolean {
    if (!this.entry) return true;
    return Date.now() - this.entry.lastFetchedAt >= ttlMs;
  }

  /**
   * Whether a fetch is currently in-flight.
   */
  isFetchingInProgress(): boolean {
    return this.fetching;
  }

  /**
   * Atomically set or release the fetching lock.
   */
  setFetching(v: boolean): void {
    this.fetching = v;
  }

  /**
   * Return the timestamp of the last successful fetch, or `null`.
   */
  getLastFetchedAt(): number | null {
    return this.entry?.lastFetchedAt ?? null;
  }

  /**
   * Whether the cached entry has been marked stale.
   */
  isStale(): boolean {
    return this.entry?.isStale ?? false;
  }

  /**
   * Whether cache exists (has data).
   */
  hasData(): boolean {
    return this.entry !== null;
  }
}
