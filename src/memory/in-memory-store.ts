import type { RichMemory, Tag } from '../types.js';
import { MemoryStore, normalizeAntiPattern } from './store.js';

/**
 * In-process MemoryStore backed by a plain array.
 *
 * findSimilar powers dedup for the PoC: two memories match when they share a
 * tag and their anti-patterns are equal after normalization (case/whitespace/
 * punctuation-insensitive).
 */
export class InMemoryStore implements MemoryStore {
  private readonly memories: RichMemory[] = [];

  async add(m: RichMemory): Promise<void> {
    this.memories.push(m);
  }

  async all(): Promise<RichMemory[]> {
    // Return a shallow copy so callers can't mutate internal state.
    return [...this.memories];
  }

  async update(m: RichMemory): Promise<void> {
    const i = this.memories.findIndex((x) => x.id === m.id);
    if (i === -1) {
      throw new Error(`update: memory not found: ${m.id}`);
    }
    this.memories[i] = m;
  }

  async findSimilar(tag: Tag, antiPattern: string): Promise<RichMemory | null> {
    const target = normalizeAntiPattern(antiPattern);
    return (
      this.memories.find(
        (m) => m.tag === tag && normalizeAntiPattern(m.antiPattern) === target,
      ) ?? null
    );
  }
}
