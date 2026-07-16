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
  /**
   * Relevance-ranked semantic search over stored memories. Powers recall for both
   * the offline (keyword) and real (vector) backends, so the recall path is identical.
   * Returns at most `limit` hits sorted by descending relevance, each with its score.
   */
  search(query: string, limit?: number): Promise<Array<{ memory: RichMemory; score: number }>>;
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
