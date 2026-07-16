#!/usr/bin/env node
/**
 * remind CLI.
 *
 *  - `remind init`   : Phase 1 text stub — prints the planned bootstrap steps.
 *  - `remind doctor` : smoke-checks the resolved config, the LLM, and Supermemory Local.
 *  - `remind seed`   : loads the starter TASTE pack into the real Supermemory store.
 */
import type { Compressor } from '../src/capture/compressor.js';
import { LlmCompressor } from '../src/capture/llm-compressor.js';
import { SupermemoryLocalStore } from '../src/memory/supermemory-local-store.js';
import { STARTER_PACK, seed } from '../src/starter/pack.js';
import {
  isLlmConfigured,
  isSupermemoryConfigured,
  resolveLlmConfig,
  resolveSupermemoryConfig,
} from '../src/config/index.js';

function printInit(): void {
  const lines = [
    'remind init (Phase 1 — plan only, nothing is installed yet)',
    '',
    'Planned bootstrap steps:',
    '  1. TODO: start Supermemory Local on this machine (embeddings + vector store).',
    '  2. TODO: pull the local Ollama model used for compression.',
    '  3. TODO: register the remind MCP server in your client config (stdio).',
    '  4. TODO: drop a one-line project rule telling agents to call remind_recall',
    '     before writing or editing code.',
    '',
    'Wire real backends via .env (see .env.example), then verify with `remind doctor`.',
  ];
  console.log(lines.join('\n'));
}

/** Never reveal secret values — only whether they are present. */
function mask(value: string | undefined): string {
  return value ? 'set' : 'unset';
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Smoke check. Prints resolved config (secrets masked), runs one real LLM
 * compression, and probes Supermemory Local. Live failures are reported, never
 * thrown — the offline path always works, so we exit 0.
 */
async function doctor(): Promise<void> {
  const llm = resolveLlmConfig();
  const sm = resolveSupermemoryConfig();

  console.log('remind doctor');
  console.log('');
  console.log('Config:');
  console.log(`  LLM provider:     ${llm.provider}`);
  console.log(`  LLM model:        ${llm.model ?? '(unset)'}`);
  console.log(`  LLM base URL:     ${llm.baseURL ?? '(openai default)'}`);
  console.log(`  LLM API key:      ${mask(llm.apiKey)}`);
  console.log(`  Supermemory URL:  ${sm.url}`);
  console.log(`  Supermemory key:  ${mask(sm.apiKey)}`);
  console.log('');

  console.log('LLM check:');
  if (!isLlmConfigured(llm)) {
    console.log('  SKIP — not configured; capture falls back to the offline template compressor.');
  } else {
    try {
      // A throwing fallback surfaces real API/parse failures instead of silently
      // degrading to the template compressor, so the check is meaningful.
      const strict: Compressor = {
        async compress() {
          throw new Error('model returned no usable JSON rule');
        },
      };
      const compressor = new LlmCompressor(llm, { fallback: strict });
      const rule = await compressor.compress(
        'you shipped inline styles again instead of using our design tokens',
        'UI',
      );
      console.log(`  PASS — [${rule.tag}] ${rule.antiPattern} -> ${rule.fix}`);
    } catch (err) {
      console.log(`  FAIL — ${errMessage(err)}`);
    }
  }
  console.log('');

  console.log('Supermemory check:');
  try {
    const store = new SupermemoryLocalStore(sm);
    await store.search('remind health check', 1);
    console.log(`  PASS — reachable at ${sm.url}`);
  } catch (err) {
    console.log(`  FAIL — unreachable at ${sm.url} (${errMessage(err)})`);
    console.log('         hint: start it with `npx supermemory local`');
  }

  process.exitCode = 0;
}

/** Load the starter TASTE pack into the real store (run once after boot). */
async function seedStore(): Promise<void> {
  const sm = resolveSupermemoryConfig();
  if (!isSupermemoryConfigured(sm)) {
    console.log(
      'remind seed: SUPERMEMORY_API_KEY not set — nothing to do ' +
        '(offline mode seeds the in-memory store automatically).',
    );
    return;
  }
  const store = new SupermemoryLocalStore(sm);
  await seed(store);
  console.log(
    `remind seed: loaded ${STARTER_PACK.length} starter rules into Supermemory Local @ ${sm.url}`,
  );
}

async function main(argv: string[]): Promise<void> {
  const command = argv[0];
  switch (command) {
    case 'init':
      printInit();
      break;
    case 'doctor':
      await doctor();
      break;
    case 'seed':
      await seedStore();
      break;
    default:
      console.log('Usage: remind <init | doctor | seed>');
      if (command !== undefined && command !== '--help' && command !== '-h') {
        process.exitCode = 1;
      }
  }
}

main(process.argv.slice(2)).catch((err) => {
  console.error('remind failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
