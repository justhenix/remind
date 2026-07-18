import { Embedder } from './embedder.js';

/** Minimal stopword list, high-frequency words that add noise, not signal. */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'and', 'or', 'for', 'with',
  'is', 'are', 'it', 'as', 'at', 'by', 'be', 'this', 'that',
]);

/** Light stemmer: strip a common trailing suffix so "styles"/"styling" align. */
function stem(word: string): string {
  for (const suffix of ['ing', 'ed', 'es', 's']) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/** Tokenize: lowercase, split on non-alphanumerics, drop stopwords, stem. */
function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
    .map(stem);
  return new Set(tokens);
}

/**
 * Offline, deterministic Embedder using Jaccard token overlap.
 *
 * score = |query ∩ text| / |query ∪ text|, computed over stemmed tokens.
 * No external dependencies, fully reproducible.
 */
export class KeywordEmbedder implements Embedder {
  score(query: string, text: string): number {
    const a = tokenize(query);
    const b = tokenize(text);
    if (a.size === 0 || b.size === 0) {
      return 0;
    }

    let intersection = 0;
    for (const token of a) {
      if (b.has(token)) {
        intersection++;
      }
    }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
}
