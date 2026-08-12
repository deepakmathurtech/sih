// ============================================================
// RIDTP Replay Protection
// Nonce Cache with 300-second sliding window (LAW 3.2)
// ============================================================

import type { NonceCacheEntry } from '../types';

export const REPLAY_WINDOW_SECONDS = 300;

export class NonceCache {
  private cache: Map<string, NonceCacheEntry> = new Map();

  /** Add a nonce to the cache after successful verification */
  add(nonce: string, timestamp: number, envelopeId: string): void {
    this.cache.set(nonce, { nonce, timestamp, envelopeId });
    this.evict();
  }

  /** Check if a nonce has been seen (replay detection) */
  has(nonce: string): boolean {
    return this.cache.has(nonce);
  }

  /** Evict nonces outside the sliding window */
  evict(): void {
    const cutoff = Date.now() - REPLAY_WINDOW_SECONDS * 1000;
    for (const [nonce, entry] of this.cache.entries()) {
      if (entry.timestamp < cutoff) {
        this.cache.delete(nonce);
      }
    }
  }

  /** Get all cached nonces (for UI display) */
  getAll(): NonceCacheEntry[] {
    return Array.from(this.cache.values());
  }

  /** Size of nonce cache */
  size(): number {
    return this.cache.size;
  }

  /** Clear cache (for scenario reset) */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Check if an envelope's timestamp is within the permitted window
 * Returns { valid, skewMs, windowSeconds }
 */
export function checkTimestampWindow(
  envelopeTimestamp: number,
  windowSeconds: number = REPLAY_WINDOW_SECONDS
): { valid: boolean; skewMs: number; windowSeconds: number } {
  const now = Date.now();
  const skewMs = Math.abs(now - envelopeTimestamp);
  const valid = skewMs <= windowSeconds * 1000;
  return { valid, skewMs, windowSeconds };
}

/**
 * Full replay check: nonce + timestamp window
 */
export function checkReplay(
  nonce: string,
  timestamp: number,
  cache: NonceCache
): { passed: boolean; reason?: string; skewMs?: number } {
  // Check nonce
  if (cache.has(nonce)) {
    return { passed: false, reason: 'Nonce already observed. Replay detected.' };
  }

  // Check timestamp window
  const windowCheck = checkTimestampWindow(timestamp);
  if (!windowCheck.valid) {
    return {
      passed: false,
      reason: `Proof timestamp outside permitted window (${windowCheck.windowSeconds}s).`,
      skewMs: windowCheck.skewMs,
    };
  }

  return { passed: true, skewMs: windowCheck.skewMs };
}
