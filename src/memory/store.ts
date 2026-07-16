import type { RichMemory, Tag } from '../types.js';

/**
 * Storage abstraction for rich memories.
 *
 * Two implementations exist, so this interface is justified (see conventions.md):
 *  - InMemoryStore   — offline default used by the Phase 1 PoC.
 *  - SupermemoryLocalStore — stub adapter for the real on-machine backend.
 */
export interface MemoryStore {
  add(m: RichMemory): Promise<void>;
  all(): Promise<RichMemory[]>;
  update(m: RichMemory): Promise<void>;
  /** Find an existing memory that is a semantic near-duplicate (drives dedup). */
  findSimilar(tag: Tag, antiPattern: string): Promise<RichMemory | null>;
}

/**
 * Normalize an anti-pattern string for dedup matching:
 * lowercase, strip punctuation, collapse whitespace.
 */
export function normalizeAntiPattern(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
