import OpenAI from 'openai';
import type { Tag } from '../types.js';
import { TAGS } from '../types.js';
import { Compressed, Compressor } from './compressor.js';
import { TemplateCompressor } from './template-compressor.js';
import type { LlmConfig } from '../config/index.js';

/**
 * Minimal shape of the openai chat client we depend on. Declared here (rather than
 * importing OpenAI's types) so unit tests can inject a mock without any network.
 */
export interface ChatCompletionCreate {
  (body: {
    model: string;
    messages: Array<{ role: 'system' | 'user'; content: string }>;
    temperature?: number;
  }): Promise<{ choices: Array<{ message?: { content?: string | null } }> }>;
}

export interface OpenAiLike {
  chat: { completions: { create: ChatCompletionCreate } };
}

export interface LlmCompressorOptions {
  /** Inject a mock client in tests; omit to build a real openai client from config. */
  client?: OpenAiLike;
  /** Used when the LLM call fails or returns something unusable. */
  fallback?: Compressor;
}

const SYSTEM_PROMPT = [
  'You compress a developer correction into ONE "caveman" coding rule.',
  'Reply with STRICT JSON only: {"tag": "...", "antiPattern": "...", "fix": "..."}.',
  `"tag" MUST be exactly one of: ${TAGS.join(', ')}.`,
  '"antiPattern" is the bad habit; "fix" is the concrete correct action.',
  '"fix" is MANDATORY and must be concrete (never empty, never vague like "be better").',
  'Keep antiPattern + fix under ~12 words total. No markdown, no code fences, no prose.',
].join(' ');

export class LlmCompressor implements Compressor {
  private readonly create: ChatCompletionCreate;
  private readonly model: string;
  private readonly fallback: Compressor;

  constructor(config: LlmConfig, opts: LlmCompressorOptions = {}) {
    this.model = config.model ?? '';
    this.fallback = opts.fallback ?? new TemplateCompressor();

    if (opts.client) {
      this.create = opts.client.chat.completions.create;
    } else {
      // Real client. Only constructed when no mock is injected (i.e. real usage),
      // so tests never hit the network.
      const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
      this.create = ((body: Parameters<ChatCompletionCreate>[0]) =>
        client.chat.completions.create(body)) as unknown as ChatCompletionCreate;
    }
  }

  async compress(mistake: string, tag?: Tag): Promise<Compressed> {
    try {
      const response = await this.create({
        model: this.model,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt(mistake, tag) },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '';
      const parsed = parseCompressed(raw, tag);
      if (parsed) {
        return parsed;
      }
    } catch {
      // Network/auth/parse failure, fall through to the offline template.
    }
    // Fallback keeps capture working even when the LLM is down or misbehaves.
    return this.fallback.compress(mistake, tag);
  }
}

function userPrompt(mistake: string, tag?: Tag): string {
  const hint = tag ? ` The tag must be ${tag}.` : '';
  return `Correction: ${mistake}${hint}`;
}

/** Parse strict JSON (tolerating code fences); return null if unusable. */
function parseCompressed(raw: string, tagOverride?: Tag): Compressed | null {
  const json = extractJson(raw);
  if (!json) {
    return null;
  }
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return null;
  }
  if (obj === null || typeof obj !== 'object') {
    return null;
  }
  const o = obj as Record<string, unknown>;
  const antiPattern = typeof o.antiPattern === 'string' ? o.antiPattern.trim() : '';
  const fix = typeof o.fix === 'string' ? o.fix.trim() : '';
  // fix is MANDATORY, an empty fix is nagging, so we reject and let the caller fall back.
  if (antiPattern.length === 0 || fix.length === 0) {
    return null;
  }

  const parsedTag = typeof o.tag === 'string' ? o.tag.trim().toUpperCase() : '';
  const tag = tagOverride ?? (TAGS.includes(parsedTag as Tag) ? (parsedTag as Tag) : undefined);
  if (!tag) {
    return null;
  }

  return { tag, antiPattern, fix };
}

/** Strip ```code fences``` and isolate the first {...} object. */
function extractJson(raw: string): string | null {
  const withoutFences = raw.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return withoutFences.slice(start, end + 1);
}
