import { describe, it, expect } from 'vitest';
import type { RichMemory } from '../src/types.js';
import { InMemoryStore } from '../src/memory/in-memory-store.js';
import { TemplateCompressor } from '../src/capture/template-compressor.js';
import { capture, renderCaveman } from '../src/capture/capture.js';
import { KeywordEmbedder } from '../src/recall/keyword-embedder.js';
import { recall } from '../src/recall/recall.js';
import { seed } from '../src/starter/pack.js';

const embedder = new KeywordEmbedder();

async function freshStore(): Promise<InMemoryStore> {
  const store = new InMemoryStore();
  return store;
}

describe('recall over the starter pack', () => {
  it('returns a relevant rule and stays within the token budget', async () => {
    const store = await freshStore();
    await seed(store);

    const result = await recall(store, embedder, 'styling a react component');

    expect(result.rules.length).toBeGreaterThan(0);
    // The UI styling rule should be the most relevant hit.
    expect(result.rules[0]).toContain('[UI]');
    expect(result.rules[0]).toContain('use design tokens');
    expect(result.tokens).toBeLessThanOrEqual(100);
  });
});

describe('capture + dedup', () => {
  it('creates a rule, then increments burns on a near-duplicate', async () => {
    const store = await freshStore();
    const compressor = new TemplateCompressor();

    const first = await capture(
      store,
      compressor,
      "commit message 'fix stuff' → use conventional commits",
      'COMMIT',
    );
    expect(first.burns).toBe(1);
    expect(first.caveman).toContain('[COMMIT]');
    expect(first.caveman).toContain('(×1)');

    // Near-duplicate: different case + punctuation, same meaning.
    const second = await capture(
      store,
      compressor,
      'Commit message: fix stuff -> use conventional commits!!',
      'COMMIT',
    );
    expect(second.id).toBe(first.id);
    expect(second.burns).toBe(2);
    expect(second.caveman).toContain('(×2)');

    // Only one rule should exist after dedup.
    const all = await store.all();
    expect(all).toHaveLength(1);
  });
});

describe('burn weight affects ranking', () => {
  it('ranks a high-burn rule above an equally-relevant low-burn rule', async () => {
    const store = await freshStore();
    const compressor = new TemplateCompressor();

    // Build a high-burn rule via repeated capture (1 -> 3).
    await capture(store, compressor, 'slow endpoint → add caching', 'PERF');
    await capture(store, compressor, 'slow endpoint → add caching', 'PERF');
    const high = await capture(store, compressor, 'slow endpoint → add caching', 'PERF');
    expect(high.burns).toBe(3);

    // Add an equally-relevant competitor with the same text but burns = 1.
    const competitor: RichMemory = {
      id: 'competitor',
      tag: 'PERF',
      antiPattern: 'slow endpoint',
      fix: 'add caching',
      burns: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    await store.add(competitor);

    const result = await recall(store, embedder, 'slow endpoint');

    expect(result.rules[0]).toContain('(×3)');
    expect(result.rules.indexOf(renderCaveman(competitor))).toBeGreaterThan(0);
  });
});

describe('TemplateCompressor', () => {
  it('splits an arrow input into a non-empty antiPattern and fix', async () => {
    const compressor = new TemplateCompressor();
    const out = await compressor.compress('inline styles → use design tokens', 'UI');

    expect(out.tag).toBe('UI');
    expect(out.antiPattern).toBe('inline styles');
    expect(out.fix).toBe('use design tokens');
    expect(out.fix.length).toBeGreaterThan(0);
  });

  it('always produces a non-empty fix, even without an arrow', async () => {
    const compressor = new TemplateCompressor();
    const out = await compressor.compress('vague commit message', 'COMMIT');

    expect(out.antiPattern.length).toBeGreaterThan(0);
    expect(out.fix.length).toBeGreaterThan(0);
  });
});

describe('token budget', () => {
  it('caps returned rules within the ~100 token budget even with many rules', async () => {
    const store = await freshStore();
    for (let i = 0; i < 50; i++) {
      await store.add({
        id: `perf-${i}`,
        tag: 'PERF',
        antiPattern: `slow query ${i}`,
        fix: 'add an index',
        context: 'database performance latency',
        burns: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
      });
    }

    const result = await recall(store, embedder, 'slow database query performance');

    expect(result.tokens).toBeLessThanOrEqual(100);
    expect(result.rules.length).toBeLessThan(50);
  });
});
