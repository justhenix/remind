import Supermemory from 'supermemory';
import type { RichMemory, Tag } from '../types.js';
import { TAGS } from '../types.js';
import { MemoryStore } from './store.js';
import type { SupermemoryConfig } from '../config/index.js';
import { KeywordEmbedder } from '../recall/keyword-embedder.js';

/**
 * Real adapter for Supermemory Local (on-machine HTTP backend).
 *
 * SDK shapes were confirmed against node_modules/supermemory/*.d.ts:
 *  - Client:  new Supermemory({ apiKey, baseURL })                      (client.d.ts)
 *  - Add:     client.add({ content, containerTag, customId, metadata }) (top-level.d.ts, AddParams)
 *  - Search:  client.search.execute({ q, containerTag, limit }) -> { results: [{ metadata, score }] } (search.d.ts)
 *  - List:    client.documents.list({ containerTags, limit }) -> { memories: [{ metadata }] }          (documents.d.ts)
 *
 * Two-layer model: the human-readable rule goes in `content` (what the vector index
 * matches on); the structured RichMemory fields live in `metadata` so we can rebuild
 * the rule on the way out. `customId = m.id` gives us upsert semantics.
 */

const DEFAULT_CONTAINER_TAG = 'remind';
/** Dedup only when a search hit is confidently the same rule. */
const DEDUP_SCORE_THRESHOLD = 0.6;
/** documents.list is unpaginated here; cap the page for the offline-style all(). */
const LIST_LIMIT = 100;

export interface SupermemoryStoreOptions {
  containerTag?: string;
}

export class SupermemoryLocalStore implements MemoryStore {
  private readonly client: Supermemory;
  private readonly containerTag: string;
  /** Local ranker — see search() for why we don't use Supermemory's vector search. */
  private readonly embedder = new KeywordEmbedder();

  constructor(config: SupermemoryConfig, opts: SupermemoryStoreOptions = {}) {
    // Confirmed: constructor throws if apiKey is undefined, so callers gate on
    // isSupermemoryConfigured() (or catch, as `remind doctor` does).
    this.client = new Supermemory({ apiKey: config.apiKey, baseURL: config.url });
    this.containerTag = opts.containerTag ?? DEFAULT_CONTAINER_TAG;
  }

  async add(m: RichMemory): Promise<void> {
    await this.client.add({
      content: humanReadable(m),
      containerTag: this.containerTag,
      customId: m.id,
      metadata: toMetadata(m),
    });
  }

  async update(m: RichMemory): Promise<void> {
    // Upsert via customId: re-adding with the same customId overwrites the prior doc
    // (AddParams.customId is confirmed in the .d.ts). Chosen over memories.updateMemory
    // because that API keys off content/version chains, while we own a stable id and
    // just need the burn count refreshed.
    await this.add(m);
  }

  /**
   * Rank stored rules locally over `documents.list`, rather than calling
   * `client.search.execute`.
   *
   * Supermemory Local's self-hosted vector search (v0.0.5) returns 0 results even
   * for stored, fully-indexed documents, so we can't rely on it. Instead we list
   * the rules in our container (list works reliably) and score them with the same
   * deterministic KeywordEmbedder the in-memory store uses. The taste pack is small
   * (tens of rules), so listing + local scoring is cheap and, crucially, needs no
   * LLM memory-agent step — recall stays fully local and free.
   */
  async search(
    query: string,
    limit = 8,
  ): Promise<Array<{ memory: RichMemory; score: number }>> {
    const all = await this.all();
    return all
      .map((memory) => ({
        memory,
        score: this.embedder.score(query, `${memory.tag} ${memory.antiPattern} ${memory.fix}`),
      }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async findSimilar(tag: Tag, antiPattern: string): Promise<RichMemory | null> {
    const hits = await this.search(antiPattern, 10);
    const best = hits
      .filter((h) => h.memory.tag === tag && h.score >= DEDUP_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score)[0];
    return best ? best.memory : null;
  }

  async all(): Promise<RichMemory[]> {
    // containerTags is marked @deprecated upstream, but it is the only container filter
    // documents.list exposes (there is no singular containerTag list param), so we use it.
    const res = await this.client.documents.list({
      containerTags: [this.containerTag],
      limit: LIST_LIMIT,
    });
    const memories: RichMemory[] = [];
    for (const doc of res.memories) {
      const memory = fromMetadata(doc.metadata);
      if (memory) {
        memories.push(memory);
      }
    }
    return memories;
  }
}

/** The single-line, index-friendly form stored in `content`. */
function humanReadable(m: RichMemory): string {
  return `${m.antiPattern} -> ${m.fix}`;
}

/** Metadata values must be string | number | boolean | string[] (AddParams). */
function toMetadata(m: RichMemory): Record<string, string | number> {
  const md: Record<string, string | number> = {
    id: m.id,
    tag: m.tag,
    antiPattern: m.antiPattern,
    fix: m.fix,
    burns: m.burns,
    createdAt: m.createdAt,
  };
  if (m.context) {
    md.context = m.context;
  }
  return md;
}

/** Rebuild a RichMemory from stored metadata, or null if it isn't one of ours. */
function fromMetadata(md: unknown): RichMemory | null {
  if (md === null || typeof md !== 'object' || Array.isArray(md)) {
    return null;
  }
  const o = md as Record<string, unknown>;
  const tag = String(o.tag ?? '');
  if (!TAGS.includes(tag as Tag)) {
    return null;
  }
  const id = o.id;
  const antiPattern = o.antiPattern;
  const fix = o.fix;
  if ((typeof id !== 'string' && typeof id !== 'number') || antiPattern == null || fix == null) {
    return null;
  }
  const burns = Number(o.burns);
  return {
    id: String(id),
    tag: tag as Tag,
    antiPattern: String(antiPattern),
    fix: String(fix),
    burns: Number.isFinite(burns) && burns > 0 ? burns : 1,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date(0).toISOString(),
    ...(typeof o.context === 'string' ? { context: o.context } : {}),
  };
}
