#!/usr/bin/env node
/**
 * remind CLI.
 *
 * Phase 1: `remind init` only PRINTS the planned bootstrap steps as text.
 * No actual installation happens yet — each real step is marked TODO.
 */

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
    'Phase 1 runs the remind logic fully offline (in-memory + deterministic',
    'adapters). Wiring the real backends is next — see README.md.',
  ];
  console.log(lines.join('\n'));
}

function main(argv: string[]): void {
  const command = argv[0];
  switch (command) {
    case 'init':
      printInit();
      break;
    default:
      console.log('Usage: remind init');
      if (command !== undefined && command !== '--help' && command !== '-h') {
        process.exitCode = 1;
      }
  }
}

main(process.argv.slice(2));
