import { pathToFileURL } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { MemoryStore } from '../memory/store.js';
import type { Compressor } from '../capture/compressor.js';
import { InMemoryStore } from '../memory/in-memory-store.js';
import { SupermemoryLocalStore } from '../memory/supermemory-local-store.js';
import { TemplateCompressor } from '../capture/template-compressor.js';
import { LlmCompressor } from '../capture/llm-compressor.js';
import { seed } from '../starter/pack.js';
import {
  isLlmConfigured,
  isSupermemoryConfigured,
  resolveLlmConfig,
  resolveSupermemoryConfig,
} from '../config/index.js';
import { createRemindServer, RemindDeps } from './server.js';

export { createRemindServer } from './server.js';
export type { RemindDeps } from './server.js';

/**
 * Offline default dependency set (Phase 1 PoC): in-memory store seeded with the
 * starter pack + deterministic template compressor. Used by the test suite.
 */
export async function createOfflineDeps(): Promise<RemindDeps> {
  const store = new InMemoryStore();
  await seed(store);
  return { store, compressor: new TemplateCompressor() };
}

/**
 * Resolve real dependencies from config, falling back to offline defaults per layer:
 *  - Supermemory Local when SUPERMEMORY_API_KEY is set, else a seeded in-memory store.
 *  - LlmCompressor when an LLM key+model are set, else the template compressor.
 *
 * Backend selection is logged to STDERR (stdout is reserved for the stdio transport).
 * The real store is intentionally NOT seeded here — seeding on every boot would spam
 * duplicates. Load the starter pack once with `remind seed` instead.
 */
export async function createDeps(): Promise<RemindDeps> {
  const smConfig = resolveSupermemoryConfig();
  const llmConfig = resolveLlmConfig();

  let store: MemoryStore;
  if (isSupermemoryConfigured(smConfig)) {
    store = new SupermemoryLocalStore(smConfig);
    console.error(`[remind] memory: Supermemory Local @ ${smConfig.url}`);
  } else {
    const mem = new InMemoryStore();
    await seed(mem);
    store = mem;
    console.error('[remind] memory: in-memory (offline), seeded with starter pack');
  }

  let compressor: Compressor;
  if (isLlmConfigured(llmConfig)) {
    compressor = new LlmCompressor(llmConfig);
    console.error(`[remind] compressor: LLM (${llmConfig.provider}/${llmConfig.model})`);
  } else {
    compressor = new TemplateCompressor();
    console.error('[remind] compressor: template (offline)');
  }

  return { store, compressor };
}

/** Start the remind MCP server over stdio using config-resolved dependencies. */
export async function main(): Promise<void> {
  const deps = await createDeps();
  const server = createRemindServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run only when invoked directly (npm run dev / node dist/src/server/index.js),
// so importing this module (e.g. from tests) has no side effects.
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((err) => {
    console.error('remind server failed to start:', err);
    process.exit(1);
  });
}
