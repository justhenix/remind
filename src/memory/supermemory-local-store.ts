import type { RichMemory, Tag } from '../types.js';
import { MemoryStore } from './store.js';

/**
 * Stub adapter for Supermemory Local (on-machine HTTP backend).
 *
 * The real endpoint shapes are NOT verified here — no network access and the
 * upstream API is unconfirmed. Every method throws until wired against the docs.
 * Do NOT guess request/response shapes beyond the placeholder below.
 */
export class SupermemoryLocalStore implements MemoryStore {
  // TODO(verify): confirm base URL + auth against https://supermemory.ai/docs/quickstart
  constructor(private readonly baseUrl: string) {}

  async add(_m: RichMemory): Promise<void> {
    // TODO(verify): POST rich memory + embedding — see https://supermemory.ai/docs/add-memories
    throw new Error(
      'TODO(verify): wire Supermemory Local — see https://supermemory.ai/docs/add-memories and /search',
    );
  }

  async all(): Promise<RichMemory[]> {
    // TODO(verify): list/search all memories — see https://supermemory.ai/docs/search
    throw new Error(
      'TODO(verify): wire Supermemory Local — see https://supermemory.ai/docs/add-memories and /search',
    );
  }

  async update(_m: RichMemory): Promise<void> {
    // TODO(verify): update memory (burn increment) — see https://supermemory.ai/docs/add-memories
    throw new Error(
      'TODO(verify): wire Supermemory Local — see https://supermemory.ai/docs/add-memories and /search',
    );
  }

  async findSimilar(_tag: Tag, _antiPattern: string): Promise<RichMemory | null> {
    // TODO(verify): vector search for near-duplicate — see https://supermemory.ai/docs/search
    throw new Error(
      'TODO(verify): wire Supermemory Local — see https://supermemory.ai/docs/add-memories and /search',
    );
  }
}
