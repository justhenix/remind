import { pathToFileURL } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { InMemoryStore } from '../memory/in-memory-store.js';
import { TemplateCompressor } from '../capture/template-compressor.js';
import { KeywordEmbedder } from '../recall/keyword-embedder.js';
import { seed } from '../starter/pack.js';
import { createRemindServer, RemindDeps } from './server.js';

export { createRemindServer } from './server.js';
export type { RemindDeps } from './server.js';

/**
 * Build the offline default dependency set (Phase 1 PoC): in-memory store,
 * deterministic template compressor, keyword embedder, seeded starter pack.
 */
export async function createOfflineDeps(): Promise<RemindDeps> {
  const store = new InMemoryStore();
  await seed(store);
  return {
    store,
    compressor: new TemplateCompressor(),
    embedder: new KeywordEmbedder(),
  };
}

/** Start the remind MCP server over stdio using offline defaults. */
export async function main(): Promise<void> {
  const deps = await createOfflineDeps();
  const server = createRemindServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run only when invoked directly (npm run dev / node dist/server/index.js),
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
