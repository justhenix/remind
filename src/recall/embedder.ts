/**
 * Relevance scorer between a query and a candidate text.
 *
 * Interface justified because a real embedding-backed implementation will be
 * added later (Supermemory Local); the offline default is KeywordEmbedder.
 */
export interface Embedder {
  /** Relevance score in [0, 1]. */
  score(query: string, text: string): number;
}
