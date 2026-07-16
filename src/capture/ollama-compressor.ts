import type { Tag } from '../types.js';
import { Compressed, Compressor } from './compressor.js';

/**
 * Stub Compressor backed by llm-bridge + a local Ollama model.
 *
 * The upstream llm-bridge API is NOT verified (no network access), so this
 * throws until wired against the docs. Do NOT guess request/response shapes.
 */
export class OllamaCompressor implements Compressor {
  // TODO(verify): confirm llm-bridge client + model routing — see docs.md
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async compress(_mistake: string, _tag?: Tag): Promise<Compressed> {
    // TODO(verify): wire llm-bridge + Ollama — see docs.md (github.com/supermemoryai/llm-bridge)
    throw new Error('TODO(verify): wire llm-bridge + Ollama — see docs.md');
  }
}
