import type { RecallResult, RichMemory } from '../types.js';
import type { MemoryStore } from '../memory/store.js';
import { renderCaveman } from '../capture/capture.js';
import { Embedder } from './embedder.js';

/** Approximate token count for a string (~4 chars per token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface RecallOptions {
  /** Max number of rules to return. Default: 8. */
  maxRules?: number;
  /** Approximate token budget for the returned rules. Default: 100. */
  tokenBudget?: number;
}

const DEFAULT_MAX_RULES = 8;
const DEFAULT_TOKEN_BUDGET = 100;

/** Text used for relevance scoring: the searchable parts of a memory. */
function searchableText(m: RichMemory): string {
  return [m.tag, m.antiPattern, m.fix, m.context ?? ''].join(' ');
}

/**
 * Burn weight: rules corrected more often rank higher. burns >= 1 => weight >= 1.
 * relevance * (1 + ln(burns)).
 */
function rank(relevance: number, burns: number): number {
  return relevance * (1 + Math.log(burns));
}

/**
 * Recall known standards relevant to a task context.
 *
 * embed → score each memory → filter zero-relevance → rank by relevance × burn
 * → take top N → trim to the token budget → format as caveman rules.
 * The returned `tokens` is guaranteed <= tokenBudget.
 */
export async function recall(
  store: MemoryStore,
  embedder: Embedder,
  taskContext: string,
  opts: RecallOptions = {},
): Promise<RecallResult> {
  const maxRules = opts.maxRules ?? DEFAULT_MAX_RULES;
  const tokenBudget = opts.tokenBudget ?? DEFAULT_TOKEN_BUDGET;

  const memories = await store.all();

  const scored = memories
    .map((m) => ({ m, relevance: embedder.score(taskContext, searchableText(m)) }))
    .filter((s) => s.relevance > 0)
    .sort((a, b) => rank(b.relevance, b.m.burns) - rank(a.relevance, a.m.burns));

  const rules: string[] = [];
  let tokens = 0;
  for (const { m } of scored) {
    if (rules.length >= maxRules) {
      break;
    }
    const rule = renderCaveman(m);
    const cost = estimateTokens(rule);
    if (tokens + cost > tokenBudget) {
      break;
    }
    rules.push(rule);
    tokens += cost;
  }

  return { rules, tokens };
}
