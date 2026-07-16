import type { Tag } from '../types.js';

/** A compressed correction: the essential parts of a caveman rule. */
export interface Compressed {
  tag: Tag;
  antiPattern: string;
  fix: string;
}

/**
 * Compresses a free-text correction into { tag, antiPattern, fix }.
 *
 * Two implementations exist, so this interface is justified:
 *  - TemplateCompressor — offline, deterministic (default + LLM fallback).
 *  - LlmCompressor      — OpenAI-compatible model (gemini/bai/ollama/openai) via config.
 */
export interface Compressor {
  compress(mistake: string, tag?: Tag): Promise<Compressed>;
}
