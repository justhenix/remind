import { config as loadDotenv } from 'dotenv';

/**
 * Load .env once, at import time. This NEVER throws: a missing variable simply
 * resolves to an offline default below. Config is read lazily by the resolvers
 * so tests that never touch config stay fully offline.
 */
loadDotenv();

/** OpenAI-compatible LLM providers remind can route to (config only, no code change). */
export type LlmProviderName = 'gemini' | 'bai' | 'ollama' | 'openai';

export interface LlmConfig {
  provider: LlmProviderName;
  /** OpenAI-compatible base URL. `undefined` means the openai client's own default. */
  baseURL: string | undefined;
  apiKey: string | undefined;
  model: string | undefined;
}

export interface SupermemoryConfig {
  url: string;
  apiKey: string | undefined;
}

// Verified base URLs (see task notes / provider docs).
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const BAI_DEFAULT_URL = 'https://api.b.ai/v1';
const OLLAMA_DEFAULT_URL = 'http://localhost:11434';
const SUPERMEMORY_DEFAULT_URL = 'http://localhost:6767';

/** Read a trimmed, non-empty env var, else undefined. */
function env(name: string): string | undefined {
  const v = process.env[name];
  return v !== undefined && v.trim().length > 0 ? v.trim() : undefined;
}

/** Resolve the active provider from LLM_PROVIDER; default gemini; unknown -> gemini. */
export function resolveLlmProvider(): LlmProviderName {
  const raw = (env('LLM_PROVIDER') ?? 'gemini').toLowerCase();
  if (raw === 'gemini' || raw === 'bai' || raw === 'ollama' || raw === 'openai') {
    return raw;
  }
  return 'gemini';
}

/** Map the active provider to { baseURL, apiKey, model }. Never throws. */
export function resolveLlmConfig(): LlmConfig {
  const provider = resolveLlmProvider();
  switch (provider) {
    case 'gemini':
      return {
        provider,
        baseURL: GEMINI_BASE_URL,
        apiKey: env('GEMINI_API_KEY'),
        model: env('GEMINI_MODEL'),
      };
    case 'bai':
      return {
        provider,
        baseURL: env('BAI_API_URL') ?? BAI_DEFAULT_URL,
        apiKey: env('BAI_API_KEY'),
        model: env('BAI_MODEL'),
      };
    case 'ollama':
      return {
        provider,
        baseURL: `${env('OLLAMA_URL') ?? OLLAMA_DEFAULT_URL}/v1`,
        // Ollama's OpenAI-compatible endpoint ignores the key but the client requires one.
        apiKey: 'ollama',
        model: env('OLLAMA_MODEL'),
      };
    case 'openai':
      return {
        provider,
        baseURL: undefined,
        apiKey: env('OPENAI_API_KEY'),
        model: env('OPENAI_MODEL'),
      };
  }
}

/** Resolve Supermemory Local config. url always defaults; apiKey may be undefined. */
export function resolveSupermemoryConfig(): SupermemoryConfig {
  return {
    url: env('SUPERMEMORY_API_URL') ?? SUPERMEMORY_DEFAULT_URL,
    apiKey: env('SUPERMEMORY_API_KEY'),
  };
}

/** LLM usable only when we have both a key and a model to send. */
export function isLlmConfigured(cfg: LlmConfig = resolveLlmConfig()): boolean {
  return Boolean(cfg.apiKey && cfg.model);
}

/** Supermemory Local requires an API key (printed on first boot); no key => offline. */
export function isSupermemoryConfigured(
  cfg: SupermemoryConfig = resolveSupermemoryConfig(),
): boolean {
  return Boolean(cfg.apiKey);
}
